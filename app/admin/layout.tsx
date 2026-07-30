"use client";

import { usePathname } from "next/navigation";
import StaffLayout from "../staff/layout";

// The admin login page must NOT render inside the sidebar layout.
// All other /admin/* pages inherit the full StaffLayout sidebar.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return <StaffLayout>{children}</StaffLayout>;
}
