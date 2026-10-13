import Link from "next/link";
import type { ReactNode } from "react";
import type { TaxonomyCard } from "@/lib/public-content";
import styles from "./category-landing-v6.module.css";

export type CategoryLandingVariant = "solutions" | "technology" | "transfer" | "academy";

type CategoryLandingProps = {
  eyebrow: string;
  title: string;
  intro: string;
  items?: TaxonomyCard[];
  children?: ReactNode;
  variant?: CategoryLandingVariant;
};

type CardDetail = {
  label: string;
  points: string[];
  tags: string[];
};

const variantContent: Record<
  CategoryLandingVariant,
  {
    sectionEyebrow: string;
    sectionTitle: string;
    sectionIntro: string;
    signals: [string, string][];
    finalEyebrow: string;
    finalTitle: string;
    finalBody: string;
  }
> = {
  solutions: {
    sectionEyebrow: "IAICT SOLUTIONS / DELIVERY SYSTEM",
    sectionTitle: "Từ bài toán vận hành đến giải pháp có thể triển khai.",
    sectionIntro:
      "Mỗi nhóm dịch vụ được tổ chức như một lớp năng lực có thể kết hợp theo nhu cầu thực tế, thay vì đóng gói cứng theo công nghệ.",
    signals: [
      ["START", "Bài toán & dữ liệu"],
      ["DESIGN", "Kiến trúc phù hợp"],
      ["PROVE", "PoC / thử nghiệm"],
      ["RUN", "Tích hợp & vận hành"],
    ],
    finalEyebrow: "IAICT / SOLUTIONS",
    finalTitle: "Cần một phương án phù hợp với bài toán thực tế?",
    finalBody: "Bắt đầu từ nhu cầu, hiện trạng và tiêu chí thành công — sau đó mới xác định công nghệ, phạm vi và lộ trình triển khai.",
  },
  technology: {
    sectionEyebrow: "IAICT TECHNOLOGY / CAPABILITY STACK",
    sectionTitle: "Các lớp công nghệ có thể ghép thành một hệ thống hoàn chỉnh.",
    sectionIntro:
      "Nền tảng được nhìn theo khả năng tạo dữ liệu, xử lý, tích hợp và khai thác — để có thể tái sử dụng cho nhiều bài toán khác nhau.",
    signals: [
      ["FIELD", "IoT & thiết bị"],
      ["CORE", "Dữ liệu & dịch vụ"],
      ["INTELLIGENCE", "AI & phân tích"],
      ["APPS", "Ứng dụng nghiệp vụ"],
    ],
    finalEyebrow: "IAICT / TECHNOLOGY",
    finalTitle: "Cần một nền tảng có thể tích hợp và mở rộng?",
    finalBody: "IAICT ưu tiên kiến trúc mô-đun, dữ liệu có cấu trúc và khả năng chuyển giao để nền tảng không bị khóa vào một giai đoạn triển khai duy nhất.",
  },
  transfer: {
    sectionEyebrow: "IAICT TRANSFER / FROM PROOF TO OPERATION",
    sectionTitle: "Chuyển giao không phải một buổi bàn giao.",
    sectionIntro:
      "Đó là chuỗi liên tục từ khảo sát, thử nghiệm, hoàn thiện đến tài liệu hóa, đào tạo và đồng hành sau tiếp nhận.",
    signals: [
      ["01", "Khảo sát"],
      ["02", "Thử nghiệm"],
      ["03", "Hoàn thiện"],
      ["04–05", "Chuyển giao & đồng hành"],
    ],
    finalEyebrow: "IAICT / TRANSFER",
    finalTitle: "Biến kết quả thử nghiệm thành năng lực của đơn vị tiếp nhận.",
    finalBody: "Trọng tâm là khả năng làm chủ: cấu hình, tài liệu, quy trình, đào tạo và cơ chế hỗ trợ phải đi cùng công nghệ được bàn giao.",
  },
  academy: {
    sectionEyebrow: "IAICT ACADEMY / LEARNING ARCHITECTURE",
    sectionTitle: "Đào tạo theo vị trí, nhiệm vụ và năng lực cần áp dụng.",
    sectionIntro:
      "Chương trình được tổ chức theo đối tượng, mục tiêu, module và hình thức để có thể triển khai linh hoạt cho từng đơn vị và cấp quản lý.",
    signals: [
      ["AUDIENCE", "Theo đối tượng"],
      ["OUTCOME", "Theo mục tiêu"],
      ["MODULE", "Theo chuyên đề"],
      ["FORMAT", "Trực tiếp / trực tuyến"],
    ],
    finalEyebrow: "IAICT / ACADEMY",
    finalTitle: "Xây dựng chương trình từ công việc thực tế.",
    finalBody: "IAICT có thể cùng đơn vị xác định nhóm học viên, năng lực đầu ra, module, thời lượng và cách tổ chức phù hợp với điều kiện triển khai.",
  },
};

const cardDetails: Record<CategoryLandingVariant, Record<string, CardDetail>> = {
  solutions: {
    "Tư vấn chuyển đổi số": { label: "DISCOVERY", points: ["Khảo sát hiện trạng & quy trình", "Xác định ưu tiên và lộ trình"], tags: ["Roadmap", "Assessment"] },
    "Tư vấn giải pháp công nghệ": { label: "ARCHITECTURE", points: ["So sánh phương án công nghệ", "Chọn kiến trúc theo điều kiện vận hành"], tags: ["Architecture", "Fit-for-purpose"] },
    "Thiết kế hệ thống": { label: "SYSTEM DESIGN", points: ["Kiến trúc ứng dụng & dữ liệu", "Tích hợp, phân quyền và vận hành"], tags: ["Data", "Integration"] },
    "AI & Dữ liệu": { label: "INTELLIGENCE", points: ["Tổ chức luồng dữ liệu", "AI có kiểm soát theo nghiệp vụ"], tags: ["AI", "Data"] },
    "IoT & Tự động hóa": { label: "FIELD SYSTEMS", points: ["Thiết bị, gateway và kết nối", "Dữ liệu hiện trường về hệ thống"], tags: ["IoT", "Automation"] },
    "Phần mềm theo yêu cầu": { label: "APPLICATION", points: ["Bám sát quy trình nghiệp vụ", "Thiết kế để tích hợp và mở rộng"], tags: ["Web/App", "Workflow"] },
    "Tích hợp & Vận hành": { label: "OPERATIONS", points: ["Kết nối hệ thống & dữ liệu", "Bàn giao, giám sát và hỗ trợ"], tags: ["Integration", "Operations"] },
  },
  technology: {
    "Nông – Lâm nghiệp thông minh": { label: "SMART SECTOR", points: ["Giám sát đối tượng & hiện trường", "Tập trung dữ liệu phục vụ quản lý"], tags: ["AgriTech", "Data"] },
    "IoT & Quan trắc": { label: "FIELD DATA", points: ["Cảm biến, gateway và truyền dẫn", "Thu thập dữ liệu theo thời gian"], tags: ["Sensor", "IoT"] },
    "Truy xuất nguồn gốc": { label: "TRACEABILITY", points: ["Liên kết thông tin theo chuỗi", "Tra cứu và xác thực nguồn gốc"], tags: ["Trace", "QR/Data"] },
    "Quản lý vòng đời": { label: "LIFECYCLE", points: ["Theo dõi trạng thái theo thời gian", "Lưu lịch sử thay đổi & tác nghiệp"], tags: ["Lifecycle", "Asset"] },
    "AI & Dữ liệu": { label: "INTELLIGENCE", points: ["Tổ chức dữ liệu có cấu trúc", "Phân tích và AI theo bài toán"], tags: ["AI", "Analytics"] },
    "Nền tảng/ứng dụng khác": { label: "EXTENSIBLE", points: ["Mô-đun hóa theo nhu cầu", "Kết nối hệ thống hiện có"], tags: ["API", "Modular"] },
  },
  transfer: {
    "Khảo sát": { label: "DISCOVER", points: ["Hiện trạng & điều kiện áp dụng", "Mục tiêu và tiêu chí tiếp nhận"], tags: ["Scope", "Baseline"] },
    "Thử nghiệm": { label: "PROVE", points: ["PoC / mô hình kiểm chứng", "Đo lường theo tiêu chí thống nhất"], tags: ["PoC", "Evidence"] },
    "Hoàn thiện": { label: "REFINE", points: ["Điều chỉnh từ kết quả thử nghiệm", "Chuẩn hóa cấu hình & quy trình"], tags: ["Refine", "Standardize"] },
    "Chuyển giao": { label: "ENABLE", points: ["Tài liệu & hướng dẫn vận hành", "Đào tạo người tiếp nhận"], tags: ["Docs", "Training"] },
    "Đồng hành": { label: "SCALE", points: ["Hỗ trợ sau bàn giao", "Mở rộng và tích hợp khi cần"], tags: ["Support", "Scale"] },
  },
  academy: {
    "Theo đối tượng": { label: "AUDIENCE", points: ["Lãnh đạo / quản lý", "Chuyên viên & nhóm nghiệp vụ"], tags: ["Role-based", "Public sector"] },
    "Theo mục tiêu": { label: "OUTCOME", points: ["Năng lực cần áp dụng", "Tình huống gắn với công việc"], tags: ["Outcome", "Practice"] },
    "Theo module": { label: "CURRICULUM", points: ["Chuyên đề có thể ghép linh hoạt", "Điều chỉnh theo lĩnh vực & trình độ"], tags: ["Module", "Flexible"] },
    "Theo hình thức": { label: "DELIVERY", points: ["Trực tiếp / trực tuyến / kết hợp", "Thực hành, tình huống & đánh giá"], tags: ["Hybrid", "Assessment"] },
  },
};

export function CategoryLanding({
  eyebrow,
  title,
  intro,
  items = [],
  children,
  variant = "solutions",
}: CategoryLandingProps) {
  const content = variantContent[variant];
  const sequential = variant === "transfer";

  return (
    <main id="main-content" className={styles.page} data-variant={variant}>
      <section className={styles.hero}>
        <div className={`shell ${styles.heroGrid}`}>
          <div>
            <p className={styles.kicker}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.lead}>{intro}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#capabilities">Khám phá năng lực <span>↓</span></a>
              <Link className={styles.secondaryAction} href="/lien-he">Trao đổi nhu cầu ↗</Link>
            </div>
          </div>

          <aside className={styles.signalPanel} aria-label={`Các lớp năng lực ${title}`}>
            {content.signals.map(([label, value]) => (
              <div key={label}><small>{label}</small><strong>{value}</strong></div>
            ))}
          </aside>
        </div>
      </section>

      {items.length > 0 ? (
        <section className={styles.body} id="capabilities" aria-labelledby="capability-title">
          <div className="shell">
            <div className={styles.sectionHead}>
              <div><p className={styles.kicker}>{content.sectionEyebrow}</p><h2 id="capability-title">{content.sectionTitle}</h2></div>
              <p>{content.sectionIntro}</p>
            </div>

            <div className={styles.grid} data-sequential={sequential ? "true" : undefined}>
              {items.map((item, index) => {
                const anchor = item.title === "AI & Dữ liệu" ? "ai-du-lieu" : item.title === "IoT & Quan trắc" ? "iot-quan-trac" : undefined;
                const detail = cardDetails[variant][item.title];

                return (
                  <article className={styles.card} key={item.title} id={anchor}>
                    <div className={styles.cardTop}>
                      <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                      <span className={styles.cardLabel}>{detail?.label ?? "CAPABILITY"}</span>
                      <i className={styles.dot} aria-hidden="true" />
                    </div>
                    <h3>{item.title}</h3>
                    <p className={styles.summary}>{item.summary}</p>
                    {detail ? (
                      <>
                        <ul className={styles.points}>{detail.points.map((point) => <li key={point}>{point}</li>)}</ul>
                        <div className={styles.tags}>{detail.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                      </>
                    ) : null}
                    {item.href ? <Link className={styles.cardLink} href={item.href}>Khám phá →</Link> : null}
                    <span className={styles.cardGlyph} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {children ? <div className={styles.children}>{children}</div> : null}

      <section className={styles.final}>
        <div className={`shell ${styles.finalInner}`}>
          <div><p className={styles.kicker}>{content.finalEyebrow}</p><h2>{content.finalTitle}</h2><p>{content.finalBody}</p></div>
          <Link className={styles.primaryAction} href="/lien-he">Liên hệ & Hợp tác <span>↗</span></Link>
        </div>
      </section>
    </main>
  );
}
