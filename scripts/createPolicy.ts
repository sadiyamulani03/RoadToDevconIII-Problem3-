import { PrivyClient } from "@privy-io/server-auth";
import { savingsCirclePolicy } from "../src/lib/policy";

// Script to create the committed policy in Privy dashboard via Node SDK
// Run: npx tsx scripts/createPolicy.ts
// Requires env: NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET, PRIVY_AUTHORIZATION_KEY_ID

async function main() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const appSecret = process.env.PRIVY_APP_SECRET!;
  const privy = new PrivyClient(appId, appSecret);

  // Create policy that restricts to specific contract, caps value, restricts chain, and expires
  const policy = await privy.policies().create({
    name: savingsCirclePolicy.name,
    version: savingsCirclePolicy.version,
    chain_type: savingsCirclePolicy.chain_type,
    rules: savingsCirclePolicy.rules as any,
    // owner_id would be your authorization key quorum id if you use key quorums
    // owner_id: process.env.PRIVY_AUTHORIZATION_KEY_ID,
  });

  console.log("Created policy:", policy.id);
  console.log("Policy enforces: contract", savingsCirclePolicy.rules[0].conditions[0].value, "value lte", savingsCirclePolicy.rules[1].conditions[0].value, "chain_id", "84532", "expiry", savingsCirclePolicy.expiry);
}

main().catch(console.error);
