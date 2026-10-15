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

type IaictRuntimeGlobal = typeof globalThis & {
  __IAICT_D1_DB__?: D1DatabaseLike;
};

export function setDatabaseBinding(db: D1DatabaseLike | undefined) {
  const runtime = globalThis as IaictRuntimeGlobal;
  if (db) runtime.__IAICT_D1_DB__ = db;
}

export function getDatabaseBinding(): D1DatabaseLike {
  const db = (globalThis as IaictRuntimeGlobal).__IAICT_D1_DB__;
  if (!db) {
    throw new Error("D1 binding DB is not configured in this runtime");
  }
  return db;
}
