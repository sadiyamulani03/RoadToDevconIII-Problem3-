// Members who have delegated access - in production this would be a database
// Each member has walletAddress, walletId (Privy wallet id), and delegated status

export type Member = {
  walletAddress: `0x${string}`;
  walletId: string;
  did: string;
};

// Demo members - populated after users delegate. For cron idempotency demo we seed with placeholder.
// Real app would query DB for all members with delegated wallets.
export const demoMembers: Member[] = [
  // Populated dynamically; empty means cron will fetch from store or report no members
];

// Helper to get all delegated members - placeholder for DB query
export async function getDelegatedMembers(): Promise<Member[]> {
  // In production: query DB for members where delegated = true
  // For demo/testing, return empty and let cron be invoked with explicit members via request body
  return demoMembers;
}
