# Sigil Authenticator

![Sigil Logo](https://raw.githubusercontent.com/ramiz4/sigil-app/main/assets/logo.png)

**Sigil** is a modern, minimal, and secure open‑source 2FA Authenticator built with **Angular 21** and **Tauri**. It works offline first, stores secrets locally, and offers a sleek, dark‑mode‑ready UI.

---

## 📚 Table of Contents

- [Features](#-features)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [Architecture](#-architecture)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- **Offline‑First** – No cloud sync, no tracking. Your secrets stay on your device.
- **Cross‑Platform** – Runs in the browser and as a native desktop app (macOS, Windows, Linux).
- **QR Scanning** – Add accounts by scanning QR codes via webcam or importing images.
- **Modern UI** – Dark mode, smooth animations, and a clean aesthetic.
- **Flexible Input** – Drag‑and‑drop QR images, paste `otpauth://` URLs, or manual entry.
- **Backup & Restore** – Encrypted JSON, CSV, PDF exports and imports.
- **Biometric Unlock** – Use Touch ID / Windows Hello for quick access.
- **Multi‑Account Management** – Drag‑and‑drop reordering, bulk deletion, folder organization.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **pnpm** (recommended package manager)
- **Rust** (for Tauri desktop builds)

### Web Development

```bash
pnpm install
# HTTPS is required for camera access on mobile
pnpm dev
```

Open `https://localhost:4200` (accept the security warning if prompted).

### Desktop Development (Tauri)

```bash
pnpm tauri dev
```

### Build

- **Web only**

```bash
pnpm build
```

- **Desktop app**

```bash
pnpm tauri build
```

---

## 🏗️ Architecture

- **Frontend** – Angular 21 (standalone components, signals).
- **Storage** – IndexedDB via `idb` for persistent local storage.
- **Crypto** – `otpauth` library for RFC 6238 TOTP generation.
- **Scanning** – `qr-scanner` for high‑performance QR code decoding.

---

## 📈 Roadmap

- ✅ Encrypted Backup/Restore (JSON)
- ✅ PIN lock on app startup
- ✅ Folder organization for accounts
- ✅ Add lock button
- ✅ New favicon
- ✅ Click‑to‑copy OTP codes
- ✅ Drag‑and‑drop image upload for accounts
- ✅ Prettier & ESLint with organize imports
- ✅ Biometric unlock capability
- ✅ Drag‑and‑drop reordering of accounts
- ✅ Single & bulk account deletion
- ✅ Full offline‑first PWA support
- ✅ Search & filter accounts
- ✅ Import/Export formats (Google, CSV, JSON, PDF)

---

## 🤝 Contributing

Feel free to open issues or submit pull requests. Follow the **Conventional Commits** style and run `pnpm lint && pnpm format` before pushing.

---

## 📄 License

MIT © 2025 Ramiz L.
