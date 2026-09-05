"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";

// Valid-format dummy for build/prerender when env not set; real Vercel env provides actual appId
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
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 680, margin: "0 auto", fontFamily: "system-ui" }}>
          <h1>Meera&apos;s Savings Circle</h1>
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: 16, borderRadius: 8, marginTop: 16 }}>
            <p style={{ fontWeight: 600 }}>Demo configuration required</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Privy App ID is not configured in this deployment. Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code>, <code>PRIVY_APP_SECRET</code> and <code>PRIVY_AUTHORIZATION_PRIVATE_KEY</code> in Vercel → Settings → Environment Variables and redeploy.</p>
            <p style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>Build fallback <code>{FALLBACK_APP_ID}</code> is used at build time to avoid prerender crash — it will show this message at runtime until a real appId is set. The rest of the demo (policy, idempotent cron, revoke handling) is still inspectable in the repo.</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>Policy: <code>policy/savingsCirclePolicy.json</code> — contract <code>0x5FbDB2315678afecb367f032d93F642f64180aa3</code> on Base Sepolia, cap 0.01 ETH, expiry 52 weeks.</p>
            <p style={{ fontSize: 12, marginTop: 4, color: "#64748b" }}>Error: {this.state.error}</p>
          </div>
          <div style={{ marginTop: 16 }}>{this.props.children}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  if (isMissingEnv) {
    // Avoid initializing Privy with dummy at runtime — show helpful banner + still render app shell without crashing
    return (
      <PrivyErrorBoundary>
        <div style={{ padding: 12, background: "#fef3c7", textAlign: "center", fontSize: 13, borderBottom: "1px solid #fde68a" }}>
          ⚠️ Demo running without Privy env vars — set Vercel env vars to enable joining. Policy & cron code is still reviewable: <code>policy/savingsCirclePolicy.json</code>
        </div>
        {/* Still provide PrivyProvider with dummy but inside boundary so exception becomes friendly message, not Application error */}
        <PrivyProvider
          appId={FALLBACK_APP_ID}
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
