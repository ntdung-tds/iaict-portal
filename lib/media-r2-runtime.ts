/**
 * B3.9 private R2 is request-scoped. No shared mutable isolate-global bucket,
 * public byte reader, or scan approval. Outside a request this fails closed.
 */
import { AsyncLocalStorage } from "node:async_hooks";

export interface MediaR2BucketLike {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream, options?: {
    httpMetadata?: { contentType?: string; cacheControl?: string };
    customMetadata?: Record<string,string>;
  }): Promise<unknown>;
  delete(key: string): Promise<void>;
  /** Private reads only, for scanner attestation byte-hash readback. */
  get?(key: string): Promise<{
    size: number;
    httpMetadata?: {contentType?: string};
    arrayBuffer(): Promise<ArrayBuffer>;
  } | null>;
}

type MediaContext = Readonly<{ bucket?: MediaR2BucketLike; enabled: boolean }>;
const requestMedia = new AsyncLocalStorage<MediaContext>();

export function withPrivateMediaR2Runtime<T>(
  bucket: MediaR2BucketLike | undefined, enabled: boolean, fn: () => T,
): T {
  return requestMedia.run({ bucket, enabled: Boolean(bucket && enabled) }, fn);
}

export function getPrivateMediaR2Runtime(): { bucket: MediaR2BucketLike; enabled: true } | null {
  const scoped = requestMedia.getStore();
  return scoped?.enabled && scoped.bucket ? { bucket: scoped.bucket, enabled: true } : null;
}
