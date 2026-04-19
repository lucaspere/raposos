import { appRouter } from '@raposos/api';
import { TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Client } from 'pg';
import { ledgerClient } from './grpc';
import { createSmartWalletForEntity } from './services/turnkey.service';

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

function parseError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Unexpected error';
}

function apiContext() {
    return { db: dbClient, ledger: ledgerClient, createSmartWallet: createSmartWalletForEntity };
}

function trpcHttpStatus(code: TRPCError['code']): number {
    switch (code) {
        case 'NOT_FOUND':
            return 404;
        case 'BAD_REQUEST':
            return 400;
        case 'UNAUTHORIZED':
            return 401;
        case 'FORBIDDEN':
            return 403;
        default:
            return 500;
    }
}

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: () => apiContext(),
    }),
);

app.post('/companies', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.companies.create({
            legalName: req.body.legal_name,
            taxId: req.body.tax_id,
        });
        res.json({ success: true, company_id: out.companyId });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/contractors', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.contractors.create({
            fullName: req.body.full_name,
            brTaxId: req.body.br_tax_id,
            pixKey: req.body.pix_key,
        });
        res.json({ success: true, contractor_id: out.contractorId });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/wallets', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.wallets.create({
            ownerId: req.body.owner_id,
            address: req.body.address,
        });
        res.json({ success: true, wallet_id: out.walletId });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

app.get('/contractors/:id', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.contractors.getById({ id: req.params.id });
        res.json({ success: true, contractor: out.contractor });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

app.get('/contractors/:id/balance', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.contractors.getBalance({ id: req.params.id });
        res.json({
            success: true,
            balance: out.availableBalance,
            settled_balance: out.settledBalance,
            available_balance: out.availableBalance,
        });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

app.post('/invoices', async (req, res) => {
    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.invoices.create({
            companyId: req.body.company_id,
            contractorId: req.body.contractor_id,
            amountDue: req.body.amount_due,
            asset: req.body.asset,
        });
        res.json({ success: true, invoice_id: out.invoiceId });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
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

    const caller = appRouter.createCaller(apiContext());
    try {
        const out = await caller.withdrawals.pixOfframp({
            contractorId: contractor_id,
            amount,
        });
        res.json({
            success: true,
            message: out.message,
            transaction_id: out.transactionId,
        });
    } catch (error: unknown) {
        if (error instanceof TRPCError) {
            return res.status(trpcHttpStatus(error.code)).json({ error: error.message });
        }
        res.status(500).json({ error: parseError(error) });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
