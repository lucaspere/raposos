import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

import type { ProtoGrpcType } from '@raposos/proto/dist/ledger';

const PROTO_PATH = path.join(__dirname, '../../../packages/proto/ledger.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = (grpc.loadPackageDefinition(packageDefinition) as unknown) as ProtoGrpcType;

export const ledgerClient = new protoDescriptor.ledger.LedgerService(
    process.env.CORE_LEDGER_URL || 'localhost:50051',
    grpc.credentials.createInsecure()
);
