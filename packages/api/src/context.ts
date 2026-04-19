import type { Client } from 'pg';
import type { LedgerServiceClient } from '@raposos/proto/dist/ledger/LedgerService';

export interface Context {
  db: Client;
  ledger: LedgerServiceClient;
}
