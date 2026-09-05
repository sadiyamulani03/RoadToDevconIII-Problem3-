import fs from "fs";
import path from "path";

// Persistent store for idempotency - not just in-memory flag that restart clears.
// The recurring job refuses a second contribution for same period.

type ContributionStatus = "success" | "failed_revoked_or_expired" | "failed" | "pending";
export type ContributionRecord = {
  walletAddress: string;
  periodId: string;
  status: ContributionStatus;
  txHash?: string;
  reason?: string;
  error?: string;
  timestamp: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "contributions.json");

// In-memory cache synced to file for persistence across restarts
let cache: Record<string, ContributionRecord> | null = null;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify({}, null, 2));
  }
}

function load(): Record<string, ContributionRecord> {
  if (cache) return cache;
  ensureDir();
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    cache = JSON.parse(raw) as Record<string, ContributionRecord>;
  } catch {
    cache = {};
  }
  return cache!;
}

function persist() {
  ensureDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(cache, null, 2));
}

function key(walletAddress: string, periodId: string) {
  return `${walletAddress.toLowerCase()}:${periodId}`;
}

export function hasContributed(walletAddress: string, periodId: string): boolean {
  const store = load();
  const k = key(walletAddress, periodId);
  const rec = store[k];
  return !!rec && rec.status === "success";
}

export function getContribution(walletAddress: string, periodId: string): ContributionRecord | null {
  const store = load();
  return store[key(walletAddress, periodId)] || null;
}

export function recordContribution(rec: ContributionRecord) {
  const store = load();
  const k = key(rec.walletAddress, rec.periodId);
  store[k] = rec;
  cache = store;
  persist();
}

export function listContributions(): ContributionRecord[] {
  const store = load();
  return Object.values(store);
}

// Week-based period id e.g. 2026-W35
export function getCurrentPeriodId(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const week = Math.ceil((diff / (7 * 24 * 60 * 60 * 1000) + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Explicit period for testing idempotency - re-running same period does not double charge
export function getWeekId(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const week = Math.ceil((diff / (7 * 24 * 60 * 60 * 1000) + start.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
