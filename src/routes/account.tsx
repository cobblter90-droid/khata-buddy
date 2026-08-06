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
    <div className="px-4 py-16 text-center">
      <UserCog className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-bold">Account</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Settings, Cashbook, Wasooli aur Backup agle phase mein.
      </p>
    </div>
  );
}
