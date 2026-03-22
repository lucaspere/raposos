#!/bin/bash
set -e

fuser -k 3000/tcp || true
fuser -k 50051/tcp || true

echo "Starting infrastructure..."
docker compose up -d postgres rabbitmq
sleep 5

echo "Dropping and recreating database schema to wipe state..."
docker compose exec -T postgres psql -U raposos -d ledger -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U raposos -d ledger < packages/database/migrations/20240101000000_init.up.sql

echo "Starting core-ledger..."
cargo run --manifest-path services/core-ledger/Cargo.toml > /dev/null 2>&1 &
CORE_PID=$!

echo "Starting api-gateway..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

sleep 10 # wait for compilation and startup

echo "Creating company..."
COMPANY_ID=$(curl -s -X POST http://localhost:3000/companies -H "Content-Type: application/json" -d '{"legal_name":"Tech Corp", "tax_id":"12345678000199"}' | grep -o 'company_id":"[^"]*' | cut -d'"' -f3)
echo "Company ID: $COMPANY_ID"

echo "Creating contractor..."
CONTRACTOR_ID=$(curl -s -X POST http://localhost:3000/contractors -H "Content-Type: application/json" -d '{"full_name":"John Doe", "br_tax_id":"12345678901", "pix_key":"john@example.com"}' | grep -o 'contractor_id":"[^"]*' | cut -d'"' -f3)
echo "Contractor ID: $CONTRACTOR_ID"

echo "Creating wallet..."
WALLET_ID=$(curl -s -X POST http://localhost:3000/wallets -H "Content-Type: application/json" -d "{\"owner_id\":\"$CONTRACTOR_ID\", \"address\":\"0x1111222233334444555566667777888899990000\"}" | grep -o 'wallet_id":"[^"]*' | cut -d'"' -f3)
echo "Wallet ID: $WALLET_ID"

echo "Publishing mock deposit event to RabbitMQ..."
docker compose exec -T rabbitmq rabbitmqadmin -u raposos -p password publish exchange=amq.default routing_key=deposit_confirmed payload="{\"contractor_id\":\"$CONTRACTOR_ID\",\"amount\":\"100.00\",\"tx_hash\":\"0xabcd1234\"}"

sleep 3 # wait for consumer

echo "Checking balance..."
curl -s http://localhost:3000/contractors/$CONTRACTOR_ID/balance
echo ""

echo "Triggering PIX off-ramp..."
curl -s -X POST http://localhost:3000/withdrawals/pix -H "Content-Type: application/json" -d "{\"contractor_id\":\"$CONTRACTOR_ID\", \"amount\": 50.00}"
echo ""

sleep 3 # wait for mock baas webhook

echo "Checking final balance..."
curl -s http://localhost:3000/contractors/$CONTRACTOR_ID/balance
echo ""

v=$(docker compose exec -T postgres psql -U raposos -d ledger -c "SELECT * FROM tax_records;")
echo "$v"

echo "Cleaning up..."
kill $DEV_PID
kill $CORE_PID
