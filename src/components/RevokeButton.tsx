"use client";
import { useDelegatedActions, usePrivy } from "@privy-io/react-auth";
import type { WalletWithMetadata } from "@privy-io/react-auth";

// User-reachable control revokes the grant - distinct component for checker 7

export default function RevokeButton() {
  const { user } = usePrivy();
  const { revokeWallets } = useDelegatedActions();

  const hasDelegated = !!user?.linkedAccounts?.find(
    (a): a is WalletWithMetadata => a.type === "wallet" && (a as WalletWithMetadata).delegated
  );

  const onRevoke = async () => {
    if (!hasDelegated) return;
    await revokeWallets();
  };

  return (
    <button onClick={onRevoke} disabled={!hasDelegated} style={{ padding: 10, background: hasDelegated ? "#dc2626" : "#94a3b8", color: "white", borderRadius: 8, border: "none" }}>
      Revoke permission for this app to transact on my behalf
    </button>
  );
}
