import Link from "next/link";
import type { ReactNode } from "react";
import type { TaxonomyCard } from "@/lib/public-content";
import styles from "./category-landing-v62.module.css";

export type CategoryLandingVariant = "solutions" | "technology" | "transfer" | "academy";

type CategoryLandingProps = {
  eyebrow: string;
  title: string;
  intro: string;
  items?: TaxonomyCard[];
  children?: ReactNode;
  variant?: CategoryLandingVariant;
};

type Signal = { label: string; value: string; detail: string };
type CardDetail = {
  label: string;
  narrative: string;
  points: string[];
  output: string;
  focus: string;
  tags: string[];
};

const variantContent: Record<CategoryLandingVariant, {
  sectionEyebrow: string;
  sectionTitle: string;
  sectionIntro: string;
  signals: Signal[];
  finalEyebrow: string;
  finalTitle: string;
  finalBody: string;
}> = {
  solutions: {
    sectionEyebrow: "IAICT SOLUTIONS / DELIVERY SYSTEM",
    sectionTitle: "Từ bài toán vận hành đến giải pháp có thể triển khai.",
    sectionIntro: "Mỗi nhóm dịch vụ được tổ chức như một lớp năng lực có thể kết hợp theo nhu cầu thực tế, thay vì đóng gói cứng theo công nghệ.",
    signals: [
      { label: "START", value: "Bài toán & dữ liệu", detail: "Khảo sát hiện trạng, quy trình, dữ liệu sẵn có và tiêu chí thành công." },
      { label: "DESIGN", value: "Kiến trúc phù hợp", detail: "So sánh phương án, chọn mô hình tích hợp và mức đầu tư phù hợp điều kiện vận hành." },
      { label: "PROVE", value: "PoC / thử nghiệm", detail: "Kiểm chứng nhanh trong phạm vi nhỏ, đo bằng tiêu chí đã thống nhất trước triển khai rộng." },
      { label: "RUN", value: "Tích hợp & vận hành", detail: "Bàn giao, giám sát, hỗ trợ và mở rộng sau khi giải pháp đi vào sử dụng." },
    ],
    finalEyebrow: "IAICT / SOLUTIONS",
    finalTitle: "Cần một phương án phù hợp với bài toán thực tế?",
    finalBody: "Bắt đầu từ nhu cầu, hiện trạng và tiêu chí thành công — sau đó mới xác định công nghệ, phạm vi và lộ trình triển khai.",
  },
  technology: {
    sectionEyebrow: "IAICT TECHNOLOGY / CAPABILITY STACK",
    sectionTitle: "Các lớp công nghệ có thể ghép thành một hệ thống hoàn chỉnh.",
    sectionIntro: "Nền tảng được nhìn theo khả năng tạo dữ liệu, xử lý, tích hợp và khai thác — để có thể tái sử dụng cho nhiều bài toán khác nhau.",
    signals: [
      { label: "FIELD", value: "IoT & thiết bị", detail: "Cảm biến, gateway, nguồn điện và kết nối dữ liệu từ hiện trường." },
      { label: "CORE", value: "Dữ liệu & dịch vụ", detail: "CSDL, API, phân quyền, lưu trữ và đồng bộ dữ liệu giữa các lớp hệ thống." },
      { label: "INTELLIGENCE", value: "AI & phân tích", detail: "Phân tích, cảnh báo và AI theo bài toán nghiệp vụ, có kiểm soát dữ liệu đầu vào." },
      { label: "APPS", value: "Ứng dụng nghiệp vụ", detail: "Dashboard, truy xuất, quản lý vòng đời và các quy trình số phục vụ người dùng cuối." },
    ],
    finalEyebrow: "IAICT / TECHNOLOGY",
    finalTitle: "Cần một nền tảng có thể tích hợp và mở rộng?",
    finalBody: "IAICT ưu tiên kiến trúc mô-đun, dữ liệu có cấu trúc và khả năng chuyển giao để nền tảng không bị khóa vào một giai đoạn triển khai duy nhất.",
  },
  transfer: {
    sectionEyebrow: "IAICT TRANSFER / FROM PROOF TO OPERATION",
    sectionTitle: "Chuyển giao không phải một buổi bàn giao.",
    sectionIntro: "Đó là chuỗi liên tục từ khảo sát, thử nghiệm, hoàn thiện đến tài liệu hóa, đào tạo và đồng hành sau tiếp nhận.",
    signals: [
      { label: "01", value: "Khảo sát", detail: "Xác định hiện trạng, điều kiện áp dụng và tiêu chí tiếp nhận." },
      { label: "02", value: "Thử nghiệm", detail: "PoC hoặc mô hình kiểm chứng với phạm vi và chỉ số đánh giá rõ ràng." },
      { label: "03", value: "Hoàn thiện", detail: "Điều chỉnh cấu hình, quy trình và tài liệu dựa trên kết quả thử nghiệm." },
      { label: "04–05", value: "Chuyển giao & đồng hành", detail: "Đào tạo, bàn giao vận hành, hỗ trợ sau tiếp nhận và mở rộng khi cần." },
    ],
    finalEyebrow: "IAICT / TRANSFER",
    finalTitle: "Biến kết quả thử nghiệm thành năng lực của đơn vị tiếp nhận.",
    finalBody: "Trọng tâm là khả năng làm chủ: cấu hình, tài liệu, quy trình, đào tạo và cơ chế hỗ trợ phải đi cùng công nghệ được bàn giao.",
  },
  academy: {
    sectionEyebrow: "IAICT ACADEMY / LEARNING ARCHITECTURE",
    sectionTitle: "Đào tạo theo vị trí, nhiệm vụ và năng lực cần áp dụng.",
    sectionIntro: "Chương trình được tổ chức theo đối tượng, mục tiêu, module và hình thức để có thể triển khai linh hoạt cho từng đơn vị và cấp quản lý.",
    signals: [
      { label: "AUDIENCE", value: "Theo đối tượng", detail: "Tách nhóm lãnh đạo, quản lý, chuyên viên và nhóm nghiệp vụ để chọn độ sâu phù hợp." },
      { label: "OUTCOME", value: "Theo mục tiêu", detail: "Xác định năng lực đầu ra và tình huống cần áp dụng sau khóa học." },
      { label: "MODULE", value: "Theo chuyên đề", detail: "Ghép module theo lĩnh vực, thời lượng và trình độ người học thay vì dùng một giáo án cố định." },
      { label: "FORMAT", value: "Trực tiếp / trực tuyến", detail: "Tổ chức linh hoạt, kết hợp thực hành, tình huống và đánh giá đầu ra." },
    ],
    finalEyebrow: "IAICT / ACADEMY",
    finalTitle: "Xây dựng chương trình từ công việc thực tế.",
    finalBody: "IAICT có thể cùng đơn vị xác định nhóm học viên, năng lực đầu ra, module, thời lượng và cách tổ chức phù hợp với điều kiện triển khai.",
  },
};

const cardDetails: Record<CategoryLandingVariant, Record<string, CardDetail>> = {
  solutions: {
    "Tư vấn chuyển đổi số": {
      label: "DISCOVERY",
      narrative: "Không bắt đầu bằng danh sách công nghệ. Trọng tâm là nhận diện điểm nghẽn trong quy trình, dữ liệu và cách phối hợp để xác định phần việc cần ưu tiên trước.",
      points: ["Rà soát quy trình, hệ thống và nguồn dữ liệu hiện có", "Xác định mục tiêu, mức ưu tiên và tiêu chí đo kết quả", "Xây dựng lộ trình theo giai đoạn, nguồn lực và khả năng tiếp nhận"],
      output: "Báo cáo hiện trạng · danh mục ưu tiên · lộ trình triển khai",
      focus: "Tổ chức cần xác định hướng đi trước khi đầu tư hệ thống",
      tags: ["Roadmap", "Assessment", "Governance"],
    },
    "Tư vấn giải pháp công nghệ": {
      label: "ARCHITECTURE",
      narrative: "IAICT đặt các phương án công nghệ vào cùng một bài toán vận hành để so sánh về độ phù hợp, chi phí tích hợp, khả năng mở rộng và mức độ đơn vị có thể làm chủ.",
      points: ["Làm rõ yêu cầu chức năng, dữ liệu và hạ tầng", "So sánh phương án kiến trúc và mức độ tích hợp", "Đề xuất cấu hình phù hợp với điều kiện triển khai thực tế"],
      output: "Phương án kiến trúc · phạm vi kỹ thuật · khuyến nghị triển khai",
      focus: "Bài toán đã rõ nhưng cần lựa chọn cách triển khai phù hợp",
      tags: ["Architecture", "Fit-for-purpose", "Integration"],
    },
    "Thiết kế hệ thống": {
      label: "SYSTEM DESIGN",
      narrative: "Thiết kế đồng thời lớp ứng dụng, dữ liệu, tích hợp và vận hành để hệ thống không chỉ chạy được ở giai đoạn đầu mà còn có thể bảo trì và mở rộng về sau.",
      points: ["Thiết kế kiến trúc ứng dụng, dữ liệu và API", "Xác định phân quyền, luồng xử lý và điểm tích hợp", "Chuẩn hóa yêu cầu vận hành, giám sát và sao lưu"],
      output: "Sơ đồ kiến trúc · mô hình dữ liệu · đặc tả tích hợp",
      focus: "Dự án cần nền móng kỹ thuật rõ trước khi phát triển",
      tags: ["Data", "API", "Operations"],
    },
    "AI & Dữ liệu": {
      label: "INTELLIGENCE",
      narrative: "AI chỉ tạo giá trị khi dữ liệu và quy trình sử dụng được tổ chức đúng. IAICT ưu tiên chuẩn hóa nguồn dữ liệu trước, sau đó mới chọn cách phân tích hoặc ứng dụng mô hình phù hợp.",
      points: ["Tổ chức nguồn dữ liệu và luồng xử lý có kiểm soát", "Thiết kế bài toán AI bám sát nghiệp vụ và người dùng", "Đặt tiêu chí kiểm tra, phản hồi và giám sát đầu ra"],
      output: "Luồng dữ liệu · nguyên mẫu AI · tiêu chí đánh giá",
      focus: "Khai thác dữ liệu để hỗ trợ công việc và ra quyết định",
      tags: ["AI", "Data", "Responsible use"],
    },
    "IoT & Tự động hóa": {
      label: "FIELD SYSTEMS",
      narrative: "Từ thiết bị hiện trường đến cơ sở dữ liệu phải là một chuỗi liên tục. Thiết kế tập trung vào khả năng thu dữ liệu ổn định, truyền dẫn phù hợp và vận hành trong điều kiện thực tế.",
      points: ["Lựa chọn cảm biến, gateway, nguồn và kết nối", "Thiết kế luồng dữ liệu từ hiện trường về server", "Tích hợp cảnh báo, giám sát và quy trình phản hồi"],
      output: "Kiến trúc IoT · cấu hình kết nối · luồng dữ liệu hiện trường",
      focus: "Quan trắc, giám sát và thu thập dữ liệu tự động",
      tags: ["IoT", "Sensor", "Automation"],
    },
    "Phần mềm theo yêu cầu": {
      label: "APPLICATION",
      narrative: "Phần mềm được thiết kế từ quy trình nghiệp vụ và vai trò người dùng thay vì ép đơn vị thay đổi cách làm chỉ để phù hợp với một sản phẩm đóng gói sẵn.",
      points: ["Phân tích luồng công việc và nhóm người dùng", "Thiết kế chức năng, dữ liệu và trải nghiệm sử dụng", "Chuẩn bị khả năng tích hợp với hệ thống hiện có"],
      output: "Ứng dụng web/mobile · quy trình số · tài liệu sử dụng",
      focus: "Quy trình nghiệp vụ đặc thù cần số hóa hoặc tối ưu",
      tags: ["Web/App", "Workflow", "UX"],
    },
    "Tích hợp & Vận hành": {
      label: "OPERATIONS",
      narrative: "Một hệ thống chỉ hoàn thành khi dữ liệu đi đúng luồng, các nền tảng trao đổi được với nhau và đơn vị tiếp nhận có đủ công cụ để theo dõi, xử lý sự cố và vận hành thường xuyên.",
      points: ["Kết nối API, dữ liệu và các hệ thống liên quan", "Thiết lập giám sát, sao lưu và cơ chế cảnh báo", "Bàn giao cấu hình, tài liệu và hỗ trợ sau triển khai"],
      output: "Kết nối tích hợp · bộ tài liệu vận hành · cơ chế hỗ trợ",
      focus: "Đưa hệ thống vào sử dụng ổn định và có thể làm chủ",
      tags: ["Integration", "Monitoring", "Operations"],
    },
  },
  technology: {
    "Nông – Lâm nghiệp thông minh": {
      label: "SMART SECTOR",
      narrative: "Kết hợp dữ liệu hiện trường, thông tin đối tượng quản lý và các lớp ứng dụng để hình thành một không gian dữ liệu dùng chung cho giám sát, phân tích và tác nghiệp ngành.",
      points: ["Theo dõi hiện trạng, vị trí và biến động đối tượng", "Kết nối dữ liệu cảm biến, hồ sơ và hoạt động tác nghiệp", "Tổng hợp dashboard và báo cáo phục vụ quản lý"],
      output: "Nền tảng quản lý · dữ liệu hiện trường · dashboard chuyên ngành",
      focus: "Nông nghiệp, lâm nghiệp và các mô hình quản lý theo địa bàn",
      tags: ["AgriTech", "Forestry", "Data"],
    },
    "IoT & Quan trắc": {
      label: "FIELD DATA",
      narrative: "Lớp IoT được thiết kế như hạ tầng tạo dữ liệu: cảm biến đo, gateway thu nhận, kết nối truyền về server và cơ chế theo dõi trạng thái thiết bị trong suốt quá trình vận hành.",
      points: ["Kết nối cảm biến và thiết bị hiện trường", "Truyền dữ liệu qua 4G/LAN hoặc kết nối phù hợp", "Lưu trữ, giám sát và khai thác dữ liệu theo thời gian"],
      output: "Dữ liệu quan trắc · trạng thái thiết bị · API phục vụ ứng dụng",
      focus: "Môi trường, sản xuất, hạ tầng và các điểm cần giám sát từ xa",
      tags: ["Sensor", "Gateway", "IoT"],
    },
    "Truy xuất nguồn gốc": {
      label: "TRACEABILITY",
      narrative: "Mỗi đối tượng được gắn với một chuỗi thông tin có cấu trúc để người dùng có thể tra cứu nguồn gốc, quá trình hình thành và các mốc dữ liệu liên quan theo quyền được phép.",
      points: ["Xác định dữ liệu cần ghi nhận theo từng công đoạn", "Liên kết mã định danh với hồ sơ và lịch sử liên quan", "Cung cấp giao diện tra cứu và cơ chế xác thực dữ liệu"],
      output: "Mã truy xuất · hồ sơ số · lịch sử chuỗi dữ liệu",
      focus: "Sản phẩm, vật tư, tài sản hoặc đối tượng cần chứng minh nguồn gốc",
      tags: ["Trace", "QR/Data", "History"],
    },
    "Quản lý vòng đời": {
      label: "LIFECYCLE",
      narrative: "Theo dõi đối tượng từ khi khởi tạo đến khi thay đổi trạng thái, bảo trì, chuyển giao hoặc kết thúc sử dụng, giúp dữ liệu không bị đứt đoạn giữa các giai đoạn quản lý.",
      points: ["Thiết lập trạng thái và mốc sự kiện theo vòng đời", "Lưu lịch sử thay đổi, người thực hiện và tài liệu liên quan", "Tổng hợp dữ liệu phục vụ kiểm tra và phân tích"],
      output: "Hồ sơ vòng đời · lịch sử sự kiện · báo cáo trạng thái",
      focus: "Tài sản, sản phẩm, thiết bị và đối tượng quản lý dài hạn",
      tags: ["Lifecycle", "Asset", "Audit trail"],
    },
    "AI & Dữ liệu": {
      label: "INTELLIGENCE",
      narrative: "Dữ liệu được chuẩn hóa và tổ chức thành các lớp có thể tìm kiếm, phân tích và kết nối với công cụ AI để hỗ trợ tổng hợp, cảnh báo, tra cứu hoặc ra quyết định theo ngữ cảnh.",
      points: ["Chuẩn hóa và tổ chức dữ liệu từ nhiều nguồn", "Xây dựng lớp phân tích, tìm kiếm và khai thác", "Tích hợp AI theo kịch bản sử dụng cụ thể"],
      output: "Kho dữ liệu · dashboard phân tích · chức năng AI hỗ trợ",
      focus: "Đơn vị có dữ liệu nhưng chưa khai thác thành năng lực sử dụng",
      tags: ["AI", "Analytics", "Knowledge"],
    },
    "Nền tảng/ứng dụng khác": {
      label: "EXTENSIBLE",
      narrative: "Các module có thể được ghép thêm theo nhu cầu mới mà không phải thay toàn bộ nền tảng, ưu tiên API mở, cấu trúc dữ liệu rõ và khả năng tích hợp với hệ thống hiện hữu.",
      points: ["Bổ sung module theo bài toán và nhóm người dùng", "Kết nối API hoặc dữ liệu từ nền tảng bên ngoài", "Tái sử dụng các lớp dữ liệu, xác thực và vận hành chung"],
      output: "Module mở rộng · API tích hợp · cấu hình dùng chung",
      focus: "Bài toán phát sinh cần mở rộng trên hạ tầng hiện có",
      tags: ["API", "Modular", "Extensible"],
    },
  },
  transfer: {
    "Khảo sát": {
      label: "DISCOVER",
      narrative: "Làm rõ điều kiện thực tế trước khi thử nghiệm để tránh mang một mô hình tốt trên giấy nhưng không phù hợp môi trường tiếp nhận.",
      points: ["Hiện trạng kỹ thuật và quy trình", "Nguồn lực và điều kiện vận hành", "Mục tiêu và tiêu chí tiếp nhận"],
      output: "Baseline · phạm vi · tiêu chí đánh giá",
      focus: "Bước 01 / xác định đúng điểm xuất phát",
      tags: ["Scope", "Baseline"],
    },
    "Thử nghiệm": {
      label: "PROVE",
      narrative: "Thu hẹp phạm vi để kiểm chứng chức năng cốt lõi, chất lượng dữ liệu và khả năng vận hành trước khi đầu tư rộng hơn.",
      points: ["PoC hoặc mô hình kiểm chứng", "Kịch bản thử nghiệm thực tế", "Ghi nhận kết quả và sai lệch"],
      output: "PoC · bằng chứng thử nghiệm · kết quả đánh giá",
      focus: "Bước 02 / chứng minh giải pháp hoạt động",
      tags: ["PoC", "Evidence"],
    },
    "Hoàn thiện": {
      label: "REFINE",
      narrative: "Dùng dữ liệu từ thử nghiệm để điều chỉnh cấu hình, quy trình và tài liệu nhằm đưa giải pháp từ trạng thái kiểm chứng sang trạng thái có thể sử dụng ổn định.",
      points: ["Chốt cấu hình và luồng vận hành", "Khắc phục vấn đề phát hiện khi thử nghiệm", "Chuẩn hóa tài liệu và hướng dẫn"],
      output: "Phiên bản hoàn thiện · cấu hình chuẩn · tài liệu",
      focus: "Bước 03 / chuyển từ PoC sang vận hành",
      tags: ["Refine", "Standardize"],
    },
    "Chuyển giao": {
      label: "ENABLE",
      narrative: "Bàn giao không chỉ là source code hoặc thiết bị; đơn vị tiếp nhận cần hiểu cách vận hành, xử lý tình huống và duy trì hệ thống sau khi đội triển khai rút đi.",
      points: ["Bàn giao cấu hình và tài liệu", "Đào tạo nhóm tiếp nhận", "Xác nhận khả năng vận hành độc lập"],
      output: "Bộ bàn giao · hướng dẫn · nội dung đào tạo",
      focus: "Bước 04 / tạo năng lực làm chủ",
      tags: ["Docs", "Training"],
    },
    "Đồng hành": {
      label: "SCALE",
      narrative: "Sau bàn giao, IAICT có thể tiếp tục hỗ trợ khi đơn vị mở rộng phạm vi, tích hợp thêm hệ thống hoặc cần điều chỉnh theo điều kiện vận hành mới.",
      points: ["Hỗ trợ sau tiếp nhận", "Tối ưu dựa trên dữ liệu vận hành", "Mở rộng module và điểm tích hợp"],
      output: "Hỗ trợ kỹ thuật · kế hoạch mở rộng · cập nhật cấu hình",
      focus: "Bước 05 / duy trì và mở rộng năng lực",
      tags: ["Support", "Scale"],
    },
  },
  academy: {
    "Theo đối tượng": {
      label: "AUDIENCE",
      narrative: "Cùng một chủ đề nhưng lãnh đạo, quản lý và chuyên viên cần mức độ khác nhau. Nội dung được phân tầng để mỗi nhóm học đúng phần gắn với vai trò của mình.",
      points: ["Lãnh đạo và cán bộ quản lý", "Chuyên viên, cán bộ nghiệp vụ", "Nhóm chuyên môn theo lĩnh vực"],
      output: "Nhóm học viên · mức độ nội dung · tình huống phù hợp",
      focus: "Thiết kế chương trình theo vai trò và vị trí việc làm",
      tags: ["Role-based", "Public sector", "Professional"],
    },
    "Theo mục tiêu": {
      label: "OUTCOME",
      narrative: "Mỗi chương trình xác định rõ học viên cần làm được gì sau khóa học, từ nhận biết, sử dụng công cụ đến áp dụng vào quy trình và tạo đầu ra cụ thể.",
      points: ["Xác định năng lực đầu ra", "Gắn bài học với tình huống công việc", "Thiết kế bài thực hành hoặc sản phẩm cuối khóa"],
      output: "Chuẩn đầu ra · bài thực hành · tiêu chí đánh giá",
      focus: "Đào tạo để áp dụng, không chỉ truyền đạt kiến thức",
      tags: ["Outcome", "Practice", "Assessment"],
    },
    "Theo module": {
      label: "CURRICULUM",
      narrative: "Nội dung được chia thành các module độc lập để có thể ghép theo thời lượng, lĩnh vực và trình độ thay vì buộc mọi đơn vị đi theo một chương trình cố định.",
      points: ["Module nền tảng và module chuyên sâu", "Điều chỉnh theo lĩnh vực và cấp quản lý", "Kết hợp lý thuyết, tình huống và thực hành"],
      output: "Khung chương trình · module nội dung · tài liệu học",
      focus: "Chương trình linh hoạt nhưng vẫn có cấu trúc nhất quán",
      tags: ["Module", "Flexible", "Curriculum"],
    },
    "Theo hình thức": {
      label: "DELIVERY",
      narrative: "Hình thức tổ chức được chọn theo quy mô, địa bàn, thời gian và mức độ cần thực hành để bảo đảm người học có thể tham gia và tiếp thu hiệu quả.",
      points: ["Trực tiếp, trực tuyến hoặc kết hợp", "Workshop, tình huống và thực hành hướng dẫn", "Đánh giá đầu ra hoặc hỗ trợ sau khóa học"],
      output: "Kế hoạch tổ chức · học liệu · phương án đánh giá",
      focus: "Phù hợp điều kiện triển khai của từng đơn vị",
      tags: ["Hybrid", "Workshop", "Assessment"],
    },
  },
};

export function CategoryLanding({ eyebrow, title, intro, items = [], children, variant = "solutions" }: CategoryLandingProps) {
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
            {content.signals.map((signal) => (
              <article key={signal.label}>
                <small>{signal.label}</small>
                <strong>{signal.value}</strong>
                <p>{signal.detail}</p>
              </article>
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
                        <p className={styles.narrative}>{detail.narrative}</p>
                        <div className={styles.contentBlock}>
                          <span className={styles.blockLabel}>Nội dung chính</span>
                          <ul className={styles.points}>{detail.points.map((point) => <li key={point}>{point}</li>)}</ul>
                        </div>
                        <div className={styles.metaGrid}>
                          <div><small>Đầu ra</small><strong>{detail.output}</strong></div>
                          <div><small>Trọng tâm</small><strong>{detail.focus}</strong></div>
                        </div>
                        <div className={styles.cardFooter}>
                          <div className={styles.tags}>{detail.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                          {item.href ? <Link className={styles.cardLink} href={item.href}>Khám phá →</Link> : null}
                        </div>
                      </>
                    ) : item.href ? <Link className={styles.cardLink} href={item.href}>Khám phá →</Link> : null}
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
