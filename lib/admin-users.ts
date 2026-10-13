import { get, put } from "@vercel/blob";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type EditorialRole = "editor" | "reviewer" | "superadmin";

export type EditorialUser = {
  id: string;
  username: string;
  displayName: string;
  role: EditorialRole;
  active: boolean;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type PublicEditorialUser = Omit<EditorialUser, "passwordSalt" | "passwordHash"> & {
  bootstrap?: boolean;
};

type EditorialUserState = {
  schemaVersion: 1;
  revision: number;
  updatedAt: string;
  users: EditorialUser[];
};

export type EditorialUserSnapshot = {
  state: EditorialUserState;
  storageReady: boolean;
  materialized: boolean;
};

const USERS_PATHNAME = "cms/users.json";

function emptyState(): EditorialUserState {
  return {
    schemaVersion: 1,
    revision: 0,
    updatedAt: new Date().toISOString(),
    users: [],
  };
}

function isState(value: unknown): value is EditorialUserState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EditorialUserState>;
  return candidate.schemaVersion === 1 && typeof candidate.revision === "number" && Array.isArray(candidate.users);
}

export function isEditorialRole(value: unknown): value is EditorialRole {
  return value === "editor" || value === "reviewer" || value === "superadmin";
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9._-]{3,40}$/.test(normalizeUsername(value));
}

export function isUserStorageConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function publicEditorialUser(user: EditorialUser): PublicEditorialUser {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...safe } = user;
  return safe;
}

export function bootstrapEditorialUser(): PublicEditorialUser | null {
  const username = normalizeUsername(process.env.IAICT_ADMIN_USERNAME ?? "");
  if (!username) return null;
  const role = isEditorialRole(process.env.IAICT_ADMIN_ROLE) ? process.env.IAICT_ADMIN_ROLE : "superadmin";
  return {
    id: `bootstrap:${username}`,
    username,
    displayName: "Quản trị hệ thống",
    role,
    active: true,
    createdAt: "",
    updatedAt: "",
    createdBy: "system",
    bootstrap: true,
  };
}

export async function getEditorialUserSnapshot(): Promise<EditorialUserSnapshot> {
  const fallback = emptyState();
  if (!isUserStorageConfigured()) return { state: fallback, storageReady: false, materialized: false };

  try {
    const result = await get(USERS_PATHNAME, { access: "private", useCache: false });
    if (!result?.stream) return { state: fallback, storageReady: true, materialized: false };
    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    if (!isState(parsed)) return { state: fallback, storageReady: true, materialized: false };
    return {
      state: {
        ...parsed,
        users: parsed.users.filter((user) => user && typeof user.username === "string" && isEditorialRole(user.role)),
      },
      storageReady: true,
      materialized: true,
    };
  } catch {
    return { state: fallback, storageReady: true, materialized: false };
  }
}

export async function persistEditorialUsers(state: EditorialUserState) {
  if (!isUserStorageConfigured()) throw new Error("USER_STORAGE_NOT_CONFIGURED");
  await put(USERS_PATHNAME, JSON.stringify(state), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export function hashEditorialPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyEditorialPassword(password: string, salt: string, expectedHash: string) {
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function findEditorialUserByUsername(username: string) {
  const snapshot = await getEditorialUserSnapshot();
  const normalized = normalizeUsername(username);
  return snapshot.state.users.find((user) => normalizeUsername(user.username) === normalized);
}

export async function findEditorialUserById(id: string) {
  const snapshot = await getEditorialUserSnapshot();
  return snapshot.state.users.find((user) => user.id === id);
}

export async function listPublicEditorialUsers() {
  const snapshot = await getEditorialUserSnapshot();
  const users: PublicEditorialUser[] = snapshot.state.users.map(publicEditorialUser);
  const bootstrap = bootstrapEditorialUser();
  if (bootstrap && !users.some((user) => user.username === bootstrap.username)) users.unshift(bootstrap);
  return { ...snapshot, users };
}

export async function listReviewTargets() {
  const result = await listPublicEditorialUsers();
  return result.users.filter((user) => user.active && (user.role === "reviewer" || user.role === "superadmin"));
}
