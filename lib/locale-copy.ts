import type { Locale } from "@/lib/i18n"

type SignUpCopy = {
  createAccount: string
  heroTitle: string
  heroSubtitle: string
  heroFootnote: string
  verifyOnce: string
  signUp: string
  verifyEmailContinue: string
  fullName: string
  yourName: string
  email: string
  emailPlaceholder: string
  verificationCode: string
  verificationPlaceholder: string
  verifyAndCreateAccount: string
  continue: string
  wrongEmail: string
  alreadyHaveAccount: string
  changeEmail: string
  signIn: string
  registrationFailed: string
  couldNotCreateAccount: string
}

type KhataCopy = {
  title: string
  youWillGet: string
  youWillGive: string
  totalParties: string
  entries: string
  recentTransactions: string
  noRecentEntries: string
  unknownCustomer: string
  gave: string
  got: string
  entry: string
  validAmount: string
  addEntryFailed: string
  creditAdded: string
  paymentAdded: string
  updateEntryFailed: string
  entryUpdated: string
  deleteEntryFailed: string
  entryDeleted: string
  deleteEntryConfirm: string
  sendWhatsAppReminder: string
  credit: string
  payment: string
  amount: string
  noteOptional: string
  addEntry: string
  searchNoteOrCreator: string
  all: string
  noMatchingEntries: string
  note: string
  save: string
  cancel: string
  creditYouGave: string
  paymentYouGot: string
  running: string
  receivable: string
  payable: string
  liveLedgerBalance: string
  toCollect: string
  toPay: string
}

type SharedCopy = {
  language: string
  chooseInterfaceLanguage: string
  selectLanguage: string
}

type LocaleCopy = {
  signUp: SignUpCopy
  khata: KhataCopy
  shared: SharedCopy
}

const copy: Record<Locale, LocaleCopy> = {
  en: {
    signUp: {
      createAccount: "Create Account",
      heroTitle: "Create your workspace.",
      heroSubtitle: "Verify once, land in your dashboard.",
      heroFootnote: "Accounts, teams, billing, set up in minutes.",
      verifyOnce: "Create Account",
      signUp: "Sign up",
      verifyEmailContinue: "Verify your email to continue",
      fullName: "Full Name",
      yourName: "Your name",
      email: "Email",
      emailPlaceholder: "you@shop.com",
      verificationCode: "Verification Code",
      verificationPlaceholder: "Enter 6-digit code",
      verifyAndCreateAccount: "Verify & Create Account",
      continue: "Continue",
      wrongEmail: "Wrong email?",
      alreadyHaveAccount: "Already have an account?",
      changeEmail: "Change Email",
      signIn: "Sign In",
      registrationFailed: "Registration failed",
      couldNotCreateAccount: "Could not create account.",
    },
    khata: {
      title: "Khata Dashboard",
      youWillGet: "You'll Get",
      youWillGive: "You'll Give",
      totalParties: "Total Parties",
      entries: "Entries",
      recentTransactions: "Recent Transactions",
      noRecentEntries: "No recent entries",
      unknownCustomer: "Unknown",
      gave: "GAVE",
      got: "GOT",
      entry: "Entry",
      validAmount: "Enter a valid amount",
      addEntryFailed: "Failed to add entry",
      creditAdded: "Credit added",
      paymentAdded: "Payment added",
      updateEntryFailed: "Failed to update entry",
      entryUpdated: "Entry updated",
      deleteEntryFailed: "Failed to delete entry",
      entryDeleted: "Entry deleted",
      deleteEntryConfirm: "Delete this ledger entry?",
      sendWhatsAppReminder: "Send WhatsApp Reminder",
      credit: "Credit",
      payment: "Payment",
      amount: "Amount",
      noteOptional: "Note (optional)",
      addEntry: "Add Entry",
      searchNoteOrCreator: "Search note or creator",
      all: "All",
      noMatchingEntries: "No matching entries",
      note: "Note",
      save: "Save",
      cancel: "Cancel",
      creditYouGave: "Credit (You gave)",
      paymentYouGot: "Payment (You got)",
      running: "Running",
      receivable: "receivable",
      payable: "payable",
      liveLedgerBalance: "Live ledger balance:",
      toCollect: "to collect",
      toPay: "to pay",
    },
    shared: {
      language: "Language",
      chooseInterfaceLanguage: "Choose your interface language",
      selectLanguage: "Select language",
    },
  },
  hi: {
    signUp: {
      createAccount: "अकाउंट बनाएं",
      heroTitle: "अपना वर्कस्पेस बनाइए।",
      heroSubtitle: "एक बार सत्यापन करें, फिर सीधे डैशबोर्ड में जाएं।",
      heroFootnote: "अकाउंट, टीम और बिलिंग कुछ ही मिनटों में सेट करें।",
      verifyOnce: "अकाउंट बनाएं",
      signUp: "साइन अप",
      verifyEmailContinue: "जारी रखने के लिए अपना ईमेल सत्यापित करें",
      fullName: "पूरा नाम",
      yourName: "आपका नाम",
      email: "ईमेल",
      emailPlaceholder: "you@shop.com",
      verificationCode: "वेरिफिकेशन कोड",
      verificationPlaceholder: "6 अंकों का कोड दर्ज करें",
      verifyAndCreateAccount: "सत्यापित करें और अकाउंट बनाएं",
      continue: "जारी रखें",
      wrongEmail: "गलत ईमेल?",
      alreadyHaveAccount: "क्या आपका पहले से अकाउंट है?",
      changeEmail: "ईमेल बदलें",
      signIn: "लॉग इन",
      registrationFailed: "रजिस्ट्रेशन असफल रहा",
      couldNotCreateAccount: "अकाउंट नहीं बन सका।",
    },
    khata: {
      title: "खाता डैशबोर्ड",
      youWillGet: "आपको मिलेगा",
      youWillGive: "आपको देना है",
      totalParties: "कुल पार्टियां",
      entries: "एंट्री",
      recentTransactions: "हाल की लेन-देन",
      noRecentEntries: "कोई हाल की एंट्री नहीं",
      unknownCustomer: "अज्ञात",
      gave: "दिया",
      got: "मिला",
      entry: "एंट्री",
      validAmount: "सही राशि दर्ज करें",
      addEntryFailed: "एंट्री जोड़ना असफल रहा",
      creditAdded: "उधार जोड़ा गया",
      paymentAdded: "भुगतान जोड़ा गया",
      updateEntryFailed: "एंट्री अपडेट करना असफल रहा",
      entryUpdated: "एंट्री अपडेट हो गई",
      deleteEntryFailed: "एंट्री हटाना असफल रहा",
      entryDeleted: "एंट्री हटा दी गई",
      deleteEntryConfirm: "क्या यह खाता एंट्री हटानी है?",
      sendWhatsAppReminder: "व्हाट्सऐप रिमाइंडर भेजें",
      credit: "उधार",
      payment: "भुगतान",
      amount: "राशि",
      noteOptional: "नोट (वैकल्पिक)",
      addEntry: "एंट्री जोड़ें",
      searchNoteOrCreator: "नोट या बनाने वाले को खोजें",
      all: "सभी",
      noMatchingEntries: "कोई मिलती हुई एंट्री नहीं",
      note: "नोट",
      save: "सेव करें",
      cancel: "रद्द करें",
      creditYouGave: "उधार (आपने दिया)",
      paymentYouGot: "भुगतान (आपको मिला)",
      running: "चलता बैलेंस",
      receivable: "लेना है",
      payable: "देना है",
      liveLedgerBalance: "लाइव लेजर बैलेंस:",
      toCollect: "वसूलना है",
      toPay: "चुकाना है",
    },
    shared: {
      language: "भाषा",
      chooseInterfaceLanguage: "अपनी इंटरफेस भाषा चुनें",
      selectLanguage: "भाषा चुनें",
    },
  },
  as: {
    signUp: {
      createAccount: "একাউণ্ট খোলক",
      heroTitle: "আপোনাৰ কর্মক্ষেত্ৰ সাজু কৰক।",
      heroSubtitle: "এবাৰ যাচাই কৰক, তাৰ পাছত ডেশ্বব'ৰ্ডত পোৱাঁহক।",
      heroFootnote: "একাউণ্ট, দল আৰু বিলিং কিছুমান মিনিটতে সাজু কৰক।",
      verifyOnce: "একাউণ্ট খোলক",
      signUp: "ছাইন আপ",
      verifyEmailContinue: "আগবাঢ়িবলৈ আপোনাৰ ইমেইল যাচাই কৰক",
      fullName: "সম্পূৰ্ণ নাম",
      yourName: "আপোনাৰ নাম",
      email: "ইমেইল",
      emailPlaceholder: "you@shop.com",
      verificationCode: "যাচাইকৰণ ক'ড",
      verificationPlaceholder: "৬ সংখ্যাৰ ক'ড লিখক",
      verifyAndCreateAccount: "যাচাই কৰি একাউণ্ট খোলক",
      continue: "আগবাঢ়ক",
      wrongEmail: "ভুল ইমেইল?",
      alreadyHaveAccount: "আপোনাৰ আগতেই একাউণ্ট আছে নেকি?",
      changeEmail: "ইমেইল সলনি কৰক",
      signIn: "লগ ইন",
      registrationFailed: "ৰেজিষ্ট্ৰেচন ব্যর্থ হ'ল",
      couldNotCreateAccount: "একাউণ্ট খোলা নগ'ল।",
    },
    khata: {
      title: "খাতা ডেশ্বব'ৰ্ড",
      youWillGet: "আপুনি পাম",
      youWillGive: "আপুনি দিব লাগিব",
      totalParties: "মুঠ পাৰ্টি",
      entries: "এণ্ট্ৰী",
      recentTransactions: "শেহতীয়া লেনদেন",
      noRecentEntries: "শেহতীয়া এণ্ট্ৰী নাই",
      unknownCustomer: "অজ্ঞাত",
      gave: "দিলোঁ",
      got: "পালোঁ",
      entry: "এণ্ট্ৰী",
      validAmount: "শুদ্ধ পৰিমাণ লিখক",
      addEntryFailed: "এণ্ট্ৰী যোগ কৰিব পৰা নগ'ল",
      creditAdded: "উধাৰ যোগ হ'ল",
      paymentAdded: "পেমেণ্ট যোগ হ'ল",
      updateEntryFailed: "এণ্ট্ৰী আপডেট কৰিব পৰা নগ'ল",
      entryUpdated: "এণ্ট্ৰী আপডেট হ'ল",
      deleteEntryFailed: "এণ্ট্ৰী মচিব পৰা নগ'ল",
      entryDeleted: "এণ্ট্ৰী মচি দিয়া হ'ল",
      deleteEntryConfirm: "এই খাতা এণ্ট্ৰী মচিব নেকি?",
      sendWhatsAppReminder: "হোৱাটছএপ ৰিমাইণ্ডাৰ পঠিয়াওক",
      credit: "উধাৰ",
      payment: "পেমেণ্ট",
      amount: "পৰিমাণ",
      noteOptional: "টোকা (ঐচ্ছিক)",
      addEntry: "এণ্ট্ৰী যোগ কৰক",
      searchNoteOrCreator: "টোকা বা সৃষ্টিকর্তা বিচাৰক",
      all: "সকলো",
      noMatchingEntries: "মিল থকা এণ্ট্ৰী নাই",
      note: "টোকা",
      save: "সংৰক্ষণ কৰক",
      cancel: "বাতিল কৰক",
      creditYouGave: "উধাৰ (আপুনি দিলে)",
      paymentYouGot: "পেমেণ্ট (আপুনি পালে)",
      running: "চলতি বেলেঞ্চ",
      receivable: "ল'ব লাগিব",
      payable: "দিব লাগিব",
      liveLedgerBalance: "লাইভ লেজাৰ বেলেঞ্চ:",
      toCollect: "উসুল কৰিব লাগিব",
      toPay: "দিব লাগিব",
    },
    shared: {
      language: "ভাষা",
      chooseInterfaceLanguage: "ইণ্টাৰফেচৰ ভাষা বাছক",
      selectLanguage: "ভাষা বাছক",
    },
  },
  bn: {
    signUp: {
      createAccount: "অ্যাকাউন্ট তৈরি করুন",
      heroTitle: "আপনার ওয়ার্কস্পেস তৈরি করুন।",
      heroSubtitle: "একবার যাচাই করুন, তারপর সরাসরি ড্যাশবোর্ডে যান।",
      heroFootnote: "অ্যাকাউন্ট, টিম আর বিলিং কয়েক মিনিটেই সেট করুন।",
      verifyOnce: "অ্যাকাউন্ট তৈরি করুন",
      signUp: "সাইন আপ",
      verifyEmailContinue: "চালিয়ে যেতে আপনার ইমেল যাচাই করুন",
      fullName: "পূর্ণ নাম",
      yourName: "আপনার নাম",
      email: "ইমেল",
      emailPlaceholder: "you@shop.com",
      verificationCode: "ভেরিফিকেশন কোড",
      verificationPlaceholder: "৬ অঙ্কের কোড লিখুন",
      verifyAndCreateAccount: "যাচাই করে অ্যাকাউন্ট তৈরি করুন",
      continue: "চালিয়ে যান",
      wrongEmail: "ভুল ইমেল?",
      alreadyHaveAccount: "আগেই কি আপনার অ্যাকাউন্ট আছে?",
      changeEmail: "ইমেল বদলান",
      signIn: "সাইন ইন",
      registrationFailed: "রেজিস্ট্রেশন ব্যর্থ হয়েছে",
      couldNotCreateAccount: "অ্যাকাউন্ট তৈরি করা যায়নি।",
    },
    khata: {
      title: "খাতা ড্যাশবোর্ড",
      youWillGet: "আপনি পাবেন",
      youWillGive: "আপনাকে দিতে হবে",
      totalParties: "মোট পার্টি",
      entries: "এন্ট্রি",
      recentTransactions: "সাম্প্রতিক লেনদেন",
      noRecentEntries: "কোনও সাম্প্রতিক এন্ট্রি নেই",
      unknownCustomer: "অজানা",
      gave: "দিয়েছেন",
      got: "পেয়েছেন",
      entry: "এন্ট্রি",
      validAmount: "সঠিক পরিমাণ লিখুন",
      addEntryFailed: "এন্ট্রি যোগ করা যায়নি",
      creditAdded: "বাকি যোগ হয়েছে",
      paymentAdded: "পেমেন্ট যোগ হয়েছে",
      updateEntryFailed: "এন্ট্রি আপডেট করা যায়নি",
      entryUpdated: "এন্ট্রি আপডেট হয়েছে",
      deleteEntryFailed: "এন্ট্রি মুছা যায়নি",
      entryDeleted: "এন্ট্রি মুছে দেওয়া হয়েছে",
      deleteEntryConfirm: "এই খাতা এন্ট্রি মুছবেন?",
      sendWhatsAppReminder: "হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান",
      credit: "বাকি",
      payment: "পেমেন্ট",
      amount: "পরিমাণ",
      noteOptional: "নোট (ঐচ্ছিক)",
      addEntry: "এন্ট্রি যোগ করুন",
      searchNoteOrCreator: "নোট বা তৈরিকারী খুঁজুন",
      all: "সব",
      noMatchingEntries: "মেলা এন্ট্রি নেই",
      note: "নোট",
      save: "সেভ করুন",
      cancel: "বাতিল করুন",
      creditYouGave: "বাকি (আপনি দিয়েছেন)",
      paymentYouGot: "পেমেন্ট (আপনি পেয়েছেন)",
      running: "চলতি ব্যালান্স",
      receivable: "পাওনা",
      payable: "দেনা",
      liveLedgerBalance: "লাইভ লেজার ব্যালান্স:",
      toCollect: "আদায় করতে হবে",
      toPay: "পরিশোধ করতে হবে",
    },
    shared: {
      language: "ভাষা",
      chooseInterfaceLanguage: "আপনার ইন্টারফেস ভাষা বেছে নিন",
      selectLanguage: "ভাষা নির্বাচন করুন",
    },
  },
}

export function getLocaleCopy(locale: Locale): LocaleCopy {
  return copy[locale] || copy.en
}
