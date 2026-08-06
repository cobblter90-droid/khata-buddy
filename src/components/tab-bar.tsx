import { Link, useRouterState } from "@tanstack/react-router";
import { BookUser, Boxes, ReceiptText, UserCog } from "lucide-react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", key: "tabSales", icon: ReceiptText, exact: true },
  { to: "/khata", key: "tabKhata", icon: BookUser, exact: false },
  { to: "/items", key: "tabItems", icon: Boxes, exact: false },
  { to: "/account", key: "tabAccount", icon: UserCog, exact: false },
] as const;

export function TabBar() {
  const { t } = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pt-1 backdrop-blur shadow-bar">
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    active ? "bg-secondary" : "bg-transparent",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
