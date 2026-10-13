# IAICT Portal

Cổng thông tin điện tử IAICT — Viện Ứng dụng Công nghệ Thông tin và Truyền thông.

## Trạng thái hiện tại

Giao diện public đã được nâng cấp theo hệ thiết kế institutional-tech, bao gồm:

- Trang chủ
- Giới thiệu
- Sản phẩm & Nền tảng
- Giải pháp & Dịch vụ
- Chuyển giao công nghệ
- Đào tạo & Tập huấn
- Dự án tiêu biểu
- Tin tức & Sự kiện
- Liên hệ & Hợp tác

Hệ thống vẫn giữ nguyên nguyên tắc evidence-first: không công bố số liệu, thành tích hoặc hồ sơ đối tác/chuyên gia chưa được xác minh.

## Công nghệ

- Next.js 16
- React 19
- TypeScript
- Vite / vinext
- Cloudflare target
- Vercel production preview

## Phát triển

```bash
npm install
npm run dev
```

## Kiểm tra

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Môi trường Node

Dự án ghim Node.js 22.x để đồng bộ với môi trường build và tránh tự động nhảy major runtime ngoài ý muốn.
