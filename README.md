# Sigil Authenticator

**Sigil** is a modern, minimal, and secure open-source 2FA Authenticator application built with Angular and Tauri.

## Rationale

The name **Sigil** refers to an inscribed symbol believed to have magical power. In our context, it represents the cryptographic "seal" or token that grants access to your accounts.

## Features

- 🛡️ **Offline First**: No cloud sync, no tracking. Your secrets stay on your device.
- 📱 **Cross-Platform**: Runs in the browser and as a native desktop app (macOS, Windows, Linux).
- 📷 **QR Scanning**: Add accounts by scanning QR codes via webcam or importing images.
- ⚡ **Modern UI**: Dark mode support, clean aesthetics, and fluid animations.
- 📋 **Flexible**: Drag/Drop QR images, Paste `otpauth://` URLs, or Manual Entry.

## Development

### Prerequisites

- Node.js (v18+)
- pnpm
- Rust (for Tauri desktop build)
- Rust (for Tauri desktop build)

### Web Development

To run the web application in the browser:

```bash
pnpm install
pnpm install
# Start server with HTTPS (required for camera access on mobile)
pnpm dev
```

Open `https://localhost:4200` (Accept the security warning if prompted).

### Desktop Development (Tauri)

To run the native desktop application:

```bash
pnpm tauri dev
```

### Build

Web only:

```bash
pnpm build
```

Desktop app:

```bash
pnpm tauri build
```

## Architecture

- **Frontend**: Angular 21 (Standalone Components, Signals).
- **Storage**: IndexedDB (via `idb`) for persistent local storage on both Web and Desktop.
- **Crypto**: `otpauth` library for RFC 6238 TOTP generation.
- **Scanning**: `qr-scanner` for high-performance QR code decoding.

## Roadmap

- [x] Encrypted Backup/Restore (JSON)
- [x] PIN Lock on app startup
- [x] Folder organization for accounts
- [x] Add a Lock button to lock the app (pin)
- [x] Generate a new favicon and replace the default angular favicon
- [x] Click on the OTP Code should copy the code to clipboard
- [x] Add account -> Upload image via drag and drop
- [x] Add prettier and eslint with organize imports
- [x] Add capability to unlock with biometric
- [x] Add capability to move accounts via drag and drop
- [x] Add capability to delete accounts
- [x] Add capability to delete multiple accounts
- [x] Add full offline first PWA support
- [x] Search & Filter Accounts alphabetically and by folder
