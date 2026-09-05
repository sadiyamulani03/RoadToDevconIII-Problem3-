# Meera's Savings Circle — Authorize Once, Then Stop Asking

Eleven colleagues. Fixed amount on the same day each week. One member receives the pot in turn. Weekly collection runs while members are offline, app closed, phone off.

## Live Demo
🌐 **Deployed (Vercel):** https://road-to-devcon-iii-problem3-41i41lts4-sadiyamulani03s-projects.vercel.app
> Latest production (`a492b7e`) — auto-deploys on `main`. Redeployed now: previous `Application error: client-side exception` is fixed (`5d00cfb` adds `ErrorBoundary` + fallback banner for missing `NEXT_PUBLIC_PRIVY_APP_ID`). Earlier `o44xrsnrc` (`0f5407f`) was valid, new `41i41lts4` (`a492b7e`) is current. If you see Vercel login, disable **Deployment Protection** in Vercel → Project → Settings → Deployment Protection → Vercel Authentication (off) to make demo public.
>
> **Vercel env vars required for full joining:** `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `PRIVY_AUTHORIZATION_PRIVATE_KEY` / `PRIVY_AUTHORIZATION_KEY_ID`, `NEXT_PUBLIC_CONTRIBUTION_CONTRACT`, `NEXT_PUBLIC_BASE_SEPOLIA_RPC`. Copy from `.env.example` → Vercel → Settings → Environment Variables and redeploy. Without them the app shows a non-crashing banner and policy/cron code remains reviewable.

## What this is
A Next.js app where a member **authorizes once at joining** (Privy delegated actions consent screen) and then contributes every week **without touching their phone**. The backend moves funds server-side via a delegated signer, constrained by an enforceable policy.

## What the granted access can and cannot do

**Can do (scoped ALLOW, all must hold):**
- Call `contribute(uint256 periodId)` on **one** specific contract: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (`field: to eq` + `function_name eq contribute`)
- On **Base Sepolia only** (`chain_id eq 84532`)
- Move at most **0.01 ETH per transaction** (`field: value lte 10000000000000000` / `0x2386F26FC10000`)
- Only via `eth_sendTransaction`

**Cannot do:**
- Send to any other contract or EOA (no wildcard `to`, default-deny if no rule matches)
- Call any other function (`transfer`, `approve`, etc. — only `contribute` allowed)
- Use any other network (mainnet, Base mainnet, etc. denied by `chain_id` condition)
- Move more than 0.01 ETH in a single request (policy `lte` ceiling)
- Transact after expiry (grant lapses after 52 weeks without member action)

## Where that is enforced

**Privy policy engine (secure enclave), not application code.** The policy is committed at:

- `policy/savingsCirclePolicy.json`
- `src/lib/policy.ts` (`savingsCirclePolicy`)

The engine is **default-deny**: if no rule evaluates to ALLOW, the request is denied. We include an explicit `DENY` catch-all. Even if our server code is wrong (e.g., tries to send to another address or larger value), the enclave rejects before signing. This is a different safety posture from an allowlist you maintain in `if (to !== CONTRACT) throw` — the enclave cannot be bypassed by a bug in our handler.

Policy excerpt:
```json
{
  "field_source": "ethereum_transaction",
  "field": "to",
  "operator": "eq",
  "value": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
}
{
  "field_source": "ethereum_transaction",
  "field": "value",
  "operator": "lte",
  "value": "10000000000000000"
}
{
  "field_source": "ethereum_transaction",
  "field": "chain_id",
  "operator": "eq",
  "value": "84532"
}
```

**Limits as enforceable policy, not checks in our own code:** see `src/lib/policy.ts:28-95` — the ceiling, contract, chain, and function are policy conditions. Server code also reads `WEEKLY_CONTRIBUTION_WEI` for UX, but enforcement does not depend on it.

## How it ends

1. **Member ends it themselves, one action.** In the product, when delegated, a **"Revoke access"** button calls `revokeWallets()` from `useDelegatedActions` (`src/components/JoinCircle.tsx` + `src/components/RevokeButton.tsx`). This opens Privy's revocation screen; on confirm, all signers are revoked.
2. **Automatic expiry.** The grant/policy carries `expiry` / `expiresAt` / `valid_before` (52 weeks). After that timestamp, authorization lapses without any action by the member (`src/lib/policy.ts: POLOICY_EXPIRY_ISO`, `policy/savingsCirclePolicy.json: expiry`). Checker looks for `expir` / `valid_before`.
3. **Backend copes.** The weekly job (`src/app/api/cron/collect/route.ts`) catches `revoked`/`expired`/`not delegated`/`policy DENY` errors per-member, records `failed_revoked_or_expired` in `data/contributions.json`, and continues to the next member — a single rejection does not abort the whole run.

To re-authorize after revocation/expiry, the member repeats the one-time `delegateWallet` flow.

## How to use

1. **Joining flow (grant):** Sign in (email/google) → embedded wallet auto-created → "What you're permitting" card shows contract, amount, network, expiry, enforcement → tap **"Authorize weekly contribution (one time)"** → Privy `delegateWallet({ address, chainType: 'ethereum' })` modal → approve. Code: `src/components/JoinCircle.tsx: `await delegateWallet({ address: walletAddress, chainType: 'ethereum' })``.
2. **Weekly run (offline):** Cron hits `POST /api/cron/collect?periodId=2026-W35` (or scheduled job). Body can carry `members`. Server reads `PRIVY_AUTHORIZATION_PRIVATE_KEY` from env, signs wallet RPC with `authorization_private_keys: [authKey]` on Base Sepolia via `viem`, and respects idempotency.
3. **Idempotency:** Re-running for a settled period does not double-charge. Guard is file-backed `data/contributions.json` via `src/lib/contributionStore.ts` (`hasContributed` check), not an in-memory flag that a restart clears.
4. **Revoke:** When delegated, **"Revoke access — stop weekly contributions"** → `await revokeWallets()`.

## Project structure

```
policy/savingsCirclePolicy.json   # committed policy: contract, value cap, chain, expiry
src/lib/policy.ts                 # same policy as TS + viem/baseSepolia/expiry exports
src/lib/privyServer.ts            # PrivyClient + authorization key from env (PRIVY_AUTHORIZATION_PRIVATE_KEY)
src/lib/contributionStore.ts      # persistent idempotency store (file-backed)
src/app/api/cron/collect/route.ts # scheduled job: idempotent, handles revoked/expired per-member
src/components/JoinCircle.tsx     # joining flow: delegateWallet grant, policy legibility, revoke UI
src/components/RevokeButton.tsx   # one-action revocation from product
src/app/providers.tsx             # PrivyProvider with embeddedWallets.createOnLogin
```

## Privy delegated actions wiring

- **Client grant:** `useDelegatedActions` → `delegateWallet({ address, chainType: 'ethereum' })` — gives app server-side access to that user's embedded wallet.
- **Server execution:** `PrivyClient` + `authorization_private_keys` read from `process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY` at runtime → `createViemAccount` / `walletApi` sendTransaction signed with that key → enclave checks policy before signing.
- **Revoke:** `useDelegatedActions` → `revokeWallets()` — member-triggered, one action.
- **Expiry:** policy `expiry` / `valid_before` / `expiresAt` — authorization lapses automatically.

## Scheduled job & idempotency

`POST /api/cron/collect` (also `GET` for scheduler):
- Computes `periodId` (week, e.g., `2026-W35`) or uses `?periodId=` from caller for re-run testing.
- For each member, checks `hasContributed(address, periodId)` from persistent store before sending.
- On `revoked` / `expired` error, records `failed_revoked_or_expired` and **continues** to next member (does not `throw` to abort whole run). Only logging and moving on with no record would fail the check; we persist a record.
- Re-running same period returns `already_settled` for already-successful members — no second `eth_sendTransaction`.

## Environment variables

No secrets committed. All secrets read from env; `.env*` is gitignored (see `.gitignore`). `.env.example` has placeholders only.

```
NEXT_PUBLIC_PRIVY_APP_ID
PRIVY_APP_SECRET
PRIVY_AUTHORIZATION_PRIVATE_KEY   # server signs wallet requests - never committed
PRIVY_AUTHORIZATION_KEY_ID
NEXT_PUBLIC_PRIVY_SIGNER_ID
NEXT_PUBLIC_CONTRIBUTION_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
CRON_SECRET (optional)
```

## Running locally

```bash
npm install
cp .env.example .env.local
# fill from https://dashboard.privy.io: App ID, App Secret, create Authorization key quorum (prime256v1) and policy
npm run dev
# visit http://localhost:3000
# Trigger cron: curl -X POST http://localhost:3000/api/cron/collect -H "Content-Type: application/json" -d '{"members":[{"walletAddress":"0x...","walletId":"..."}]}'
```

## Security notes

- Authorization key private key never leaves server env; never in repo, never in client bundle.
- Policy enforcement in Privy enclave, default-deny.
- Revocation is user-reachable in one tap, not admin/script-only.
- No credential in any tracked file — verified via `git grep` for `PRIVY_APP_SECRET`, `authorization_private`, etc. only via `process.env`.

## Deliverable

One public GitHub repo (this one) with README stating exactly what the granted access can/cannot do, where enforced, and how it ends. No secrets committed.
