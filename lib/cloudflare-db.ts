import { env } from "cloudflare:workers";

export type D1BindValue = string | number | null | ArrayBuffer | ArrayBufferView;

export type D1RunResult = {
  success?: boolean;
  meta?: Record<string, unknown>;
  results?: unknown[];
};

export interface D1PreparedStatementLike {
  bind(...values: D1BindValue[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success?: boolean }>;
  run(): Promise<D1RunResult>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<D1RunResult[]>;
}

export function getDatabaseBinding(): D1DatabaseLike {
  const db = (env as unknown as { DB?: D1DatabaseLike }).DB;
  if (!db) throw new Error("D1 binding DB is not configured");
  return db;
}
