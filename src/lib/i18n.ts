/**
 * Tiny dictionary-based i18n. Default: Roman Urdu ("ur"). Toggle: English.
 * No external i18n library — keeps the WebView bundle small and predictable.
 */
import { createContext, useContext } from "react";

export type Lang = "ur" | "en";

type Entry = { ur: string; en: string };

export const DICT = {
  appName: { ur: "Assan Khata", en: "Assan Khata" },
  appTagline: { ur: "By U&R Developers", en: "By U&R Developers" },

  // Activation
  activationTitle: { ur: "App Activate Karein", en: "Activate App" },
  activationSub: {
    ur: "License key daalein jo aapko U&R developers se mili hai.",
    en: "Enter the license key provided by U&R developers.",
  },
  licenseKey: { ur: "License Key", en: "License Key" },
  activate: { ur: "Activate karein", en: "Activate" },
  activating: { ur: "Check ho raha hai…", en: "Checking…" },
  licenseNotFound: {
    ur: "Ye license key maujood nahi. Dobara check karein.",
    en: "This license key was not found. Please check it again.",
  },
  licenseNetworkError: {
    ur: "Internet nahi mila. Activation ke liye ek dafa internet zaroori hai.",
    en: "No internet. Activation needs internet once.",
  },
  lockedTitle: { ur: "App Band Kar Di Gayi Hai", en: "App Locked" },
  lockedBody: {
    ur: "Aapka license lock ho gaya hai. Rabta karein:",
    en: "Your license has been locked. Please contact:",
  },
  retry: { ur: "Dobara koshish karein", en: "Try again" },

  // Tabs
  tabSales: { ur: "Sales", en: "Sales" },
  tabKhata: { ur: "Khata", en: "Khata" },
  tabItems: { ur: "Items", en: "Items" },
  tabAccount: { ur: "Account", en: "Account" },

  // Sales dashboard
  totalSales: { ur: "Kull Sales", en: "Total Sales" },
  totalOrders: { ur: "Kull Orders", en: "Total Orders" },
  totalCash: { ur: "Kull Naqad", en: "Total Cash" },
  totalCredit: { ur: "Kull Udhaar", en: "Total Credit" },
  week: { ur: "Hafta", en: "Week" },
  month: { ur: "Maheena", en: "Month" },
  custom: { ur: "Apni marzi", en: "Custom" },
  from: { ur: "Se", en: "From" },
  to: { ur: "Tak", en: "To" },
  recentSales: { ur: "Haali Sales", en: "Recent Sales" },
  noSales: { ur: "Abhi koi sale nahi hui.", en: "No sales yet." },
  newSale: { ur: "Nai Sale", en: "New Sale" },
  cash: { ur: "Naqad", en: "Cash" },
  credit: { ur: "Udhaar", en: "Credit" },
  chartTitle: { ur: "Naqad vs Udhaar", en: "Cash vs Credit" },

  // Sale entry
  quickEntry: { ur: "Foree Amal", en: "Quick Entry" },
  myItems: { ur: "Mere Items", en: "My Items" },
  amount: { ur: "Raqam", en: "Amount" },
  save: { ur: "Save karein", en: "Save" },
  cancel: { ur: "Cancel", en: "Cancel" },
  note: { ur: "Tafseel", en: "Note" },
  date: { ur: "Tareekh", en: "Date" },
  paymentMode: { ur: "Adaigi", en: "Payment" },
  customer: { ur: "Customer", en: "Customer" },
  noCustomer: { ur: "Koi nahi", en: "None" },
  cart: { ur: "Cart", en: "Cart" },
  cartEmpty: { ur: "Cart khali hai. Items chunein.", en: "Cart is empty. Pick items." },
  total: { ur: "Total", en: "Total" },
  discount: { ur: "Discount", en: "Discount" },
  qty: { ur: "Tadaad", en: "Qty" },
  searchItems: { ur: "Item talash karein…", en: "Search items…" },
  amountRequired: { ur: "Raqam daalein.", en: "Enter an amount." },
  saleSaved: { ur: "Sale save ho gayi.", en: "Sale saved." },

  // Invoice
  invoice: { ur: "Bill", en: "Invoice" },
  invoiceNo: { ur: "Bill No.", en: "Bill No." },
  shareImage: { ur: "Image bhejein", en: "Share image" },
  sharePdf: { ur: "PDF bhejein", en: "Share PDF" },
  item: { ur: "Item", en: "Item" },
  rate: { ur: "Rate", en: "Rate" },
  grandTotal: { ur: "Kull Raqam", en: "Grand Total" },
  saleNotFound: { ur: "Ye bill nahi mila.", en: "Bill not found." },
  back: { ur: "Wapas", en: "Back" },

  // Items catalog
  itemsTitle: { ur: "Mere Items", en: "My Items" },
  addItem: { ur: "Naya Item", en: "New Item" },
  itemName: { ur: "Item ka naam", en: "Item name" },
  price: { ur: "Qeemat", en: "Price" },
  unit: { ur: "Unit", en: "Unit" },
  unitOther: { ur: "Doosra unit likhein", en: "Type another unit" },
  unitUnknownWarn: {
    ur: "Warning: ye unit hamari list mein nahi hai. Phir bhi save ho jayega.",
    en: "Warning: this unit is not in the known list. It will still be saved.",
  },
  noItems: { ur: "Abhi koi item nahi. Naya item banayein.", en: "No items yet. Add one." },
  itemSaved: { ur: "Item save ho gaya.", en: "Item saved." },
  nameRequired: { ur: "Naam daalein.", en: "Enter a name." },
  delete: { ur: "Delete", en: "Delete" },
  edit: { ur: "Tabdeeli", en: "Edit" },
  deleted: { ur: "Delete kar diya.", en: "Deleted." },

  // Update banner
  updateAvailable: { ur: "Nai update maujood hai", en: "Update available" },
  download: { ur: "Download", en: "Download" },

  offline: { ur: "Offline", en: "Offline" },
} satisfies Record<string, Entry>;

export type DictKey = keyof typeof DICT;

export const LangContext = createContext<Lang>("ur");

export function translate(key: DictKey, lang: Lang): string {
  const entry = DICT[key] as Entry | undefined;
  if (!entry) return key;
  return lang === "en" ? entry.en : entry.ur;
}

export function useT() {
  const lang = useContext(LangContext);
  return {
    lang,
    t: (key: DictKey) => translate(key, lang),
  };
}
