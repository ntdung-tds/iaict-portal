import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "IAICT — Công nghệ, Giải pháp, Chuyển giao, Đào tạo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "white",
          background: "linear-gradient(135deg, #061f3d 0%, #083e67 58%, #0a5a67 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-80px",
            top: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            border: "1px solid rgba(103, 220, 209, .32)",
            boxShadow: "0 0 0 70px rgba(103,220,209,.04), 0 0 0 140px rgba(103,220,209,.025)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              width: "88px",
              height: "88px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "22px",
              color: "#eaffff",
              background: "linear-gradient(145deg, #0b6e8d, #0c9389)",
              fontSize: "30px",
              fontWeight: 800,
              letterSpacing: "-1px",
              boxShadow: "0 18px 40px rgba(0,0,0,.18)",
            }}
          >
            IA
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-1px" }}>IAICT</span>
            <span style={{ marginTop: "5px", color: "#b9d2e3", fontSize: "18px" }}>
              Viện Ứng dụng Công nghệ Thông tin và Truyền thông
            </span>
          </div>
        </div>

        <div style={{ maxWidth: "900px", display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#6edbd1", fontSize: "18px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" }}>
            Research → Build → Transfer → Scale
          </span>
          <div style={{ marginTop: "20px", fontSize: "58px", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-2.5px" }}>
            Từ bài toán thực tế đến giải pháp số có thể triển khai.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#b8cede", fontSize: "17px" }}>
          <span>Công nghệ • Giải pháp • Chuyển giao • Đào tạo</span>
          <span style={{ color: "#70dcd2", fontWeight: 700 }}>iaict-demo.vercel.app</span>
        </div>
      </div>
    ),
    size,
  );
}
