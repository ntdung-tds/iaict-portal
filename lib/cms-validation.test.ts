import { describe, expect, it } from "vitest";
import type { D1BindValue, D1DatabaseLike, D1PreparedStatementLike } from "./cloudflare-db";
import { getCmsModule } from "./cms-schema";
import { prepareCmsData } from "./cms-validation";

type MockOptions={current?:Record<string,unknown>|null;duplicate?:Record<string,unknown>|null;mediaRef?:{id:string;type:string;visibility?:string;public_url?:string|null}|null;parent?:{id:string}|null;owner?:{id:string}|null};
function mockDb(options:MockOptions={}):D1DatabaseLike{
  return{prepare(query:string):D1PreparedStatementLike{let values:D1BindValue[]=[];const statement:D1PreparedStatementLike={bind(...next:D1BindValue[]){values=next;return statement;},async first<T>(){if(query.includes("SELECT * FROM")&&query.includes("WHERE id = ?"))return(options.current??null)as T|null;if(query.includes("SELECT id FROM media WHERE public_url"))return(options.duplicate??null)as T|null;if((query.includes("SELECT id,type FROM media WHERE id=")||query.includes("SELECT id,type,visibility,public_url FROM media WHERE id=")))return(options.mediaRef??null)as T|null;if(query.includes("SELECT id FROM navigation_items WHERE id="))return(options.parent??null)as T|null;if(query.includes("SELECT id FROM admin_users WHERE id="))return(options.owner??null)as T|null;void values;return null;},async all<T>(){return{results:[]as T[]};},async run(){return{success:true};}};return statement;},async batch(){return[];}};
}
function moduleConfig(key:string){const config=getCmsModule(key);if(!config)throw new Error(`Missing config ${key}`);return config;}

describe("prepareCmsData",()=>{
  it("requires a public Media URL instead of exposing storage_key",async()=>{await expect(prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public"})).rejects.toThrow("INVALID_CMS_MEDIA_SOURCE_REQUIRED");});
  it("requires HTTPS for Media",async()=>{await expect(prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"http://example.com/photo.jpg"})).rejects.toThrow("INVALID_CMS_FIELD_PUBLIC_URL_HTTPS");});
  it("generates internal Media metadata from a valid URL",async()=>{const result=await prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/assets/photo.jpg",metadata_json:"{}"});expect(String(result.storage_key)).toMatch(/^external\//);expect(result.filename).toBe("photo.jpg");expect(result.mime_type).toBe("image/jpeg");expect(result.public_url).toBe("https://example.com/assets/photo.jpg");});
  it("rejects duplicate Media URLs",async()=>{await expect(prepareCmsData(mockDb({duplicate:{id:"existing"}}),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/photo.jpg"})).rejects.toThrow("INVALID_CMS_MEDIA_URL_DUPLICATE");});
  it("rejects a Media type that conflicts with an obvious file format",async()=>{await expect(prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/report.pdf"})).rejects.toThrow("INVALID_CMS_MEDIA_TYPE_MISMATCH");});
  it("does not let a supplied MIME or filename disguise a PDF URL as an image",async()=>{await expect(prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/report.pdf",filename:"photo.jpg",mime_type:"image/jpeg"})).rejects.toThrow("INVALID_CMS_MEDIA_TYPE_MISMATCH");});
  it("rejects inconsistent file types when editing existing Media",async()=>{await expect(prepareCmsData(mockDb({current:{id:"m1",type:"image",visibility:"public",public_url:"https://example.com/photo.jpg",filename:"photo.jpg",mime_type:"image/jpeg"}}),"media",moduleConfig("media"),"m1",{public_url:"https://example.com/report.pdf"})).rejects.toThrow("INVALID_CMS_MEDIA_TYPE_MISMATCH");});
  it("accepts uppercase MIME for a matching image",async()=>{const result=await prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/photo.jpg",mime_type:"IMAGE/JPEG"});expect(result.type).toBe("image");});
  it("rejects negative Media size",async()=>{await expect(prepareCmsData(mockDb(),"media",moduleConfig("media"),null,{type:"image",visibility:"public",public_url:"https://example.com/photo.jpg",size_bytes:-1})).rejects.toThrow("INVALID_CMS_MEDIA_SIZE_INVALID");});
  it("enforces required fields when updating existing CMS content",async()=>{const current={id:"p1",title:"Old",slug:"old",status:"draft",summary:"Summary"};await expect(prepareCmsData(mockDb({current}),"products",moduleConfig("products"),"p1",{title:""})).rejects.toThrow("INVALID_CMS_FIELD_TITLE_REQUIRED");});
  it("auto-generates a normalized slug before required validation",async()=>{const result=await prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{title:"Sản phẩm mới",slug:"",status:"draft",summary:"Mô tả"});expect(result.slug).toBe("san-pham-moi");});
  it("rejects invalid select values",async()=>{await expect(prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{title:"A",slug:"a",status:"not-a-status",summary:"Mô tả"})).rejects.toThrow("INVALID_CMS_FIELD_STATUS_OPTION");});
  it("rejects an event ending before it starts",async()=>{await expect(prepareCmsData(mockDb(),"events",moduleConfig("events"),null,{title:"Sự kiện",slug:"su-kien",status:"draft",start_at:"2026-10-15T10:00",end_at:"2026-10-15T09:00"})).rejects.toThrow("INVALID_CMS_EVENT_END_BEFORE_START");});
  it("rejects redirect loops",async()=>{await expect(prepareCmsData(mockDb(),"redirects",moduleConfig("redirects"),null,{source_path:"/cu",destination_path:"/cu",status_code:"301",is_active:true})).rejects.toThrow("INVALID_CMS_REDIRECT_LOOP");});
  it("rejects negative navigation sort order",async()=>{await expect(prepareCmsData(mockDb(),"navigation",moduleConfig("navigation"),null,{label:"Trang",href:"/trang",group_name:"main",sort_order:-1,is_active:true,opens_new_tab:false})).rejects.toThrow("INVALID_CMS_NAVIGATION_SORT_ORDER");});
  it("validates image media references",async()=>{await expect(prepareCmsData(mockDb({mediaRef:{id:"m1",type:"document"}}),"experts",moduleConfig("experts"),null,{name:"Chuyên gia",slug:"chuyen-gia",status:"draft",photo_media_id:"m1",expertise_json:"[]",public_contacts_json:"{}",seo_json:"{}"})).rejects.toThrow("INVALID_CMS_FIELD_PHOTO_MEDIA_ID_IMAGE_REQUIRED");});
});

const validPage={title:"Trang hợp tác",slug:"trang-hop-tac",body:"Nội dung giới thiệu.",status:"draft",page_type:"standard",layout_json:"{}",seo_json:"{}"};
describe("Page module validation",()=>{
  it("generates a Vietnamese page slug",async()=>{const row=await prepareCmsData(mockDb(),"pages",moduleConfig("pages"),null,{...validPage,title:"Đào tạo tại Viện",slug:""});expect(row.slug).toBe("dao-tao-tai-vien");});
  it.each(["Có dấu", "a/b", "UPPERCASE", "a--b", "a".repeat(121)])("rejects unsafe page slug %s",async slug=>{await expect(prepareCmsData(mockDb(),"pages",moduleConfig("pages"),null,{...validPage,slug})).rejects.toThrow("INVALID_CMS_PAGE_SLUG_INVALID");});
  it.each(["layout_json","seo_json"])("requires %s to be an object",async key=>{await expect(prepareCmsData(mockDb(),"pages",moduleConfig("pages"),null,{...validPage,[key]:"[]"})).rejects.toThrow("INVALID_CMS_PAGE_JSON_OBJECT_REQUIRED");});
  it("rejects non-text SEO title",async()=>{await expect(prepareCmsData(mockDb(),"pages",moduleConfig("pages"),null,{...validPage,seo_json:'{"title":123}'})).rejects.toThrow("INVALID_CMS_PAGE_SEO_TEXT_REQUIRED");});
  it("rejects private hero images",async()=>{await expect(prepareCmsData(mockDb({mediaRef:{id:"m1",type:"image",visibility:"private",public_url:"https://example.com/photo.jpg"}}),"pages",moduleConfig("pages"),null,{...validPage,hero_media_id:"m1"})).rejects.toThrow("INVALID_CMS_PAGE_HERO_PUBLIC_REQUIRED");});
  it("accepts public hero images and partial page updates",async()=>{const current={...validPage,id:"p1",hero_media_id:"m1"};const result=await prepareCmsData(mockDb({current,mediaRef:{id:"m1",type:"image",visibility:"public",public_url:"https://example.com/photo.jpg"}}),"pages",moduleConfig("pages"),"p1",{body:"Nội dung mới"});expect(result.body).toBe("Nội dung mới");});
});

const validProduct={title:"Nền tảng IoT",slug:"nen-tang-iot",summary:"Giám sát dữ liệu hiện trường.",status:"draft",features_json:'["Thu thập dữ liệu"]',technologies_json:'["IoT"]',benefits_json:'["Giảm thao tác tổng hợp"]',seo_json:"{}"};
describe("Product module validation",()=>{
  it.each(["features_json","technologies_json","benefits_json"])("requires %s to be a text list",async key=>{
    await expect(prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{...validProduct,[key]:'[{"name":"Không phải chuỗi"}]'})).rejects.toThrow("INVALID_CMS_PRODUCT_LIST_TEXT_REQUIRED");
  });
  it("accepts empty optional lists",async()=>{const data=await prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{...validProduct,features_json:"[]",technologies_json:"[]",benefits_json:"[]"});expect(data.features_json).toBe("[]");});
  it("rejects an invalid product slug",async()=>{await expect(prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{...validProduct,slug:"a/b"})).rejects.toThrow("INVALID_CMS_PRODUCT_SLUG_INVALID");});
  it("requires object SEO",async()=>{await expect(prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{...validProduct,seo_json:"[]"})).rejects.toThrow("INVALID_CMS_PRODUCT_JSON_OBJECT_REQUIRED");});
  it("rejects a non-text SEO description",async()=>{await expect(prepareCmsData(mockDb(),"products",moduleConfig("products"),null,{...validProduct,seo_json:'{"description":42}'})).rejects.toThrow("INVALID_CMS_PRODUCT_SEO_TEXT_REQUIRED");});
});

const validSolution={title:"Giải pháp giám sát rừng",slug:"giam-sat-rung",summary:"Theo dõi dữ liệu hiện trường.",status:"draft",scope_json:'["Khảo sát"]',process_json:'["Khảo sát", "Bàn giao"]',deliverables_json:'["Hệ thống đã cấu hình"]',technologies_json:'["IoT"]',seo_json:"{}"};
describe("Solution module validation",()=>{
  it.each(["scope_json","process_json","deliverables_json","technologies_json"])("requires %s to be a text list",async key=>{
    await expect(prepareCmsData(mockDb(),"solutions",moduleConfig("solutions"),null,{...validSolution,[key]:'[{"name":"Không phải chuỗi"}]'})).rejects.toThrow("INVALID_CMS_SOLUTION_LIST_TEXT_REQUIRED");
  });
  it("accepts empty optional lists",async()=>{const data=await prepareCmsData(mockDb(),"solutions",moduleConfig("solutions"),null,{...validSolution,scope_json:"[]",process_json:"[]",deliverables_json:"[]",technologies_json:"[]"});expect(data.scope_json).toBe("[]");});
  it("rejects an invalid solution slug",async()=>{await expect(prepareCmsData(mockDb(),"solutions",moduleConfig("solutions"),null,{...validSolution,slug:"a/b"})).rejects.toThrow("INVALID_CMS_SOLUTION_SLUG_INVALID");});
  it("requires object SEO",async()=>{await expect(prepareCmsData(mockDb(),"solutions",moduleConfig("solutions"),null,{...validSolution,seo_json:"[]"})).rejects.toThrow("INVALID_CMS_SOLUTION_JSON_OBJECT_REQUIRED");});
  it("rejects non-text SEO title",async()=>{await expect(prepareCmsData(mockDb(),"solutions",moduleConfig("solutions"),null,{...validSolution,seo_json:'{"title":42}'})).rejects.toThrow("INVALID_CMS_SOLUTION_SEO_TEXT_REQUIRED");});
  it("validates a partial update against the saved solution",async()=>{const data=await prepareCmsData(mockDb({current:{...validSolution,id:"s1"}}),"solutions",moduleConfig("solutions"),"s1",{problem:"Khó tổng hợp dữ liệu hiện trường."});expect(data.problem).toBe("Khó tổng hợp dữ liệu hiện trường.");});
});
