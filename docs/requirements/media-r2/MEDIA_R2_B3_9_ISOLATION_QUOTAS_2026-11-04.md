# Media R2 B3.9 — Request isolation and quota hardening

**2026-11-04 · SOURCE REVIEW only · No hosted Media release**

## Findings and corrective implementation

- **Concurrent request isolation:** B3.8 wrote DB/R2 bindings to isolate-wide mutable globals; concurrent awaits could overwrite another request's bindings. Worker fetch now creates nested `AsyncLocalStorage` contexts for D1 and private R2. In a request, the database getter resolves the scoped binding first. The private media getter has no global fallback: missing/disabled R2 always returns `null`.
- **Failed reservation abuse:** B3.8 hourly and daily quota counters excluded `FAILED` rows. Failure after D1 reservation could be repeated while evading attempt counts. B3.9 counts every reservation record within hourly/daily windows, including failures and pending deletions.
- **Purge storage window:** `PURGE_PENDING` can still have an R2 object when deletion fails, so it must remain counted as stored bytes until a successful purge.
- **Tests:** concurrent enabled/disabled/missing bucket contexts across awaits; database identity isolation; actual disposable Miniflare D1 for failed-attempt and pending-delete quotas; regression CI and local/browser checks on exact SHA.

## Deliberate limits

This is not ClamAV integration, server-side image full decode/re-encode, EXIF stripping, signed scanner attestation or content publishing. Scanner `MEDIA_POLICY.scan.serviceConfigured=false`, Worker `MEDIA_R2_QUARANTINE_ENABLED=false`, original B3.8 migration 0025 is immutable, public GET and promotion remain forbidden. No staged remote migration/Worker/R2/Access write, no IAM implementation, production HOLD, SRS FROZEN.

**Remaining independent acceptance:** isolated and authenticated scan service/decoder, attestation bound to object SHA and revision, negative bomb/malware fixtures, D1 state CAS, 8 genuine role browser sessions, controlled staging backup+migration+rollback, hosted R2/D1 audit. See [Issue #39](https://github.com/ntdung-tds/iaict-portal/issues/39).
