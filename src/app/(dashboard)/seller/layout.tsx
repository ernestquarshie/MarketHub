import { Boxes, FileText, LayoutDashboard, MessageSquare, Package, ShoppingBag, Store } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requirePage } from "@/server/auth/session";
import { can } from "@/server/auth/policy";

const NAV = [
  { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/inventory", label: "Inventory", icon: Boxes },
  { href: "/seller/orders", label: "Orders", icon: ShoppingBag },
  { href: "/seller/rfqs", label: "RFQs", icon: FileText },
  { href: "/seller/messages", label: "Messages", icon: MessageSquare },
  { href: "/seller/store", label: "Storefront", icon: Store },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const actor = await requirePage("/seller", can.accessSellerCentre);
  return (
    <DashboardShell area="Seller Centre" userName={actor.name} nav={NAV}>
      {children}
    </DashboardShell>
  );
}
