import { describe, expect, it } from "vitest";
import {
  CMS_ROLE_DEFINITIONS,
  normalizeRoleSelection,
} from "./cms-roles";

describe("CMS role catalog", () => {
  it("contains the seven canonical roles", () => {
    expect(CMS_ROLE_DEFINITIONS.map((role) => role.code)).toEqual([
      "admin",
      "editor",
      "reviewer",
      "viewer",
      "news_admin",
      "news_editor",
      "news_reviewer",
    ]);
  });

  it("makes admin exclusive", () => {
    expect(normalizeRoleSelection(["editor", "admin", "news_reviewer"])).toEqual(["admin"]);
  });

  it("allows one CMS role plus one Newsroom role", () => {
    expect(normalizeRoleSelection(["editor", "news_reviewer"])).toEqual(["editor", "news_reviewer"]);
  });

  it("rejects conflicting global CMS roles", () => {
    expect(() => normalizeRoleSelection(["editor", "viewer"])).toThrow("INVALID_CMS_USER_GLOBAL_ROLE_CONFLICT");
  });

  it("rejects conflicting Newsroom roles", () => {
    expect(() => normalizeRoleSelection(["news_editor", "news_reviewer"])).toThrow("INVALID_CMS_USER_NEWSROOM_ROLE_CONFLICT");
  });

  it("drops unknown roles", () => {
    expect(normalizeRoleSelection(["editor", "super_admin", "unknown"])).toEqual(["editor"]);
  });
});
