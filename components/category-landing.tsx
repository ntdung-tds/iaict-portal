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
              <a className={styles.primaryAction} href="#capabilities">
                Khám phá năng lực <span>↓</span>
              </a>
              <Link className={styles.secondaryAction} href="/lien-he">
                Trao đổi nhu cầu ↗
              </Link>
            </div>
          </div>

          <aside className={styles.signalPanel} aria-label={`Các lớp năng lực ${title}`}>
            {content.signals.map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </aside>
        </div>
      </section>

      {items.length > 0 ? (
        <section className={styles.body} id="capabilities" aria-labelledby="capability-title">
          <div className="shell">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.kicker}>{content.sectionEyebrow}</p>
                <h2 id="capability-title">{content.sectionTitle}</h2>
              </div>
              <p>{content.sectionIntro}</p>
            </div>

            <div className={styles.grid} data-sequential={sequential ? "true" : undefined}>
              {items.map((item, index) => {
                const anchor =
                  item.title === "AI & Dữ liệu"
                    ? "ai-du-lieu"
                    : item.title === "IoT & Quan trắc"
                      ? "iot-quan-trac"
                      : undefined;

                return (
                  <article className={styles.card} key={item.title} id={anchor}>
                    <div className={styles.cardTop}>
                      <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
                      <i className={styles.dot} aria-hidden="true" />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    {item.href ? <Link href={item.href}>Khám phá →</Link> : null}
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
          <div>
            <p className={styles.kicker}>{content.finalEyebrow}</p>
            <h2>{content.finalTitle}</h2>
            <p>{content.finalBody}</p>
          </div>
          <Link className={styles.primaryAction} href="/lien-he">
            Liên hệ & Hợp tác <span>↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
