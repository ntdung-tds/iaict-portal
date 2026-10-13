import { describe, expect, it } from "vitest";
import entries from "../lib/search-index.json";
import { normalizeSearch, searchPublicContent } from "../lib/public-search";

describe("public content search", () => {
  it("normalizes Vietnamese marks, Đ, whitespace and punctuation", () => {
    expect(normalizeSearch("  ĐÀO—TẠO, dữ liệu! ")).toBe("dao tao du lieu");
  });
  it("finds Trâm Rừng with an unaccented multiword query", () => {
    expect(searchPublicContent(entries, "tram rung")[0].href).toBe("/du-an/tram-rung");
  });
  it("filters results by category and handles unknown queries", () => {
    expect(searchPublicContent(entries, "", "Đào tạo").every(x=>x.category==="Đào tạo")).toBe(true);
    expect(searchPublicContent(entries, "zzzzkhongco")).toEqual([]);
    expect(searchPublicContent(entries, "!!!")).toEqual([]);
  });
  it("does not treat ai as a substring inside khai", () => {
    const item = {title:"Triển khai",summary:"",keywords:"",href:"/test",category:"Giải pháp"};
    expect(searchPublicContent([item], "AI")).toEqual([]);
  });
});
