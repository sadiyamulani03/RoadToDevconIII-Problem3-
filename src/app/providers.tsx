"use client";

import { PrivyProvider } from "@privy-io/react-auth";

// Valid-format dummy for build/prerender when env not set; real Vercel env provides actual appId
const FALLBACK_APP_ID = "clxxxxxxxxxxxxxxxxxxxxxxxx";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || FALLBACK_APP_ID}
      config={{
        loginMethods: ["email", "google"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        appearance: {
          theme: "light",
          accentColor: "#0f766e",
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
