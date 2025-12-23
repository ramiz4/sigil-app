# macOS App Troubleshooting

If you encounter an error message like **"sigil.app is damaged and cannot be opened"** after downloading the desktop application, it is likely due to macOS Gatekeeper security checks for unsigned applications.

## How to fix it (Security Bypass)

Since you are the developer and know the app is safe, you can bypass this check on your machine:

1.  **Open Terminal**.
2.  Run the following command to remove the quarantine flag (adjust the path if the app is not in your Applications folder):
    ```bash
    xattr -cr /Applications/sigil.app
    ```
3.  Try opening the app again.

## Permanent Fix (For Distribution)

To prevent users from seeing this message, the Tauri build process must be updated with **Apple Code Signing and Notarization**. This requires:

1.  **Apple Developer Program Membership**: An active subscription ($99/year).
2.  **Certificates**: Generating a *Developer ID Application* certificate and an *App-specific Password* in your Apple Developer account.
3.  **GitHub Secrets**: Adding the following secrets to your repository:
    - `APPLE_CERTIFICATE`: The base64 encoded p12 certificate.
    - `APPLE_CERTIFICATE_PASSWORD`: The password for the p12 certificate.
    - `APPLE_SIGNING_IDENTITY`: The common name of the certificate.
    - `APPLE_ID`: Your Apple ID email.
    - `APPLE_PASSWORD`: The app-specific password created for notarization.
4.  **Configuration**: Updating `src-tauri/tauri.conf.json` and the `.github/workflows/deploy.yml` file to include these signing and notarization steps.

Refer to the [Tauri Apple Code Signing Documentation](https://v2.tauri.app/distribute/sign/macos/) for detailed setup instructions.
