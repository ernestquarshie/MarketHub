import {
  Building2,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requirePage } from "@/server/auth/session";
import { can } from "@/server/auth/policy";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/sellers", label: "Sellers", icon: Store },
  { href: "/admin/business-verifications", label: "Businesses", icon: Building2 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requirePage("/admin", can.accessAdmin);
  return (
    <DashboardShell area="Admin" userName={actor.name} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
