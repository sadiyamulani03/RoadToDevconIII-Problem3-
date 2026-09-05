"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cl_test_placeholder"}
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
