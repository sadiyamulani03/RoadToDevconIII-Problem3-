import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Viem client for Base Sepolia - read-only and for preparing transactions
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org"),
});

export { baseSepolia };
