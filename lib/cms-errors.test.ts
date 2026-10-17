import { describe, expect, it } from "vitest";
import { translateCmsError } from "./cms-errors";

describe("translateCmsError", () => {
  it("translates required field codes", () => {
    expect(translateCmsError("INVALID_CMS_FIELD_PUBLIC_URL_REQUIRED")).toBe("Vui lòng nhập url công khai.");
  });

  it("translates Media-specific validation codes", () => {
    expect(translateCmsError("INVALID_CMS_MEDIA_SOURCE_REQUIRED")).toContain("URL công khai");
    expect(translateCmsError("INVALID_CMS_FIELD_PUBLIC_URL_HTTPS")).toContain("HTTPS");
    expect(translateCmsError("INVALID_CMS_MEDIA_URL_DUPLICATE")).toContain("đã có trong thư viện");
    expect(translateCmsError("INVALID_CMS_MEDIA_TYPE_MISMATCH")).toContain("không phù hợp");
  });

  it("does not expose raw constraint errors", () => {
    expect(translateCmsError("UNIQUE constraint failed: media.storage_key")).not.toContain("constraint");
  });
});
