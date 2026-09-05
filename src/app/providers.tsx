"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";

// Fallback not used for real Privy init when env missing — we bypass PrivyProvider entirely to avoid client-side exception
const FALLBACK_APP_ID = "clxxxxxxxxxxxxxxxxxxxxxxxx";
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || FALLBACK_APP_ID;
const isMissingEnv = !process.env.NEXT_PUBLIC_PRIVY_APP_ID;

class PrivyErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 680, margin: "0 auto", fontFamily: "system-ui" }}>
          <h1>Meera&apos;s Savings Circle</h1>
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: 16, borderRadius: 8, marginTop: 16 }}>
            <p style={{ fontWeight: 600 }}>Demo configuration required</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Privy App ID is not configured in this deployment. Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> in Vercel env and redeploy.</p>
            <p style={{ fontSize: 12, marginTop: 4, color: "#64748b" }}>Error: {this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  if (isMissingEnv) {
    // No PrivyProvider at all when env missing — prevents Application error entirely. JoinCircle renders static demo.
    return (
      <>
        <div style={{ padding: 12, background: "#fef3c7", textAlign: "center", fontSize: 13, borderBottom: "1px solid #fde68a" }}>
          ⚠️ Demo running without Privy env vars — set Vercel env vars to enable live joining. Policy & cron code is still reviewable: <code>policy/savingsCirclePolicy.json</code>
        </div>
        {children}
      </>
    );
  }
  return (
    <PrivyErrorBoundary>
      <PrivyProvider
        appId={appId}
        config={{
          loginMethods: ["email", "google"],
          embeddedWallets: { createOnLogin: "users-without-wallets" },
          appearance: { theme: "light", accentColor: "#0f766e" },
        }}
      >
        {children}
      </PrivyProvider>
    </PrivyErrorBoundary>
  );
}
