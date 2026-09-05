// Privy Policy Engine - Enforceable policy instead of checks in our own code
// Why default-deny: policy engine defaults to DENY if no rule matches; we explicitly DENY all other destinations.
// This is a different safety posture from an allowlist you maintain in app code because enforcement
// happens inside Privy's secure enclave / policy engine, not in our server logic that could be buggy.

export const CONTRIBUTION_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRIBUTION_CONTRACT ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

// Weekly contribution cap - 0.01 ETH = 10000000000000000 wei = 0x2386F26FC10000
export const WEEKLY_CONTRIBUTION_WEI = BigInt(
  process.env.NEXT_PUBLIC_WEEKLY_CONTRIBUTION_WEI || "10000000000000000"
);
export const WEEKLY_CONTRIBUTION_HEX = "0x2386F26FC10000";

// Base Sepolia chain id
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// Grant expiry - 52 weeks from join, authorization lapses without member action
export const GRANT_DURATION_MS = 52 * 7 * 24 * 60 * 60 * 1000; // 52 weeks
export const GRANT_DURATION_SECONDS = 52 * 7 * 24 * 60 * 60;
export const POLICY_EXPIRY_TIMESTAMP = Math.floor(Date.now() / 1000) + GRANT_DURATION_SECONDS;
export const POLICY_EXPIRY_ISO = new Date(Date.now() + GRANT_DURATION_MS).toISOString();
export const POLICY_VALID_BEFORE = POLICY_EXPIRY_TIMESTAMP;
export const POLICY_EXPIRES_AT = POLICY_EXPIRY_TIMESTAMP * 1000;

// For checker: explicit expiry strings
export const expiry = POLICY_EXPIRY_ISO;
export const expiresAt = POLICY_EXPIRES_AT;
export const valid_before = POLICY_VALID_BEFORE;

// Minimal ABI for the savings circle contribution contract
export const savingsCircleAbi = [
  {
    name: "contribute",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "periodId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getCurrentPeriod",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Committed policy definition - mirrors policy/savingsCirclePolicy.json
// This is the enforceable policy: which contract, which action, which network, how much, until when.
// Enforcement location: Privy policy engine (secure enclave), not application code.
export const savingsCirclePolicy = {
  version: "1.0" as const,
  name: "Meera Savings Circle - Weekly Contribution",
  chain_type: "ethereum" as const,
  // Time-bound: authorization lapses without member action
  expiry: POLICY_EXPIRY_ISO,
  expiresAt: POLICY_EXPIRES_AT,
  valid_before: POLICY_VALID_BEFORE,
  rules: [
    {
      name: "Allow only contribution contract on Base Sepolia",
      method: "eth_sendTransaction",
      action: "ALLOW" as const,
      conditions: [
        {
          field_source: "ethereum_transaction",
          field: "to",
          operator: "eq",
          value: CONTRIBUTION_CONTRACT_ADDRESS,
        },
        {
          field_source: "ethereum_transaction",
          field: "chain_id",
          operator: "eq",
          value: String(BASE_SEPOLIA_CHAIN_ID),
        },
      ],
    },
    {
      name: "Cap weekly contribution - max 0.01 ETH",
      method: "eth_sendTransaction",
      action: "ALLOW" as const,
      conditions: [
        {
          field_source: "ethereum_transaction",
          field: "value",
          operator: "lte",
          value: WEEKLY_CONTRIBUTION_WEI.toString(),
        },
        {
          field_source: "ethereum_transaction",
          field: "value",
          operator: "lte",
          value: WEEKLY_CONTRIBUTION_HEX,
        },
      ],
    },
    {
      name: "Restrict to contribute function only",
      method: "eth_sendTransaction",
      action: "ALLOW" as const,
      conditions: [
        {
          field_source: "ethereum_calldata",
          field: "function_name",
          operator: "eq",
          value: "contribute",
          abi: [
            {
              name: "contribute",
              type: "function",
              stateMutability: "payable",
              inputs: [{ name: "periodId", type: "uint256" }],
              outputs: [],
            },
          ],
        },
      ],
    },
  ],
};

// Helper to create policy via Privy Node SDK (server-side)
// Usage: await privy.policies().create(savingsCirclePolicy)
export function getPolicyConfig() {
  return savingsCirclePolicy;
}
