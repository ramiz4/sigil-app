# Security Policy

## Threat Model

Sigil is an offline-first authenticator application. It is designed to minimize attack surface by not relying on external servers for its core functionality (generating 2FA codes).

### Data Storage

- **Web/Desktop**: Secrets and account data are stored securely in the browser's `IndexedDB`.
- **Encryption**: Currently, the MVP does NOT encipher the database at rest with a user password. The security relies on the underlying operating system and browser protections (sandboxing).
- **Network**: Sigil does NOT transmit any secrets over the network. It does not have analytics or cloud sync.

### User Responsibility

- You must protect your device with a strong password or biometric lock.
- If an attacker gains physical or remote access to your unlocked device/file system, they may be able to extract the stored secrets.

## Reporting a Vulnerability

If you discover a security vulnerability in this MVP, please open an issue in the repository.
