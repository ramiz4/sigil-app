# macOS App Troubleshooting

If you see **"sigil.app is damaged and cannot be opened"** after downloading the desktop app, macOS Gatekeeper is blocking an unsigned application.

## 🚧 Quick Bypass (Developer Only)

1. Open **Terminal**.
2. Run the following command (adjust the path if the app is elsewhere):
   ```bash
   xattr -cr /Applications/sigil.app
   ```
3. Try launching the app again.

## 🔐 Permanent Fix for Distribution

To avoid this warning for end‑users, enable **Apple Code Signing & Notarization** in the Tauri build pipeline.

### Required Steps

- **Apple Developer Program** membership ($99/yr).
- Generate a **Developer ID Application** certificate and an app‑specific password.
- Add the following GitHub Secrets:
  - `APPLE_CERTIFICATE` – base64‑encoded `.p12` file.
  - `APPLE_CERTIFICATE_PASSWORD` – password for the certificate.
  - `APPLE_SIGNING_IDENTITY` – certificate common name.
  - `APPLE_ID` – your Apple ID email.
  - `APPLE_PASSWORD` – app‑specific password for notarization.
- Update `src-tauri/tauri.conf.json` and the CI workflow (`.github/workflows/deploy.yml`) to include signing and notarization steps.

Refer to the official Tauri guide: <https://v2.tauri.app/distribute/sign/macos/>.

---

_Feel free to open an issue if you encounter other macOS‑specific problems._
