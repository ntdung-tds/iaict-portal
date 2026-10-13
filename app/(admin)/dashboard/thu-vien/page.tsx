import { MediaLibraryManager } from "@/components/admin/media-library-manager";
import { getMediaSnapshot } from "@/lib/media-store";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const snapshot = await getMediaSnapshot();

  return (
    <div className="admin-page admin-media-page">
      <div className="admin-page-head admin-page-head-compact">
        <div>
          <p>Content Operations / Media</p>
          <h1>Thư viện Media</h1>
          <span>Quản lý ảnh dùng cho tin tức, sự kiện và các nội dung công khai của IAICT.</span>
        </div>
      </div>

      <MediaLibraryManager
        initialItems={snapshot.state.items}
        initialRevision={snapshot.state.revision}
        storageReady={snapshot.storageReady}
        materialized={snapshot.materialized}
      />
    </div>
  );
}
