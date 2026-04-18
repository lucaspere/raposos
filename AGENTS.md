# Repository Guidelines

## Project Structure & Module Organization
This repository is a small monorepo split across apps, shared packages, and Rust services.

- `apps/web`: Next.js frontend (`src/app`, `src/components`, `public/`)
- `apps/api-gateway`: TypeScript/Express API gateway (`src/`)
- `packages/proto`: shared gRPC schema and generated TypeScript types
- `packages/database/migrations`: PostgreSQL schema migrations
- `services/core-ledger`: Rust gRPC ledger service
- `services/chain-indexer`: Rust worker for chain event ingestion

Keep new code inside the owning package or service. Do not mix web UI concerns into `apps/api-gateway` or database logic into the frontend.

## Build, Test, and Development Commands
- `npm run dev`: starts Turbo-managed JS development tasks for the workspace
- `npm run build`: runs workspace builds, including proto generation
- `npm run lint`: runs configured lint/type-check tasks across JS workspaces
- `npm run generate`: regenerates shared proto artifacts in `packages/proto/dist`
- `cargo build --workspace`: builds Rust services in `services/`
- `cargo test --workspace`: runs Rust tests when present
- `./test_e2e.sh`: boots Postgres and RabbitMQ, applies migrations, starts services, and exercises the main flow end to end
- `docker compose up -d postgres rabbitmq`: starts local infrastructure only

## Coding Style & Naming Conventions
TypeScript is `strict` in both apps. Follow existing formatting: 2 spaces in `apps/web`, 4 spaces in `apps/api-gateway`, and standard Rust formatting in `services/`. Use `PascalCase` for React components, `camelCase` for functions and variables, and snake_case only for payload fields or database columns that already use it, such as `tax_id` or `contractor_id`.

Run `npm run lint` before opening a PR. For Rust changes, run `cargo fmt` and `cargo clippy` if available locally.

## Testing Guidelines
There is no large unit-test suite yet, so contributors should validate changes with the closest available checks. At minimum, run the relevant build or lint command for the package you touched. For flow changes spanning API, database, or ledger behavior, run `./test_e2e.sh`. Add tests beside new logic when introducing reusable business rules.

## Commit & Pull Request Guidelines
Git history currently follows concise Conventional Commit style, for example: `feat: initial mvp implementation with nextjs frontend`. Prefer `feat:`, `fix:`, `refactor:`, and `docs:` prefixes.

PRs should include a short problem statement, a summary of changed areas, validation commands you ran, and screenshots for UI updates in `apps/web`. Call out schema, proto, or contract changes explicitly so reviewers can check downstream impact.
