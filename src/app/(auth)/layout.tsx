import "../globals.css";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });


export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <section className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        {children}
      </div>
    </section>
    </body>
  );
}
