import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import * as lockfile from "proper-lockfile";
import { Lease, LeaseStore } from "@/cli/schemas/lease.js";
import { deterministicStringify } from "@/cli/commands/plan-helpers.js";

const LEASE_FILE = ".axiom/leases.json";

export function leaseFile(cwd: string): string {
  return resolve(cwd, LEASE_FILE);
}

async function ensureLeaseFile(cwd: string): Promise<void> {
  const file = leaseFile(cwd);
  try {
    await readFile(file, "utf-8");
  } catch {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, deterministicStringify({ leases: [] }), "utf-8");
  }
}

export async function readLeases(cwd: string): Promise<Lease[]> {
  try {
    const raw = await readFile(leaseFile(cwd), "utf-8");
    return LeaseStore.parse(JSON.parse(raw)).leases;
  } catch {
    return [];
  }
}

export async function writeLeases(cwd: string, leases: Lease[]): Promise<void> {
  await writeFile(leaseFile(cwd), deterministicStringify({ leases }), "utf-8");
}

export async function withLeaseLock<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
  await ensureLeaseFile(cwd);
  const file = leaseFile(cwd);
  const release = await lockfile.lock(file, { stale: 5000, update: 1000, retries: 10 });
  try {
    return await fn();
  } finally {
    await release();
  }
}
