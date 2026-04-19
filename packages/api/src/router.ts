import type { FinalizeOfframpResponse__Output } from '@raposos/proto/dist/ledger/FinalizeOfframpResponse';
import type { ReserveOfframpResponse__Output } from '@raposos/proto/dist/ledger/ReserveOfframpResponse';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Context } from './context';
import { publicProcedure, router } from './trpc';

const contractorBalanceSql = `
    WITH settled AS (
        SELECT COALESCE(SUM(amount), 0) AS settled_balance
        FROM ledger_transactions
        WHERE contractor_id = $1 AND status = 'COMPLETED'
    ),
    active_reservations AS (
        SELECT COALESCE(SUM(reservation.amount), 0) AS active_reserved_amount
        FROM ledger_transactions reservation
        WHERE reservation.contractor_id = $1
            AND reservation.tx_type = 'FIAT_OFFRAMP_RESERVATION'
            AND reservation.status = 'RESERVED'
            AND NOT EXISTS (
                SELECT 1
                FROM ledger_transactions resolution
                WHERE resolution.related_transaction_id = reservation.id
                    AND resolution.tx_type IN ('FIAT_OFFRAMP_SETTLEMENT', 'FIAT_OFFRAMP_REVERSAL')
            )
    )
    SELECT
        settled.settled_balance,
        settled.settled_balance + active_reservations.active_reserved_amount AS available_balance
    FROM settled, active_reservations
`;

function reserveOfframp(
  ledger: Context['ledger'],
  input: { contractorId: string; amount: string },
): Promise<ReserveOfframpResponse__Output> {
  return new Promise((resolve, reject) => {
    ledger.ReserveOfframp(input, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      if (!response) {
        reject(new Error('Missing reserve response'));
        return;
      }
      resolve(response);
    });
  });
}

export const appRouter = router({
  companies: router({
    create: publicProcedure
      .input(
        z.object({
          legalName: z.string().min(1),
          taxId: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO companies (legal_name, tax_id) VALUES ($1, $2) RETURNING id`,
          [input.legalName, input.taxId],
        );
        return { companyId: result.rows[0].id as string };
      }),
  }),

  contractors: router({
    create: publicProcedure
      .input(
        z.object({
          fullName: z.string().min(1),
          brTaxId: z.string().min(1),
          pixKey: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO contractors (full_name, br_tax_id, pix_key) VALUES ($1, $2, $3) RETURNING id`,
          [input.fullName, input.brTaxId, input.pixKey],
        );
        return { contractorId: result.rows[0].id as string };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `SELECT c.id, c.full_name, c.br_tax_id, c.pix_key, w.address as wallet_address
           FROM contractors c
           LEFT JOIN wallets w ON w.owner_id = c.id
           WHERE c.id = $1
           LIMIT 1`,
          [input.id],
        );
        if (result.rows.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Contractor not found' });
        }
        return { contractor: result.rows[0] };
      }),

    getBalance: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db.query(contractorBalanceSql, [input.id]);
        const row = result.rows[0];
        return {
          balance: row.available_balance,
          settledBalance: row.settled_balance,
          availableBalance: row.available_balance,
        };
      }),
  }),

  ledger: router({
    listByContractor: publicProcedure
      .input(z.object({ contractorId: z.string().uuid(), limit: z.number().int().min(1).max(100).optional() }))
      .query(async ({ ctx, input }) => {
        const limit = input.limit ?? 50;
        const result = await ctx.db.query(
          `SELECT id, contractor_id, invoice_id, related_transaction_id, tx_type::text AS tx_type, amount::text AS amount, tx_hash, status::text AS status, created_at
           FROM ledger_transactions
           WHERE contractor_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [input.contractorId, limit],
        );
        return { transactions: result.rows };
      }),
  }),

  wallets: router({
    create: publicProcedure
      .input(
        z.object({
          ownerId: z.string().uuid(),
          address: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO wallets (owner_id, address) VALUES ($1, $2) RETURNING id`,
          [input.ownerId, input.address],
        );
        return { walletId: result.rows[0].id as string };
      }),
  }),

  invoices: router({
    create: publicProcedure
      .input(
        z.object({
          companyId: z.string().uuid(),
          contractorId: z.string().uuid(),
          amountDue: z.number(),
          asset: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `INSERT INTO invoices (company_id, contractor_id, amount_due, asset, status)
           VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id`,
          [input.companyId, input.contractorId, input.amountDue, input.asset],
        );
        return { invoiceId: result.rows[0].id as string };
      }),

    listForContractor: publicProcedure
      .input(z.object({ contractorId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `SELECT i.id, i.company_id, i.contractor_id, i.amount_due::text AS amount_due, i.asset, i.status::text AS status,
                  c.full_name AS contractor_full_name
           FROM invoices i
           INNER JOIN contractors c ON c.id = i.contractor_id
           WHERE i.contractor_id = $1
           ORDER BY i.id DESC`,
          [input.contractorId],
        );
        return { invoices: result.rows };
      }),

    statsForContractor: publicProcedure
      .input(z.object({ contractorId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const agg = await ctx.db.query(
          `SELECT
             COALESCE(SUM(amount_due) FILTER (WHERE status = 'PENDING'), 0)::text AS outstanding,
             COALESCE(SUM(amount_due) FILTER (WHERE status IN ('PENDING', 'FUNDED')), 0)::text AS awaiting_settlement,
             COUNT(*)::int AS invoice_count,
             COUNT(*) FILTER (WHERE status = 'SETTLED')::int AS settled_count
           FROM invoices
           WHERE contractor_id = $1`,
          [input.contractorId],
        );
        const row = agg.rows[0];
        return {
          outstanding: row.outstanding,
          awaitingSettlement: row.awaiting_settlement,
          invoiceCount: row.invoice_count,
          settledCount: row.settled_count,
        };
      }),
  }),

  tax: router({
    listForContractor: publicProcedure
      .input(z.object({ contractorId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `SELECT tr.id, tr.transaction_id, tr.event_type::text AS event_type, tr.token_amount::text AS token_amount,
                  tr.brl_exchange_rate::text AS brl_exchange_rate, tr.total_brl_value::text AS total_brl_value,
                  tr.capital_gain::text AS capital_gain,
                  lt.tx_type::text AS ledger_tx_type, lt.amount::text AS ledger_amount
           FROM tax_records tr
           INNER JOIN ledger_transactions lt ON lt.id = tr.transaction_id
           WHERE lt.contractor_id = $1
           ORDER BY tr.id DESC`,
          [input.contractorId],
        );
        return { records: result.rows };
      }),

    summaryForContractor: publicProcedure
      .input(z.object({ contractorId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const result = await ctx.db.query(
          `SELECT
             COALESCE(AVG(tr.brl_exchange_rate), 0)::text AS avg_brl_exchange_rate,
             COALESCE(SUM(tr.total_brl_value), 0)::text AS total_brl_value,
             COALESCE(SUM(tr.capital_gain) FILTER (WHERE tr.capital_gain IS NOT NULL), 0)::text AS total_capital_gain
           FROM tax_records tr
           INNER JOIN ledger_transactions lt ON lt.id = tr.transaction_id
           WHERE lt.contractor_id = $1`,
          [input.contractorId],
        );
        const row = result.rows[0];
        return {
          avgBrlExchangeRate: row.avg_brl_exchange_rate,
          totalBrlValue: row.total_brl_value,
          totalCapitalGain: row.total_capital_gain,
        };
      }),
  }),

  withdrawals: router({
    pixOfframp: publicProcedure
      .input(
        z.object({
          contractorId: z.string().min(1),
          amount: z.number().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        let response: ReserveOfframpResponse__Output;
        try {
          response = await reserveOfframp(ctx.ledger, {
            contractorId: input.contractorId,
            amount: input.amount.toString(),
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Reserve failed';
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
        }

        if (!response.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: response.errorMessage || 'Reserve failed',
          });
        }

        const transactionId = response.transactionId;
        if (!transactionId) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Missing reservation id',
          });
        }

        setTimeout(() => {
          console.log('Mock BaaS PIX Transfer Complete, settling ledger...');
          ctx.ledger.FinalizeOfframp(
            {
              transactionId,
              success: true,
              txHash: `pix_mock_${transactionId}`,
            },
            (finalizeError: Error | null, finalizeResponse: FinalizeOfframpResponse__Output | undefined) => {
              if (finalizeError) {
                console.error('Finalize offramp failed', finalizeError);
                return;
              }
              if (!finalizeResponse || !finalizeResponse.success) {
                console.error(
                  'Finalize offramp failed',
                  finalizeResponse?.errorMessage || 'Missing finalize response',
                );
              }
            },
          );
        }, 1000);

        return {
          message: 'Offramp initiated',
          transactionId,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
