import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { ledgerClient } from './grpc';
import { recordTaxEvent } from './taxEngine';

dotenv.config({ path: '../../.env' }); // try from root

const app = express();
app.use(cors());
app.use(express.json());

const dbClient = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://raposos:password@localhost:5432/ledger'
});

dbClient.connect().catch(console.error);

app.post('/companies', async (req, res) => {
    const { legal_name, tax_id } = req.body;
    try {
        const result = await dbClient.query(`
            INSERT INTO companies (legal_name, tax_id)
            VALUES ($1, $2) RETURNING id
        `, [legal_name, tax_id]);

        res.json({ success: true, company_id: result.rows[0].id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/contractors', async (req, res) => {
    const { full_name, br_tax_id, pix_key } = req.body;
    try {
        const result = await dbClient.query(`
            INSERT INTO contractors (full_name, br_tax_id, pix_key)
            VALUES ($1, $2, $3) RETURNING id
        `, [full_name, br_tax_id, pix_key]);

        res.json({ success: true, contractor_id: result.rows[0].id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/wallets', async (req, res) => {
    const { owner_id, address } = req.body;
    try {
        const result = await dbClient.query(`
            INSERT INTO wallets (owner_id, address)
            VALUES ($1, $2) RETURNING id
        `, [owner_id, address]);

        res.json({ success: true, wallet_id: result.rows[0].id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/contractors/:id/balance', async (req, res) => {
    const contractor_id = req.params.id;
    try {
        const result = await dbClient.query(`
            SELECT COALESCE(SUM(amount), 0) as balance 
            FROM ledger_transactions 
            WHERE contractor_id = $1 AND status = 'COMPLETED'
        `, [contractor_id]);

        res.json({ success: true, balance: result.rows[0].balance });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/invoices', async (req, res) => {
    const { company_id, contractor_id, amount_due, asset } = req.body;
    try {
        const result = await dbClient.query(`
            INSERT INTO invoices (company_id, contractor_id, amount_due, asset, status)
            VALUES ($1, $2, $3, $4, 'PENDING') RETURNING id
        `, [company_id, contractor_id, amount_due, asset]);

        res.json({ success: true, invoice_id: result.rows[0].id });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/withdrawals/pix', async (req, res) => {
    const { contractorId, amount } = req.body;

    // Call Core Ledger via gRPC to lock funds
    ledgerClient.LockFunds({ contractorId, amount: amount.toString() }, async (error: any, response: any) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }

        if (!response.success) {
            return res.status(400).json({ error: response.error_message });
        }

        const transactionId = response.transaction_id;

        // Mock BaaS PIX Transfer Webhook Delay
        setTimeout(async () => {
            console.log("Mock BaaS PIX Transfer Complete, settling ledger...");
            ledgerClient.ConfirmOfframp({ transactionId, success: true, txHash: 'pix_mock_123' }, async (err: any, confirmRes: any) => {
                if (err || !confirmRes.success) {
                    console.error("Confirm offramp failed", err || confirmRes.error_message);
                    return;
                }

                // For MVP: mock the cost basis
                const mockedCostBasis = amount * 4.90;

                try {
                    await recordTaxEvent(dbClient, transactionId, 'DISPOSAL', amount, mockedCostBasis);
                    console.log("Tax recorded for offramp disposal");
                } catch (taxErr) {
                    console.error("Tax err", taxErr);
                }
            });

        }, 1000);

        res.json({ success: true, message: "Offramp initiated", transaction_id: transactionId });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
