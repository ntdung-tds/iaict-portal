export type MediaAsset = {
  id: string;
  filename: string;
  originalName: string;
  pathname: string;
  publicUrl: string;
  contentType: string;
  size: number;
  alt: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaSnapshotDto = {
  revision: number;
  updatedAt: string;
  storageReady: boolean;
  materialized: boolean;
  items: MediaAsset[];
};
