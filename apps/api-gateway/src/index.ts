import type { FinalizeOfframpResponse__Output } from '@raposos/proto/dist/ledger/FinalizeOfframpResponse';
import type { ReserveOfframpResponse__Output } from '@raposos/proto/dist/ledger/ReserveOfframpResponse';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Client } from 'pg';
import { ledgerClient } from './grpc';

dotenv.config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const dbClient = new Client({
    connectionString:
        process.env.DATABASE_URL ||
        'postgres://raposos:password@localhost:5432/ledger',
});

dbClient.connect().catch(console.error);

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

function parseError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Unexpected error';
}

app.post('/companies', async (req, res) => {
    const { legal_name, tax_id } = req.body;
    try {
        const result = await dbClient.query(
            `
            INSERT INTO companies (legal_name, tax_id)
            VALUES ($1, $2) RETURNING id
        `,
            [legal_name, tax_id],
        );

        res.json({ success: true, company_id: result.rows[0].id });
    } catch (error: unknown) {
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/contractors', async (req, res) => {
    const { full_name, br_tax_id, pix_key } = req.body;
    try {
        const result = await dbClient.query(
            `
            INSERT INTO contractors (full_name, br_tax_id, pix_key)
            VALUES ($1, $2, $3) RETURNING id
        `,
            [full_name, br_tax_id, pix_key],
        );

        res.json({ success: true, contractor_id: result.rows[0].id });
    } catch (error: unknown) {
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/wallets', async (req, res) => {
    const { owner_id, address } = req.body;
    try {
        const result = await dbClient.query(
            `
            INSERT INTO wallets (owner_id, address)
            VALUES ($1, $2) RETURNING id
        `,
            [owner_id, address],
        );

        res.json({ success: true, wallet_id: result.rows[0].id });
    } catch (error: unknown) {
        res.status(500).json({ error: parseError(error) });
    }
});

app.get('/contractors/:id/balance', async (req, res) => {
    const contractor_id = req.params.id;
    try {
        const result = await dbClient.query(contractorBalanceSql, [contractor_id]);

        res.json({
            success: true,
            balance: result.rows[0].available_balance,
            settled_balance: result.rows[0].settled_balance,
            available_balance: result.rows[0].available_balance,
        });
    } catch (error: unknown) {
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/invoices', async (req, res) => {
    const { company_id, contractor_id, amount_due, asset } = req.body;
    try {
        const result = await dbClient.query(
            `
            INSERT INTO invoices (company_id, contractor_id, amount_due, asset, status)
            VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id
        `,
            [company_id, contractor_id, amount_due, asset],
        );

        res.json({ success: true, invoice_id: result.rows[0].id });
    } catch (error: unknown) {
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/withdrawals/pix', async (req, res) => {
    const { contractor_id, amount } = req.body as {
        contractor_id?: string;
        amount?: number;
    };

    if (!contractor_id || typeof contractor_id !== 'string') {
        return res.status(400).json({ error: 'contractor_id is required' });
    }

    if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number' });
    }

    ledgerClient.ReserveOfframp(
        { contractorId: contractor_id, amount: amount.toString() },
        (
            error: Error | null,
            response: ReserveOfframpResponse__Output | undefined,
        ) => {
            if (error) {
                return res.status(500).json({ error: error.message });
            }

            if (!response) {
                return res.status(500).json({ error: 'Missing reserve response' });
            }

            if (!response.success) {
                return res.status(400).json({ error: response.errorMessage || 'Reserve failed' });
            }

            const transactionId = response.transactionId;

            if (!transactionId) {
                return res.status(500).json({ error: 'Missing reservation id' });
            }

            setTimeout(() => {
                console.log('Mock BaaS PIX Transfer Complete, settling ledger...');
                ledgerClient.FinalizeOfframp(
                    {
                        transactionId,
                        success: true,
                        txHash: `pix_mock_${transactionId}`,
                    },
                    (
                        finalizeError: Error | null,
                        finalizeResponse: FinalizeOfframpResponse__Output | undefined,
                    ) => {
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

            res.json({
                success: true,
                message: 'Offramp initiated',
                transaction_id: transactionId,
            });
        },
    );
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
