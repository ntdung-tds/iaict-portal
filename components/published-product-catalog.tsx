"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './published-product-catalog.module.css';

type Product={id:string;title:string;slug:string;summary:string|null};
const previewCmsUrl=process.env.NEXT_PUBLIC_CMS_URL;
const liveCatalogUrl=process.env.NEXT_PUBLIC_STATIC_PREVIEW==='true'&&previewCmsUrl
  ? `${new URL(previewCmsUrl).origin}/san-pham-nen-tang#published-products` : null;

export function PublishedProductCatalog(){
  const [items,setItems]=useState<Product[]>([]);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(liveCatalogUrl)return;
    const controller=new AbortController();
    setState('loading');
    void fetch('/api/public/products',{cache:'no-store',signal:controller.signal})
      .then(async response=>{
        if(!response.ok)throw new Error('Catalog unavailable');
        const payload=await response.json() as {items?:Product[]};
        if(!Array.isArray(payload.items))throw new Error('Invalid catalog');
        if(controller.signal.aborted)return;
        setItems(payload.items);setState('ready');
      })
      .catch(()=>{if(!controller.signal.aborted)setState('error');});
    return()=>controller.abort();
  },[attempt]);
  return <section id="published-products" className={`shell ${styles.catalog}`} aria-labelledby="product-catalog-title">
    <div className={styles.heading}><div><span>Danh mục IAICT</span><h2 id="product-catalog-title">Sản phẩm & nền tảng đã công bố</h2></div><p>Tìm hiểu chức năng, công nghệ và khả năng tích hợp của từng sản phẩm.</p></div>
    {liveCatalogUrl?<div className={styles.notice}><p>Xem danh mục được cập nhật trên hệ thống IAICT.</p><a href={liveCatalogUrl}>Mở danh mục sản phẩm ↗</a></div>:state==='loading'?<p className={styles.notice} role="status">Đang tải danh mục sản phẩm…</p>:state==='error'?<div className={styles.notice} role="status"><p>Chưa tải được danh mục sản phẩm.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Thử lại</button></div>:items.length===0?<p className={styles.notice}>Thông tin sản phẩm đang được cập nhật. Vui lòng liên hệ IAICT để trao đổi nhu cầu.</p>:<div className={styles.grid}>{items.map((item,index)=><article key={item.id} className={styles.card}><span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,'0')}</span><h3><Link href={`/san-pham-nen-tang/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h3>{item.summary?<p>{item.summary}</p>:null}<Link className={styles.detail} aria-label={`Xem chi tiết: ${item.title}`} href={`/san-pham-nen-tang/${encodeURIComponent(item.slug)}`}>Xem chi tiết<span aria-hidden="true"> ↗</span></Link></article>)}</div>}
  </section>;
}
