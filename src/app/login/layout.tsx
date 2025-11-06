import React from "react";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        {children}
      </div>
    </section>
  );
}
