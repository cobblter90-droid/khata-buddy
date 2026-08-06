# Khata Buddy

Build Assan Khata By U&R — an offline-first mobile bookkeeping app for shop owners (Capacitor-wrapped Android app, debug-signed, manually distributed — no Play Store). All data lives locally on the device by default; only license check and app-version check talk to a backend. This is a rebuild after a previous broken build had app-wide input/interaction failures, so build with standard, well-tested inputs and components — no experimental input handling that could interfere with native keyboard behavior in a packaged WebView.

1. Activation Screen (first screen, mandatory)

License Key input field (plain text input, properly bound to state via standard value/onChange) + "Activate karein" button.

Button enabled only when the field has non-empty text — verify carefully this isn't permanently stuck disabled.

On Activate, call POST https://urdevelopers.lovable.app/api/public/license/check with {license_key, device_id, device_type, device_name, os, product_key: "posp-khata"}.

active → store key in persistent storage (Capacitor Preferences), proceed into the app. locked → full-screen block, no dismiss, showing "Umar 0315-0496755 · Raheel 0321-1518621". not_found → clear stored key, show error, stay on Activation screen.

Re-check license on every app launch and every 5 minutes while the app is open.

2. Sales Tab

Dashboard: Total Sales (Kull Sales), Total Orders (Kull Orders), Total Cash (Kull Naqad), Total Credit (Kull Udhaar) — with a period filter: Hafta (week) / Maheena (month) / Apni marzi (custom date range).

"Haali Sales" — recent sales list, each entry showing a Naqad/Udhaar (Cash/Credit) badge.

Record a sale, via two entry modes in tabs:

Foree Amal (quick amount entry) — just type an amount and save, no item breakdown needed.

Mere Items (catalog-based) — pick items from the saved catalog, build a cart.

In the cart, adjust item quantity via a stepper (+/-) AND allow direct manual typing of the quantity.

Each sale has its own invoice view — tap a sale to open an itemized invoice, shareable as an image or PDF via WhatsApp/SMS.

A statistics chart comparing Naqad vs Udhaar over the selected period.

3. Item Catalog

Add new item: name, price, unit.

Full unit set to choose from: Piece, Kg, Packet, Litre, Dozen, Bori, Carton, and any other common retail units — don't hardcode a short list, support the realistic full set for a general retail shop, and warn (never silently default) if a unit type isn't recognized.

4. Khata Tab (Customer Ledger)

Total Balance summary at the top: "Maine lene hain" (amount owed to me) and "Maine dene hain" (amount I owe), calculated across all customers.

Customer list, each showing their current balance.

Add new customer — either import from device contacts (requesting Contacts permission properly at runtime via Capacitor's Contacts plugin, with a clear permission prompt, and verify the request flow actually completes and unlocks contact access) or add manually (name, phone).

Customer detail screen: full transaction history (Diye/Liye — given/received), with a balance banner at top.

Add a "Mainey Diye" / "Mainey Liye" entry: a calculator-style keypad for amount entry, a notes/tafseel field, date picker, and the ability to attach a bill photo.

"Tareekh Rakhein" — set a reminder date on a customer or transaction; show a count of overdue reminders somewhere visible (e.g. on the Khata tab or Dashboard).

Share a customer's balance via SMS/WhatsApp directly from their detail screen.

5. Account Tab

Business profile: business name, phone number, logo upload.

"Karobar ki maloomat" (business info) section.

App settings, including a language toggle (Urdu/English UI).

Wasooli — an overdue recovery list (customers with overdue reminders / outstanding balances, surfaced for follow-up).

Cashbook — a simple cash in/out log, separate from customer-specific khata entries.

App lock (PIN/pattern to open the app).

Backup (local export/import of data).

Privacy Policy screen.

Deleted items — a recycle bin for soft-deleted entries, allowing restore.

Account delete option (with clear confirmation, since this is destructive).

6. System-level requirements

Offline-first: every feature above must work fully offline; only license check and update check need network, and both must fail gracefully (silently, without blocking the user) if offline.

In-app update checker: hardcoded APP_VERSION constant. On launch, call GET https://urdevelopers.lovable.app/api/public/app-version?product_key=posp-khata, compare to APP_VERSION, and show a non-blocking "Update available" banner with a Download link if newer — fail silently if the check fails.

Mandatory footer on every bill/receipt/statement, no exceptions: PoSP By U&R developers — Umar 0315-0496755 — Raheel 0321-1518621.

7. Android build pipeline (GitHub Actions)

ubuntu-latest runner.

Node.js ≥22 (Capacitor CLI requirement).

JDK 21 (not 17 — required by the current Android Gradle Plugin).

Set up Android SDK.

Build the static SPA web output FIRST, then run npx cap sync android, and confirm the build output folder matches webDir in capacitor.config.ts exactly.

No release keystore/signing config — remove entirely, build assembleDebug only.

Upload the resulting APK as a workflow artifact.

Please confirm the actual GitHub owner/repo for this new project before wiring anything to it — don't guess it from the app name.

Build this in phases if needed (Activation + Sales first, then Khata, then Account/Settings, then the build pipeline) rather than trying to do everything in one shot, and let me know if any part of this needs clarification before you start.

I will only confirm any part of this as working after testing on a real installed APK on a physical device — not the Lovable preview.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2957a9c5-67f0-49f0-b285-beacd9a4ffc5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
