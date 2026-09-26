import { requirePage } from "@/server/auth/session";
import { can } from "@/server/auth/policy";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePage("/account", can.accessAccount);
  return <div className="container-page py-8">{children}</div>;
}
