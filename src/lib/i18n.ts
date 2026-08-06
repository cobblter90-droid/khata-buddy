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

  // Generic
  saved: { ur: "Save ho gaya.", en: "Saved." },
  search: { ur: "Talash karein…", en: "Search…" },
  none: { ur: "Koi nahi", en: "None" },
  confirm: { ur: "Haan, karein", en: "Yes, do it" },
  close: { ur: "Band karein", en: "Close" },
  settled: { ur: "Hisaab barabar", en: "Settled" },

  // Khata
  khataTitle: { ur: "Khata", en: "Khata" },
  toGet: { ur: "Maine lene hain", en: "I will get" },
  toGive: { ur: "Maine dene hain", en: "I will give" },
  addCustomer: { ur: "Naya Customer", en: "New Customer" },
  importContacts: { ur: "Contacts se lein", en: "Import from contacts" },
  customerName: { ur: "Customer ka naam", en: "Customer name" },
  phone: { ur: "Phone number", en: "Phone number" },
  noCustomers: {
    ur: "Abhi koi customer nahi. Naya customer banayein.",
    en: "No customers yet. Add one.",
  },
  balance: { ur: "Baqaya", en: "Balance" },
  overdueCount: { ur: "Tareekh guzar gayi", en: "Overdue" },
  transactions: { ur: "Lain Dain", en: "Transactions" },
  iGave: { ur: "Mainey Diye", en: "I Gave" },
  iReceived: { ur: "Mainey Liye", en: "I Received" },
  setReminder: { ur: "Tareekh Rakhein", en: "Set reminder" },
  attachPhoto: { ur: "Bill ki photo", en: "Bill photo" },
  shareBalance: { ur: "Baqaya bhejein", en: "Share balance" },
  noTransactions: { ur: "Koi lain dain nahi.", en: "No transactions." },
  customerNotFound: { ur: "Ye customer nahi mila.", en: "Customer not found." },
  contactsDenied: {
    ur: "Contacts ki ijazat nahi mili. Settings se ijazat dein.",
    en: "Contacts permission denied. Allow it from settings.",
  },
  contactsEmpty: { ur: "Contacts khali hain.", en: "No contacts found." },
  contactsUnavailable: {
    ur: "Contacts sirf mobile app mein kaam karte hain. Manually add karein.",
    en: "Contacts only work in the mobile app. Add manually instead.",
  },
  dueOn: { ur: "Tareekh", en: "Due" },

  // Account
  accountTitle: { ur: "Account", en: "Account" },
  businessInfo: { ur: "Karobar ki maloomat", en: "Business info" },
  businessName: { ur: "Karobar ka naam", en: "Business name" },
  businessPhone: { ur: "Phone", en: "Phone" },
  businessAddress: { ur: "Pata", en: "Address" },
  logoUpload: { ur: "Logo lagayein", en: "Upload logo" },
  settingsTitle: { ur: "App Settings", en: "App settings" },
  language: { ur: "Zubaan", en: "Language" },
  wasoola: { ur: "Wasoola", en: "Recovery list" },
  wasoolaSub: { ur: "Jin se paise lene hain", en: "Customers who owe you" },
  cashbook: { ur: "Cashbook", en: "Cashbook" },
  cashbookSub: { ur: "Naqad aana jaana", en: "Cash in / out" },
  appLock: { ur: "App Lock", en: "App lock" },
  appLockSub: { ur: "PIN se app kholein", en: "Open the app with a PIN" },
  pinTitle: { ur: "4 se 8 hindson ka PIN", en: "4 to 8 digit PIN" },
  pinEnter: { ur: "Apna PIN daalein", en: "Enter your PIN" },
  pinWrong: { ur: "PIN ghalat hai.", en: "Wrong PIN." },
  unlock: { ur: "Kholein", en: "Unlock" },
  backup: { ur: "Backup", en: "Backup" },
  exportBackup: { ur: "Backup file banayein", en: "Export backup" },
  importBackup: { ur: "Backup wapas lein", en: "Import backup" },
  backupDone: { ur: "Backup file ban gayi.", en: "Backup file created." },
  importDone: { ur: "Backup wapas aa gaya.", en: "Backup restored." },
  importFailed: { ur: "Ye file theek nahi lagti.", en: "That file looks invalid." },
  privacy: { ur: "Privacy Policy", en: "Privacy Policy" },
  deletedItems: { ur: "Delete kiya hua saman", en: "Deleted items" },
  restore: { ur: "Wapas layein", en: "Restore" },
  deleteForever: { ur: "Hamesha ke liye delete", en: "Delete forever" },
  emptyBin: { ur: "Recycle bin khali hai.", en: "Recycle bin is empty." },
  deleteAccount: { ur: "Account delete karein", en: "Delete account" },
  deleteAccountWarn: {
    ur: "Sab data — sales, khata, items, cashbook — hamesha ke liye khatam ho jayega. Ye wapas nahi aayega.",
    en: "All data — sales, khata, items, cashbook — will be permanently erased. This cannot be undone.",
  },
  accountDeleted: { ur: "Sab data delete ho gaya.", en: "All data deleted." },

  // Cashbook
  cashIn: { ur: "Naqad Aaya", en: "Cash In" },
  cashOut: { ur: "Naqad Gaya", en: "Cash Out" },
  netCash: { ur: "Baqi Naqad", en: "Net Cash" },
  noCashbook: { ur: "Koi entry nahi.", en: "No entries yet." },
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
