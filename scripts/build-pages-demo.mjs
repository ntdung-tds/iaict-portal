import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const out = "pages-dist";
const base = "/iaict-portal/";

const nav = [
  ["Trang chủ", ""],
  ["Giới thiệu", "gioi-thieu/"],
  ["Sản phẩm & Nền tảng", "san-pham-nen-tang/"],
  ["Giải pháp & Dịch vụ", "giai-phap-dich-vu/"],
  ["Chuyển giao công nghệ", "chuyen-giao-cong-nghe/"],
  ["Đào tạo & Tập huấn", "dao-tao-tap-huan/"],
  ["Dự án tiêu biểu", "du-an/"],
  ["Tin tức", "tin-tuc/"],
  ["Liên hệ & Hợp tác", "lien-he/"],
];

const pageData = {
  "gioi-thieu": ["Giới thiệu IAICT", "Kết nối nghiên cứu, ứng dụng và chuyển giao", [
    ["IAICT Technology", "Sản phẩm, nền tảng, IoT, AI, dữ liệu và phần mềm."],
    ["IAICT Solutions", "Tư vấn, thiết kế, tích hợp, triển khai và vận hành."],
    ["IAICT Transfer", "Nghiên cứu ứng dụng, thử nghiệm, hoàn thiện và chuyển giao."],
    ["IAICT Academy", "Đào tạo, tập huấn và bồi dưỡng năng lực số."],
  ]],
  "san-pham-nen-tang": ["IAICT Technology", "Sản phẩm & Nền tảng", [
    ["Nông – Lâm nghiệp thông minh", "Nền tảng số cho quản lý, giám sát và khai thác dữ liệu ngành."],
    ["IoT & Quan trắc", "Kết nối thiết bị, cảm biến và dữ liệu quan trắc."],
    ["Truy xuất nguồn gốc", "Quản lý thông tin nguồn gốc và chuỗi dữ liệu liên quan."],
    ["Quản lý vòng đời", "Theo dõi đối tượng, tài sản hoặc sản phẩm theo vòng đời."],
    ["AI & Dữ liệu", "Khai thác dữ liệu và ứng dụng AI theo bài toán cụ thể."],
    ["Nền tảng/ứng dụng khác", "Giải pháp có thể tùy biến và tích hợp theo yêu cầu."],
  ]],
  "giai-phap-dich-vu": ["IAICT Solutions", "Giải pháp & Dịch vụ", [
    ["Tư vấn chuyển đổi số", "Đánh giá hiện trạng, mục tiêu và lộ trình thực hiện."],
    ["Tư vấn giải pháp công nghệ", "Lựa chọn kiến trúc và phương án phù hợp bài toán."],
    ["Thiết kế hệ thống", "Thiết kế kiến trúc, dữ liệu, tích hợp và vận hành."],
    ["AI & Dữ liệu", "Thiết kế luồng dữ liệu và ứng dụng AI có kiểm soát."],
    ["IoT & Tự động hóa", "Kết nối thiết bị, dữ liệu hiện trường và quy trình."],
    ["Phần mềm theo yêu cầu", "Phát triển ứng dụng phục vụ quy trình nghiệp vụ cụ thể."],
  ]],
  "chuyen-giao-cong-nghe": ["IAICT Transfer", "Chuyển giao công nghệ", [
    ["Khảo sát", "Làm rõ bài toán, hiện trạng và điều kiện ứng dụng."],
    ["Thử nghiệm", "Xây dựng mô hình thử nghiệm và tiêu chí đánh giá."],
    ["Hoàn thiện", "Điều chỉnh giải pháp dựa trên bằng chứng thử nghiệm."],
    ["Chuyển giao", "Bàn giao công nghệ, tài liệu và hướng dẫn vận hành."],
    ["Đồng hành", "Hỗ trợ mở rộng, tích hợp và nâng cao năng lực sử dụng."],
  ]],
  "dao-tao-tap-huan": ["IAICT Academy", "Đào tạo & Tập huấn", [
    ["Theo đối tượng", "Phân nhóm lãnh đạo, quản lý, chuyên viên và các nhóm nghiệp vụ."],
    ["Theo mục tiêu", "Gắn mục tiêu học tập với năng lực cần áp dụng vào công việc."],
    ["Theo module", "Cấu trúc nội dung thành các module có thể tổ chức linh hoạt."],
    ["Theo hình thức", "Hỗ trợ phương án trực tiếp, trực tuyến hoặc kết hợp."],
  ]],
  "du-an": ["Dự án tiêu biểu", "Mô hình ứng dụng và khả năng nhân rộng", [
    ["CMS / Projects", "Danh sách dự án sẽ lấy từ dữ liệu đã được biên tập và xác minh."],
    ["Evidence-first", "Không công bố số liệu hoặc kết quả chưa được kiểm chứng."],
  ]],
  "tin-tuc": ["Tin tức", "Kênh thông tin chính thức của IAICT", [
    ["Tin hoạt động Viện", "Hoạt động và thông báo chính thức."],
    ["Khoa học & Công nghệ", "Nội dung nghiên cứu và ứng dụng công nghệ."],
    ["Chuyển đổi số", "Thông tin và góc nhìn về chuyển đổi số."],
    ["AI & Dữ liệu", "Tin tức và nội dung chuyên môn về AI, dữ liệu."],
    ["Sự kiện – Hội thảo", "Các sự kiện và hội thảo chuyên môn."],
  ]],
  "lien-he": ["Liên hệ & Hợp tác", "Bắt đầu từ bài toán cần giải quyết", [
    ["Viện Ứng dụng CNTT và Truyền thông", "Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội."],
    ["Tư vấn & triển khai", "Trao đổi nhu cầu về giải pháp, dự án và công nghệ."],
    ["Đào tạo & tập huấn", "Trao đổi nhu cầu tổ chức lớp và chương trình chuyên đề."],
  ]],
};

const css = `
:root{--ink:#102a43;--ink2:#071c2e;--muted:#486581;--blue:#0b63ce;--deep:#074b9b;--green:#159b86;--mist:#f4f8fc;--line:#d9e4ee;--white:#fff;--shadow:0 18px 50px rgba(16,42,67,.11)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6;background:#fff}a{text-decoration:none;color:inherit}.shell{width:min(1180px,calc(100% - 40px));margin:auto}.top{background:#082f5f;color:#d9ebff;font-size:12px}.top .shell{min-height:34px;display:flex;align-items:center;justify-content:space-between}.head{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.row{min-height:78px;display:flex;align-items:center;gap:24px}.brand{display:flex;align-items:center;gap:12px;margin-right:auto}.mark{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:white;background:linear-gradient(145deg,var(--blue),var(--green));font-weight:900}.brand strong{display:block;font-size:20px}.brand small{display:block;color:var(--muted);font-size:11px;max-width:320px}.nav{display:flex;gap:16px;font-size:12px;font-weight:750}.nav a:hover{color:var(--blue)}.cta{padding:10px 14px;border-radius:10px;background:var(--blue);color:white;font-size:12px;font-weight:800}.mobile{display:none;position:relative}.mobile summary{cursor:pointer;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:12px;font-weight:800}.mobile nav{position:absolute;right:0;top:45px;width:min(330px,calc(100vw - 26px));display:grid;background:white;border:1px solid var(--line);border-radius:14px;padding:10px;box-shadow:var(--shadow)}.mobile nav a{padding:10px;border-radius:8px}.hero{overflow:hidden;background:radial-gradient(circle at 82% 20%,rgba(21,155,134,.16),transparent 30%),linear-gradient(155deg,#f8fbff,#eef6ff 52%,#fbfdff)}.heroGrid{min-height:640px;display:grid;grid-template-columns:1.12fr .88fr;gap:70px;align-items:center}.kicker{margin:0 0 12px;color:var(--blue);text-transform:uppercase;letter-spacing:.14em;font-size:12px;font-weight:850}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(44px,5.3vw,76px);line-height:1.02;letter-spacing:-.048em;color:var(--ink2);margin-bottom:22px}h2{font-size:clamp(30px,3.2vw,46px);line-height:1.12;letter-spacing:-.036em;color:var(--ink2)}h3{font-size:20px;line-height:1.25;color:var(--ink2)}.lead{max-width:760px;color:var(--muted);font-size:19px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.btn{padding:11px 18px;border-radius:12px;font-weight:800;font-size:14px}.primary{background:var(--blue);color:white}.secondary{border:1px solid #b9cee1;background:rgba(255,255,255,.75)}.orbital{min-height:420px;position:relative;display:grid;place-items:center}.core{width:190px;height:190px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;background:linear-gradient(145deg,#0b4e93,#0c7485);box-shadow:0 26px 65px rgba(7,75,155,.25);z-index:2}.core strong{font-size:28px}.orbit{position:absolute;border:1px solid rgba(11,99,206,.2);border-radius:50%;width:330px;height:330px}.orbit2{width:420px;height:420px;border-style:dashed;border-color:rgba(21,155,134,.2)}.node{position:absolute;width:58px;height:58px;border-radius:17px;background:white;display:grid;place-items:center;box-shadow:0 10px 30px rgba(16,42,67,.08);font-weight:850;color:var(--deep);z-index:3}.n1{top:30px}.n2{right:20px}.n3{bottom:30px}.n4{left:20px}.section{padding:86px 0}.tint{background:var(--mist);border-block:1px solid #e3edf4}.heading{display:flex;align-items:end;justify-content:space-between;gap:40px;margin-bottom:32px}.heading p{max-width:520px;color:var(--muted)}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{min-height:220px;padding:23px;border:1px solid var(--line);border-radius:19px;background:white;display:flex;flex-direction:column}.card .num{margin-bottom:28px;color:var(--blue);font-size:11px;font-weight:850}.card p{color:var(--muted);font-size:13px}.card b{margin-top:auto;color:var(--blue)}.academy{background:#0c345b;color:white}.academy h2{color:white}.academy .kicker{color:#69dec8}.academyGrid{display:grid;grid-template-columns:1fr .8fr;gap:70px;align-items:center}.matrix{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.matrix span{min-height:80px;border:1px solid rgba(255,255,255,.16);border-radius:13px;padding:14px;display:flex;align-items:end;color:#d8e7ef;background:rgba(255,255,255,.05)}.banner{padding:42px;border-radius:24px;background:linear-gradient(120deg,#094b8b,#087e83);color:white;display:flex;align-items:center;justify-content:space-between;gap:40px}.banner h2{color:white}.pageHero{min-height:380px;display:flex;align-items:center;background:linear-gradient(155deg,#f7fbff,#eef6ff 58%,#fbfdff);border-bottom:1px solid #e3edf4}.pageHero h1{font-size:clamp(42px,5vw,68px)}.taxonomy{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.tax{min-height:245px;padding:24px;border:1px solid var(--line);border-radius:19px;background:white}.tax span{display:block;margin-bottom:32px;color:var(--blue);font-size:11px;font-weight:850}.tax p{color:var(--muted);font-size:13px}.footer{background:#081f35;color:#d4e1ec}.foot{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:40px;padding:52px 0}.foot p,.foot a{color:#9fb6c9;font-size:12px}.footlinks{display:grid;gap:7px}.copyright{border-top:1px solid rgba(255,255,255,.08);padding:18px 0 25px;color:#7892a8;font-size:11px}.demoNote{padding:10px 14px;border-radius:999px;background:#e5f4ff;color:#07549e;font-size:11px;font-weight:800}.safe{border:1px dashed #b8cddd;background:#fbfdff}
@media(max-width:1050px){.nav{display:none}.mobile{display:block}.grid4{grid-template-columns:repeat(2,1fr)}.heroGrid{grid-template-columns:1fr .8fr}.foot{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.shell{width:min(100% - 28px,1180px)}.heroGrid,.academyGrid{grid-template-columns:1fr}.heroGrid{padding:56px 0}.orbital{min-height:340px}.section{padding:62px 0}.grid3,.taxonomy{grid-template-columns:repeat(2,1fr)}.heading,.banner{align-items:flex-start;flex-direction:column}.brand small{max-width:220px}}
@media(max-width:520px){.top .shell span:first-child{display:none}.brand small{font-size:9px;max-width:180px}.mark{width:42px;height:42px}.grid4,.grid3,.taxonomy,.foot,.matrix{grid-template-columns:1fr}.orbit{width:250px;height:250px}.orbit2{width:320px;height:320px}.core{width:155px;height:155px}h1{font-size:42px}}
`;

function header() {
  const desktop = nav.slice(0, 4).map(([label, href]) => `<a href="${base}${href}">${label}</a>`).join("");
  const mobile = nav.map(([label, href]) => `<a href="${base}${href}">${label}</a>`).join("");
  return `<div class="top"><div class="shell"><span>Cổng thông tin điện tử IAICT</span><span class="demoNote">GitHub Pages Demo</span></div></div><header class="head"><div class="shell row"><a class="brand" href="${base}"><span class="mark">IA</span><span><strong>IAICT</strong><small>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</small></span></a><nav class="nav">${desktop}</nav><a class="cta" href="${base}lien-he/">Đề nghị tư vấn</a><details class="mobile"><summary>Menu</summary><nav>${mobile}</nav></details></div></header>`;
}

function footer() {
  return `<footer class="footer"><div class="shell foot"><div><h3 style="color:white">IAICT</h3><p>Viện Ứng dụng Công nghệ Thông tin và Truyền thông</p><p>Số 7 Tôn Thất Thuyết, phường Cầu Giấy, Hà Nội</p></div><div><strong>Điều hướng</strong><div class="footlinks">${nav.slice(1,5).map(([l,h])=>`<a href="${base}${h}">${l}</a>`).join("")}</div></div><div><strong>Hoạt động</strong><div class="footlinks">${nav.slice(5).map(([l,h])=>`<a href="${base}${h}">${l}</a>`).join("")}</div></div></div><div class="shell copyright">© ${new Date().getFullYear()} IAICT · Bản demo tĩnh trên GitHub Pages.</div></footer>`;
}

function doc(title, body) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Bản demo cổng thông tin IAICT"><title>${title} | IAICT</title><link rel="stylesheet" href="${base}styles.css"></head><body>${header()}${body}${footer()}</body></html>`;
}

function home() {
  const needs = ["Tư vấn chuyển đổi số","Xây dựng nền tảng","AI & Dữ liệu","IoT & Quan trắc","Chuyển giao công nghệ","Đào tạo & Tập huấn","Tổ chức lớp cho cơ quan","Hợp tác dự án"];
  const products = ["Nông – Lâm nghiệp thông minh","IoT & Quan trắc","Truy xuất nguồn gốc","Quản lý vòng đời","AI & Dữ liệu","Nền tảng/ứng dụng khác"];
  return doc("Trang chủ", `<main><section class="hero"><div class="shell heroGrid"><div><p class="kicker">Công nghệ • Giải pháp • Chuyển giao • Đào tạo</p><h1>Từ bài toán thực tế đến giải pháp số có thể triển khai.</h1><p class="lead">Cổng thông tin giúp cơ quan, tổ chức và doanh nghiệp nhanh chóng tìm đúng năng lực, giải pháp và chương trình phù hợp tại IAICT.</p><div class="actions"><a class="btn primary" href="${base}giai-phap-dich-vu/">Khám phá giải pháp</a><a class="btn secondary" href="${base}lien-he/">Đề nghị tư vấn</a></div></div><div class="orbital"><div class="orbit"></div><div class="orbit orbit2"></div><div class="core"><span>IAICT</span><strong>Ứng dụng</strong><small>nghiên cứu → triển khai</small></div><div class="node n1">AI</div><div class="node n2">IoT</div><div class="node n3">Data</div><div class="node n4">DX</div></div></div></section><section class="section"><div class="shell"><div class="heading"><div><p class="kicker">Đi theo nhu cầu</p><h2>Bạn đang cần gì?</h2></div><p>Chọn theo bài toán trước, sau đó đi đến nhóm sản phẩm, giải pháp, chuyển giao hoặc đào tạo phù hợp.</p></div><div class="grid4">${needs.map((n,i)=>`<a class="card" href="${i===5||i===6?base+'dao-tao-tap-huan/':i===4?base+'chuyen-giao-cong-nghe/':i===7?base+'lien-he/':base+'giai-phap-dich-vu/'}"><span class="num">${String(i+1).padStart(2,'0')}</span><h3>${n}</h3><p>Khám phá năng lực và phương án phù hợp với nhu cầu thực tế.</p><b>Khám phá →</b></a>`).join("")}</div></div></section><section class="section tint"><div class="shell"><div class="heading"><div><p class="kicker">IAICT Technology</p><h2>Sản phẩm & Nền tảng</h2></div><a href="${base}san-pham-nen-tang/">Xem toàn bộ →</a></div><div class="grid3">${products.map((p,i)=>`<div class="card"><span class="num">Technology ${String(i+1).padStart(2,'0')}</span><h3>${p}</h3><p>Nội dung chi tiết sẽ được quản trị từ CMS trong bản triển khai chính thức.</p></div>`).join("")}</div></div></section><section class="section academy"><div class="shell academyGrid"><div><p class="kicker">IAICT Academy</p><h2>Đào tạo & Tập huấn gắn với công việc thực tế</h2><p>Thiết kế theo đối tượng, mục tiêu, module, thời lượng, hình thức và lịch triển khai.</p><div class="actions"><a class="btn primary" href="${base}dao-tao-tap-huan/">Xem phân hệ đào tạo</a></div></div><div class="matrix"><span>Đối tượng</span><span>Mục tiêu</span><span>Module</span><span>Thời lượng</span><span>Hình thức</span><span>Lịch / Session</span></div></div></section><section class="section"><div class="shell banner"><div><p class="kicker" style="color:#7be0cb">Dành cho cơ quan nhà nước</p><h2>Khung đào tạo theo cấp và nhóm vị trí công việc</h2><p>Hỗ trợ định hướng chương trình cho cấp tỉnh, sở/ban/ngành, xã/phường và đơn vị sự nghiệp.</p></div><a class="btn" style="background:white;color:#074b9b" href="${base}dao-tao-tap-huan/">Khám phá chương trình</a></div></section><section class="section tint"><div class="shell"><div class="heading"><div><p class="kicker">Dữ liệu chính thức</p><h2>Dự án, chuyên gia, đối tác và tin tức</h2></div><p>Demo không hard-code thành tích hoặc đối tác. Các vùng này sẽ lấy từ CMS sau M0.</p></div><div class="grid3"><div class="card safe"><span class="num">CMS / Projects</span><h3>Dự án tiêu biểu</h3><p>Hiển thị dữ liệu đã xác minh và xuất bản.</p></div><div class="card safe"><span class="num">CMS / Experts</span><h3>Chuyên gia / Giảng viên</h3><p>Chỉ công bố hồ sơ được phép công khai.</p></div><div class="card safe"><span class="num">CMS / Articles</span><h3>Tin tức & Sự kiện</h3><p>Kết nối với dữ liệu nội dung chính thức.</p></div></div></div></section></main>`);
}

function landing(slug, [eyebrow, title, items]) {
  return doc(title, `<main><section class="pageHero"><div class="shell"><p class="kicker">${eyebrow}</p><h1>${title}</h1><p class="lead">Bản demo giao diện. Dữ liệu nghiệp vụ chính thức sẽ được quản trị qua CMS và hạ tầng Cloudflare sau M0.</p></div></section><section class="section"><div class="shell taxonomy">${items.map(([name,summary],i)=>`<article class="tax"><span>${String(i+1).padStart(2,'0')}</span><h3>${name}</h3><p>${summary}</p></article>`).join("")}</div></section><section class="section tint"><div class="shell banner"><div><p class="kicker" style="color:#7be0cb">Trao đổi nhu cầu</p><h2>Cần phương án phù hợp với bài toán thực tế?</h2></div><a class="btn" style="background:white;color:#074b9b" href="${base}lien-he/">Liên hệ & Hợp tác</a></div></section></main>`);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeFile(join(out, "styles.css"), css);
await writeFile(join(out, ".nojekyll"), "");
await writeFile(join(out, "index.html"), home());
for (const [slug, data] of Object.entries(pageData)) {
  const dir = join(out, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "index.html"), landing(slug, data));
}
const trainingGov = join(out, "dao-tao-tap-huan", "co-quan-nha-nuoc");
await mkdir(trainingGov, { recursive: true });
await writeFile(join(trainingGov, "index.html"), landing("dao-tao-tap-huan/co-quan-nha-nuoc", ["IAICT Academy / Cơ quan nhà nước", "Khung đào tạo theo cấp và nhóm vị trí công việc", [["Cấp tỉnh","Quản trị và chuyển đổi số cấp tỉnh."],["Sở/Ban/Ngành","Chương trình gắn với nghiệp vụ chuyên ngành."],["Xã/Phường","Kỹ năng số, dữ liệu và AI gắn với công vụ cấp cơ sở."],["Đơn vị sự nghiệp","Ứng dụng công nghệ và dữ liệu trong cung cấp dịch vụ."],["Lãnh đạo/Quản lý","Tư duy, quản trị và ra quyết định trong môi trường số."],["Chuyên viên","Kỹ năng và công cụ số phục vụ công việc hằng ngày."]]]));
console.log(`GitHub Pages demo built at ${out}`);
