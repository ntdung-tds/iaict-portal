import type { Metadata } from "next";
import { MediaPrivateLibrary } from "@/components/admin/media-private-library";

export const metadata:Metadata={
  title:"Thư viện Media cách ly | IAICT CMS",
  robots:{index:false,follow:false},
};

export default function PrivateMediaLibraryPage(){
  return <MediaPrivateLibrary/>;
}
