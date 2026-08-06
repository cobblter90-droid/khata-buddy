import { createFileRoute } from "@tanstack/react-router";

import { UserCog } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account & Settings | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Business profile, language toggle, app lock, cashbook, backup and recovery settings for Assan Khata.",
      },
      { property: "og:title", content: "Account & Settings | Assan Khata" },
      {
        property: "og:description",
        content: "Manage your shop profile, backup and app lock in Assan Khata By U&R.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <div className="px-4 py-14 text-center">
      <Logo className="mx-auto h-24 w-24 rounded-3xl shadow-raised" />
      <h1 className="mt-5 text-xl font-bold">Assan Khata</h1>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        By U&amp;R Developers
      </p>
      <p className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground">
        Karobar ki maloomat, Cashbook, Wasooli aur Backup agle phase mein.
      </p>
    </div>
  );
}
