"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './published-product-catalog.module.css';

type CatalogKind = 'product' | 'solution';
type CatalogItem = { id: string; title: string; slug: string; summary: string | null };
type CatalogState = { kind: CatalogKind; status: 'loading' | 'ready' | 'error'; items: CatalogItem[] };
const catalogs = {
  product: {
    id: 'published-products', path: '/san-pham-nen-tang', endpoint: '/api/public/products',
    title: 'Sản phẩm & nền tảng đã công bố', name: 'sản phẩm',
    description: 'Tìm hiểu chức năng, công nghệ và khả năng tích hợp của từng sản phẩm.',
  },
  solution: {
    id: 'published-solutions', path: '/giai-phap-dich-vu', endpoint: '/api/public/solutions',
    title: 'Giải pháp & dịch vụ đã công bố', name: 'giải pháp',
    description: 'Tìm hiểu bài toán, phạm vi triển khai, quy trình và các sản phẩm bàn giao.',
  },
} as const;
const previewCmsUrl = process.env.NEXT_PUBLIC_CMS_URL;
const previewOrigin = process.env.NEXT_PUBLIC_STATIC_PREVIEW === 'true' && previewCmsUrl
  ? new URL(previewCmsUrl).origin : null;

export function PublishedCmsCatalog({ kind }: { kind: CatalogKind }) {
  const catalog = catalogs[kind];
  const liveCatalogUrl = previewOrigin ? `${previewOrigin}${catalog.path}#${catalog.id}` : null;
  const [result, setResult] = useState<CatalogState>({ kind, status: 'loading', items: [] });
  const [attempt, setAttempt] = useState(0);
  const current = result.kind === kind ? result : { kind, status: 'loading', items: [] };

  useEffect(() => {
    if (liveCatalogUrl) return;
    const controller = new AbortController();
    setResult({ kind, status: 'loading', items: [] });
    void fetch(catalog.endpoint, { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Catalog unavailable');
        const payload = await response.json() as { items?: unknown };
        if (!Array.isArray(payload.items) || !payload.items.every(item =>
          item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.slug === 'string')) {
          throw new Error('Invalid catalog');
        }
        if (controller.signal.aborted) return;
        const items: CatalogItem[] = payload.items.map(item => ({
          id: item.id, title: item.title, slug: item.slug,
          summary: typeof item.summary === 'string' ? item.summary : null,
        }));
        setResult({ kind, status: 'ready', items });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ kind, status: 'error', items: [] }); });
    return () => controller.abort();
  }, [attempt, catalog.endpoint, kind, liveCatalogUrl]);

  return <section id={catalog.id} className={`shell ${styles.catalog}`} aria-labelledby={`${catalog.id}-title`}>
    <div className={styles.heading}>
      <div><span>Danh mục IAICT</span><h2 id={`${catalog.id}-title`}>{catalog.title}</h2></div>
      <p>{catalog.description}</p>
    </div>
    {liveCatalogUrl ? <div className={styles.notice}>
      <p>Xem danh mục được cập nhật trên hệ thống IAICT.</p><a href={liveCatalogUrl}>Mở danh mục {catalog.name} ↗</a>
    </div> : current.status === 'loading' ? <p className={styles.notice} role="status">Đang tải danh mục {catalog.name}…</p>
      : current.status === 'error' ? <div className={styles.notice} role="status">
        <p>Chưa tải được danh mục {catalog.name}.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Thử lại</button>
      </div> : current.items.length === 0 ? <p className={styles.notice}>
        Thông tin {catalog.name} đang được cập nhật. Vui lòng liên hệ IAICT để trao đổi nhu cầu.
      </p> : <div className={styles.grid}>{current.items.map((item, index) => <article key={item.id} className={styles.card}>
        <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <h3><Link href={`${catalog.path}/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h3>
        {item.summary ? <p>{item.summary}</p> : null}
        <Link className={styles.detail} aria-label={`Xem chi tiết: ${item.title}`} href={`${catalog.path}/${encodeURIComponent(item.slug)}`}>
          Xem chi tiết<span aria-hidden="true"> ↗</span>
        </Link>
      </article>)}</div>}
  </section>;
}
