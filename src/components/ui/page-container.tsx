import React from "react";

export function PageContainer({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {title && (
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-neutral-900">{title}</h1>
          {subtitle && <p className="text-neutral-500 mt-2">{subtitle}</p>}
        </div>
      )}
      <div className="bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-neutral-200/50 rounded-[2rem] p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
