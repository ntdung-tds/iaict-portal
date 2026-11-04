/**
 * B3.8: R2 binding is PRIVATE and quarantined. No signed/public URLs and
 * no Blob read path are exposed here. Gate is FALSE for all deployed Workers
 * until an explicit staging release enables it after readiness checks.
 */
export interface MediaR2BucketLike {
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream, options?: {
    httpMetadata?: { contentType?: string; cacheControl?: string };
    customMetadata?: Record<string,string>;
  }): Promise<unknown>;
  delete(key: string): Promise<void>;
}
type Runtime = typeof globalThis & {
  __IAICT_PRIVATE_MEDIA_R2_BUCKET__?: MediaR2BucketLike;
  __IAICT_PRIVATE_MEDIA_R2_ENABLED__?: boolean;
};
export function setPrivateMediaR2Runtime(bucket: MediaR2BucketLike | undefined, enabled: boolean): void {
  const g = globalThis as Runtime;
  // Explicitly clear binding on a missing bucket; never reuse a stale one.
  g.__IAICT_PRIVATE_MEDIA_R2_BUCKET__ = bucket;
  g.__IAICT_PRIVATE_MEDIA_R2_ENABLED__ = Boolean(bucket && enabled);
}
export function getPrivateMediaR2Runtime(): { bucket: MediaR2BucketLike; enabled: true } | null {
  const g = globalThis as Runtime;
  return g.__IAICT_PRIVATE_MEDIA_R2_ENABLED__ && g.__IAICT_PRIVATE_MEDIA_R2_BUCKET__
    ? { bucket: g.__IAICT_PRIVATE_MEDIA_R2_BUCKET__, enabled: true } : null;
}
