import { createFileRoute } from "@tanstack/react-router";

import { BookUser } from "lucide-react";

export const Route = createFileRoute("/khata")({
  head: () => ({
    meta: [
      { title: "Khata — Customer Ledger | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Customer udhaar ledger: balances, Diye/Liye entries, reminders and WhatsApp balance sharing — all offline on your device.",
      },
      { property: "og:title", content: "Khata — Customer Ledger | Assan Khata" },
      {
        property: "og:description",
        content: "Track every customer's udhaar balance offline with Assan Khata By U&R.",
      },
    ],
  }),
  component: KhataPage,
});

function KhataPage() {
  return (
    <div className="px-4 py-16 text-center">
      <BookUser className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-bold">Khata</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Customer ledger agle phase mein aa raha hai.
      </p>
    </div>
  );
}
