CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    br_tax_id VARCHAR(255) NOT NULL UNIQUE,
    pix_key VARCHAR(255) NOT NULL
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES contractors(id),
    address VARCHAR(255) NOT NULL UNIQUE
);

CREATE TYPE invoice_status AS ENUM ('PENDING', 'FUNDED', 'SETTLED');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    contractor_id UUID NOT NULL REFERENCES contractors(id),
    amount_due DECIMAL(36,18) NOT NULL,
    asset VARCHAR(10) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'PENDING'
);

CREATE TYPE ledger_tx_type AS ENUM ('DEPOSIT', 'CRYPTO_WITHDRAWAL', 'FIAT_OFFRAMP');
CREATE TYPE ledger_tx_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES contractors(id),
    invoice_id UUID REFERENCES invoices(id),
    tx_type ledger_tx_type NOT NULL,
    amount DECIMAL(36,18) NOT NULL,
    tx_hash VARCHAR(255),
    status ledger_tx_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE tax_event_type AS ENUM ('ACQUISITION', 'DISPOSAL');

CREATE TABLE tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
    event_type tax_event_type NOT NULL,
    token_amount DECIMAL(36,18) NOT NULL,
    brl_exchange_rate DECIMAL(10,4) NOT NULL,
    total_brl_value DECIMAL(18,2) NOT NULL,
    capital_gain DECIMAL(18,2)
);
