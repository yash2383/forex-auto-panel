import AdminShell from "./_components/AdminShell";
import { Suspense } from "react";

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#050a0f]" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
