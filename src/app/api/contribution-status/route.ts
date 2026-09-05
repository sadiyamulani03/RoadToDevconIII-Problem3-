import { NextResponse } from "next/server";
import { listContributions } from "@/lib/contributionStore";

export async function GET() {
  const contributions = listContributions();
  return NextResponse.json({ contributions });
}
