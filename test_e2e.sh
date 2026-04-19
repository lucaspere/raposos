#!/bin/bash
set -e

terminate_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$port" | xargs kill >/dev/null 2>&1 || true
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" || true
  fi
}

terminate_port 3000
terminate_port 50051

wait_for_port() {
  local port="$1"
  local retries=30

  while [ $retries -gt 0 ]; do
    if lsof -i tcp:"$port" >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
    retries=$((retries - 1))
  done

  echo "Timed out waiting for port $port"
  return 1
}

echo "Starting infrastructure..."
docker compose up -d postgres rabbitmq
sleep 5

echo "Dropping and recreating database schema to wipe state..."
docker compose exec -T postgres psql -U raposos -d ledger -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U raposos -d ledger < packages/database/migrations/20240101000000_init.up.sql

echo "Starting core-ledger..."
DATABASE_URL=postgres://raposos:password@localhost:5432/ledger RUSTC_WRAPPER= cargo run --manifest-path services/core-ledger/Cargo.toml > /tmp/raposos-core-ledger.log 2>&1 &
CORE_PID=$!

echo "Starting api-gateway..."
DATABASE_URL=postgres://raposos:password@localhost:5432/ledger npm --workspace api-gateway run dev > /tmp/raposos-api-gateway.log 2>&1 &
DEV_PID=$!

wait_for_port 50051
wait_for_port 3000

echo "Creating company..."
COMPANY_ID=$(curl -s -X POST http://localhost:3000/companies -H "Content-Type: application/json" -d '{"legal_name":"Tech Corp", "tax_id":"12345678000199"}' | grep -o 'company_id":"[^"]*' | cut -d'"' -f3)
echo "Company ID: $COMPANY_ID"

echo "Creating contractor..."
CONTRACTOR_ID=$(curl -s -X POST http://localhost:3000/contractors -H "Content-Type: application/json" -d '{"full_name":"John Doe", "br_tax_id":"12345678901", "pix_key":"john@example.com"}' | grep -o 'contractor_id":"[^"]*' | cut -d'"' -f3)
echo "Contractor ID: $CONTRACTOR_ID"

echo "Creating wallet..."
WALLET_ID=$(curl -s -X POST http://localhost:3000/wallets -H "Content-Type: application/json" -d "{\"owner_id\":\"$CONTRACTOR_ID\", \"address\":\"0x1111222233334444555566667777888899990000\"}" | grep -o 'wallet_id":"[^"]*' | cut -d'"' -f3)
echo "Wallet ID: $WALLET_ID"

echo "Testing GET /contractors/:id endpoint (Profile Fetch)..."
curl -s http://localhost:3000/contractors/$CONTRACTOR_ID
echo ""

echo "Publishing mock deposit event to RabbitMQ..."
docker compose exec -T rabbitmq rabbitmqadmin -u raposos -p password publish exchange=amq.default routing_key=deposit_confirmed payload="{\"contractor_id\":\"$CONTRACTOR_ID\",\"amount\":\"100.00\",\"tx_hash\":\"0xabcd1234\"}"

echo "Publishing duplicate deposit event to validate idempotency..."
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

v=$(docker compose exec -T postgres psql -U raposos -d ledger -c "SELECT tx_type, status, amount, related_transaction_id, tx_hash FROM ledger_transactions ORDER BY created_at; SELECT event_type, token_amount, total_brl_value, capital_gain FROM tax_records ORDER BY event_type;")
echo "$v"

echo "Cleaning up..."
kill $DEV_PID
kill $CORE_PID
