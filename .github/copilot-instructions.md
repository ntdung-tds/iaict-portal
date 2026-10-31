# IAICT Portal — Copilot repository instructions
Read root [AGENTS.md](../AGENTS.md) and portable [IAICT Project Skill](../.agents/skills/iaict-project-management/SKILL.md) before planning, code, QA or Drive changes. Follow the approved source-of-truth, safety and staging-only release gates.

Single Drive project root: https://drive.google.com/drive/folders/11kM9LwI0K0dXrSept6FU4UzKaIBn_eKQ
Drive folder registry: `docs/project/DRIVE_REGISTRY.md`; governance: `docs/project/OPERATING_MODEL.md`; QA: `docs/qa/IAICT_TEST_MANAGEMENT.md`.

Never deploy/migrate production without explicit user approval. Never remove Cloudflare Access admin guard, bypass CI or publish secrets/PII. Screenshots/videos/errors only in private Drive QA, **never GitHub or CI artifacts**. Source changes require matching tests/docs and verifiable SHA-bound results; `READY` is not `PASS`.
