import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BILL_FOOTER, SUPPORT_LINE } from "@/lib/constants";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Assan Khata By U&R" },
      {
        name: "description",
        content:
          "Assan Khata keeps your shop's sales, khata and customer data on your own device. Only license and update checks use the internet.",
      },
      { property: "og:title", content: "Privacy Policy | Assan Khata" },
      { property: "og:description", content: "Your bookkeeping data never leaves your phone." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useT();
  return (
    <div className="px-4 pb-8">
      <header className="flex items-center gap-2 py-4">
        <Link to="/account" aria-label={t("back")} className="rounded-lg p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">{t("privacy")}</h1>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card px-4 py-5 text-sm leading-relaxed text-card-foreground shadow-card">
        <p>
          Assan Khata aapka saara karobari data — sales, bills, items, customer khata, cashbook aur
          bill ki photos — sirf aapke phone ke andar rakhta hai. Ye data kisi server par upload nahi
          hota.
        </p>
        <p>
          Internet sirf do kaamon ke liye istemal hota hai: (1) license key ki tasdeeq, aur (2) nai
          app update ka check. In dono mein aapka karobari data nahi bheja jata — sirf license key
          aur device ki pehchaan (device id, model, OS) bheji jati hai.
        </p>
        <p>
          Contacts ki ijazat sirf tab maangi jati hai jab aap khud &quot;{t("importContacts")}&quot;
          dabate hain, aur chuna gaya contact bhi sirf aapke phone mein save hota hai.
        </p>
        <p>
          Backup file aapke phone ki storage mein banti hai. Use aap jahan chahein rakhein — us par
          hamara koi control nahi.
        </p>
        <p>
          App uninstall karne ya &quot;{t("deleteAccount")}&quot; dabane par data hamesha ke liye
          khatam ho jata hai aur wapas nahi aa sakta.
        </p>
        <p className="font-semibold">Rabta: {SUPPORT_LINE}</p>
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">{BILL_FOOTER}</p>
    </div>
  );
}
