import { describe, expect, it } from "vitest";
import { getDatabaseBinding, withDatabaseBinding, type D1DatabaseLike } from "./cloudflare-db";
import { getPrivateMediaR2Runtime, withPrivateMediaR2Runtime, type MediaR2BucketLike } from "./media-r2-runtime";

const db = (id: string) => ({ id }) as unknown as D1DatabaseLike;
const bucket = (id: string) => ({ id }) as unknown as MediaR2BucketLike;

describe("B3.9 request-scoped D1/R2 isolation (no deployed Worker)", () => {
  it("fails closed when no Media request context exists", () => {
    expect(getPrivateMediaR2Runtime()).toBeNull();
  });

  it("isolates simultaneous enabled and disabled requests across awaits", async () => {
    const dbA = db("staging"), dbB = db("production");
    const mediaA = bucket("private-staging"), mediaB = bucket("disabled-production");
    let resumeA!: () => void;
    let resumeB!: () => void;
    const waitA = new Promise<void>(resolve => { resumeA = resolve; });
    const waitB = new Promise<void>(resolve => { resumeB = resolve; });

    const a = withDatabaseBinding(dbA, () =>
      withPrivateMediaR2Runtime(mediaA, true, async () => {
        expect(getDatabaseBinding()).toBe(dbA);
        expect(getPrivateMediaR2Runtime()?.bucket).toBe(mediaA);
        await waitA;
        expect(getDatabaseBinding()).toBe(dbA);
        expect(getPrivateMediaR2Runtime()?.bucket).toBe(mediaA);
      }));
    const b = withDatabaseBinding(dbB, () =>
      withPrivateMediaR2Runtime(mediaB, false, async () => {
        expect(getDatabaseBinding()).toBe(dbB);
        expect(getPrivateMediaR2Runtime()).toBeNull();
        await waitB;
        expect(getDatabaseBinding()).toBe(dbB);
        expect(getPrivateMediaR2Runtime()).toBeNull();
      }));
    resumeB();
    await b;
    resumeA();
    await a;
    expect(getPrivateMediaR2Runtime()).toBeNull();
  });

  it("never inherits a previous R2 bucket in a missing-binding context", async () => {
    const privateBucket = bucket("private");
    await withPrivateMediaR2Runtime(privateBucket, true, async () => {
      await Promise.resolve();
      expect(getPrivateMediaR2Runtime()?.bucket).toBe(privateBucket);
      await withPrivateMediaR2Runtime(undefined, true, async () => {
        await Promise.resolve();
        expect(getPrivateMediaR2Runtime()).toBeNull();
      });
      expect(getPrivateMediaR2Runtime()?.bucket).toBe(privateBucket);
    });
    expect(getPrivateMediaR2Runtime()).toBeNull();
  });

  it("retains DB identity across async callbacks", async () => {
    const d = db("only-this-request");
    const actual = await withDatabaseBinding(d, async () => {
      await Promise.resolve();
      return getDatabaseBinding();
    });
    expect(actual).toBe(d);
  });
});
