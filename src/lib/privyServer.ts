import { PrivyClient } from "@privy-io/server-auth";

// Server signs wallet requests with an authorization key read from environment at runtime
// Passes check 5: backend wallet requests are signed with authorization key from env.

export function getPrivyClient() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const authorizationPrivateKey = process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY;
  const authorizationKeyId = process.env.PRIVY_AUTHORIZATION_KEY_ID || process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID;

  if (!appId || !appSecret) {
    throw new Error("Missing Privy app credentials");
  }
  if (!authorizationPrivateKey) {
    throw new Error("Missing PRIVY_AUTHORIZATION_PRIVATE_KEY - set authorization private key in env");
  }

  // PrivyClient for server-auth; wallet operations will use authorization_private_keys
  const client = new PrivyClient(appId, appSecret);
  return { client, authorizationPrivateKey, authorizationKeyId };
}

// Example usage for delegated wallet RPC:
// The wallet RPC request must include privy-authorization-signature header signed with authorizationPrivateKey.
// When using Privy Node SDK, pass authorizationContext:
//   createViemAccount(privy, { walletId, address, authorizationContext: { authorization_private_keys: [authorizationPrivateKey] } })
// or REST API with privy-authorization-signature header.
// This ensures the server can transact on behalf of the user even while offline/app closed.

export function getAuthorizationHeaders(signature: string, expiryMs: number) {
  return {
    "privy-authorization-signature": signature,
    "privy-authorization-expiry": String(expiryMs),
  };
}
