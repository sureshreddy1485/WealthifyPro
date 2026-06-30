# WealthifyPro

WealthifyPro is a comprehensive personal finance and utility application designed to help users track their money, calculate complex interest, and manage personal notes—all seamlessly synchronized across multiple devices in the cloud.

---

## 🌟 How the App Works

WealthifyPro is built around three core financial modules: **Notes**, **Ledger**, and **EMI**. It is designed to work completely offline, allowing you to manage your data instantly, while securely syncing to the cloud in the background so you never lose your data.

### 1. 📝 Notes Module
The Notes tab is your digital scratchpad for financial thoughts, quick math, and temporary calculations.
* **Smart Calculations:** Write down simple math and immediately see the computed value.
* **Receipt Capture:** You can easily capture and save visual receipts of your notes.
* **Settle & Save:** Once a note is finalized, you can mark it as "Settled" and automatically convert it into a permanent Ledger entry.
* **Folders:** Organize your notes into custom folders (e.g., "Business Ideas", "Daily Expenses").

### 2. 📖 Ledger Module
The Ledger is the heart of WealthifyPro's lending and borrowing tracker.
* **Interest Calculation:** Track money given or taken over time. The app uses standard financial math (e.g., ₹ per ₹100 per month) to calculate total interest accurately.
* **Compound vs Simple:** Switch between simple and compound interest depending on your agreement.
* **Settlement Tracking:** Easily close out ledgers when debts are paid.
* **Receipt Generation:** Share detailed, professional breakdown receipts directly to WhatsApp or save them to your gallery.

### 3. 📊 EMI Calculator
A robust tool to plan loans, mortgages, and vehicle financing.
* **Instant Amortization:** Enter your Principal, Interest Rate, and Tenure to instantly generate your monthly EMI.
* **Total Breakdown:** View exactly how much you are paying in pure interest versus principal over the lifetime of the loan.
* **Save & Compare:** Save different EMI scenarios into folders to compare loan options before committing to a bank.

---

## ☁️ Cloud Sync & Multi-Device Support

WealthifyPro features a robust offline-first architecture powered by the cloud.

* **Offline First:** The app loads your data instantly from your device. You don't need to wait for a loading screen or an internet connection to see your finances.
* **Background Sync:** Whenever you open the app or make a change, the app quietly talks to our cloud servers to securely back up your data.
* **Multi-Device Login:** You can log into your account on a new phone, and all your Notes, Ledgers, and Folders will instantly pull down from the cloud.
* **Device Management:** In the Settings tab, you can view all devices currently logged into your account. If you lose a phone, you can remotely revoke its access using your Security Key.

---

## 🔒 Security & Privacy

We treat your financial data with the utmost security.
* **Security Key:** When creating an account, you set a strict Security Key. This key is required to log into new devices or perform destructive actions.
* **App Lock:** Enable biometric (Fingerprint/FaceID) or PIN lock from the Settings menu to prevent unauthorized physical access to your app.
* **Encrypted Sessions:** All logins use secure JSON Web Tokens (JWT) that expire automatically if revoked.

---

## 🚀 Over-The-Air (OTA) Updates

WealthifyPro uses Expo OTA Updates to deliver new features and bug fixes instantly. 
* You do not need to wait for Google Play Store approvals.
* Simply go to **Settings > Check for Updates**. If a new version is available, the app will download it in the background and apply it upon restarting.

---

## 🎨 Themes & Customization

Personalize your financial workspace. WealthifyPro comes with over 20+ carefully curated themes.
* Switch between **Dark Mode** and **Light Mode**.
* Choose accent colors that fit your vibe (e.g., Emerald Green, Midnight Blue, Sunset Orange).
* The UI instantly repaints across the entire app without requiring a restart.
