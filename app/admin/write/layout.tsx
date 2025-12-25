"use client";

export default function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="write-layout [&~footer]:hidden">
      <style jsx global>{`
        .header-wrapper {
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
