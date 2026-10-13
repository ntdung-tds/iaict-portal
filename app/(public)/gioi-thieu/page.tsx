import Link from "next/link";
import type { Metadata } from "next";
import { CategoryLanding } from "@/components/category-landing";
import { pillars } from "@/lib/public-content";

export const metadata: Metadata = { title: "Giới thiệu" };

const approach = [
  { number: "01", title: "Xuất phát từ nhu cầu thực tế", text: "Làm rõ bài toán, đối tượng sử dụng, dữ liệu, hạ tầng và điều kiện vận hành trước khi lựa chọn công nghệ." },
  { number: "02", title: "Thiết kế để có thể triển khai", text: "Ưu tiên kiến trúc phù hợp nguồn lực, có lộ trình thử nghiệm, mở rộng và tích hợp thay vì dừng ở ý tưởng." },
  { number: "03", title: "Chuyển giao để đơn vị làm chủ", text: "Gắn sản phẩm với tài liệu, hướng dẫn, đào tạo và hỗ trợ vận hành để giải pháp có thể được tiếp nhận bền vững." },
];

export default function AboutPage() {
  return (
    <CategoryLanding
      eyebrow="Giới thiệu IAICT"
      title="Kết nối nghiên cứu, ứng dụng và chuyển giao"
      intro="IAICT định hướng hoạt động theo bốn trụ cột Technology, Solutions, Transfer và Academy — kết nối năng lực công nghệ với nhu cầu triển khai thực tế của cơ quan, tổ chức và doanh nghiệp."
      items={pillars}
    >
      <section className="section about-positioning-section">
        <div className="shell about-positioning-grid">
          <div>
            <p className="kicker">Định hướng hoạt động</p>
            <h2>Công nghệ chỉ thực sự có giá trị khi đi vào được công việc.</h2>
          </div>
          <div className="about-positioning-copy">
            <p>IAICT tập trung vào khoảng nối giữa nghiên cứu và ứng dụng: biến yêu cầu nghiệp vụ, dữ liệu và điều kiện hiện trường thành phương án công nghệ có thể thử nghiệm, triển khai, đánh giá và tiếp tục hoàn thiện.</p>
            <p>Cách tiếp cận này cho phép một bài toán được nhìn xuyên suốt từ nền tảng công nghệ, giải pháp triển khai, chuyển giao năng lực đến đào tạo người sử dụng — thay vì tách rời từng phần.</p>
          </div>
        </div>
      </section>

      <section className="section about-approach-section" aria-labelledby="about-approach-title">
        <div className="shell">
          <div className="about-section-head">
            <div><p className="kicker kicker-light">Cách IAICT tiếp cận</p><h2 id="about-approach-title">Ba nguyên tắc xuyên suốt một dự án ứng dụng</h2></div>
            <p>Giữ trọng tâm ở khả năng vận hành thực tế, khả năng tiếp nhận của đơn vị và lộ trình mở rộng sau giai đoạn đầu.</p>
          </div>
          <div className="about-approach-grid">
            {approach.map((item) => (
              <article key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-collaboration-section">
        <div className="shell about-collaboration-card">
          <div>
            <p className="kicker">Hợp tác cùng IAICT</p>
            <h2>Từ một nhu cầu đơn lẻ đến chương trình triển khai có cấu trúc</h2>
            <p>IAICT có thể tham gia ở từng phần việc hoặc đồng hành xuyên suốt: khảo sát, đề xuất kiến trúc, phát triển nền tảng, tích hợp thiết bị và dữ liệu, chuyển giao, đào tạo và hỗ trợ vận hành.</p>
          </div>
          <div className="about-collaboration-actions">
            <Link className="button button-primary" href="/giai-phap-dich-vu">Xem năng lực triển khai</Link>
            <Link className="text-link" href="/lien-he">Trao đổi nhu cầu →</Link>
          </div>
        </div>
      </section>
    </CategoryLanding>
  );
}
