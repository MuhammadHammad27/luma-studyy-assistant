import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Luma — Personal Multimodal Study & Visual Assistant", description: "Upload or capture an image to read text, explain simply, study, translate, or find key details. Add your own question and listen to the reply." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
