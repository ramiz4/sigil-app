# Sigil Authenticator - Feature Roadmap

This document outlines potential new features and enhancements for the Sigil Authenticator application. Features are organized by priority and category.

---

## 🚀 High Priority Features

### 1. Search & Filter Accounts 🔍 [✅ Implemented]

**Description**: Add search and filtering capabilities to quickly find accounts.

**User Story**: As a user with many accounts, I want to quickly search for a specific account by name or issuer, so I don't have to scroll through my entire list.

**Implementation Details**:

- Add a search bar at the top of the dashboard
- Real-time filtering as user types
- Search by account name, issuer, or folder
- Filter dropdown to show accounts by folder
- Highlight matching text in results
- Keyboard navigation support (arrow keys, enter to select)

**Technical Considerations**:

- Use Angular signals for reactive search
- Debounce search input to optimize performance
- Case-insensitive search
- Support for partial matches

**Estimated Effort**: Medium (2-3 days)

---

### 2. Account Import/Export Formats 📦 [✅ Implemented]

**Description**: Support importing from other authenticator apps and exporting in various formats.

**User Story**: As a user switching from Google Authenticator, I want to import my existing accounts without manually re-adding them.

**Implementation Details**:

- **Import Support**:
  - Google Authenticator (otpauth-migration:// protocol)
  - Authy (encrypted backup format)
  - Microsoft Authenticator (JSON format)
  - Generic CSV format
  - Batch QR code import
- **Export Support**:
  - Individual account QR codes
  - PDF with all account QR codes for printing
  - CSV format for compatibility
  - Encrypted JSON (current format)
  - Plain text (with warning)

**Technical Considerations**:

- Parse various URI schemes and formats
- Validate imported data thoroughly
- Handle duplicate accounts gracefully
- Use jsPDF or similar for PDF generation
- Maintain encryption for sensitive exports

**Estimated Effort**: High (5-7 days)

---

### 3. Account Editing ✏️

**Description**: Allow users to edit account details after creation.

**User Story**: As a user, I want to update my account's name or icon after adding it, so I can keep my accounts organized and recognizable.

**Implementation Details**:

- Edit account name/label
- Edit issuer name
- Change account icon/image
- Update TOTP settings (period, digits, algorithm) for advanced users
- Add notes/description field
- Validation to prevent duplicate names
- Confirmation dialog for critical changes

**Technical Considerations**:

- Create an edit modal/dialog component
- Update StorageService with updateAccount method
- Maintain account order after editing
- Add unit tests for edit functionality
- Preserve account history/metadata

**Estimated Effort**: Medium (3-4 days)

---

### 4. Favorites/Pinning ⭐

**Description**: Pin frequently used accounts to the top of the list.

**User Story**: As a user, I want to pin my most-used accounts to the top, so I can access them quickly without searching.

**Implementation Details**:

- Add "favorite" or "pin" toggle on account cards
- Pinned accounts appear at the top of the list
- Visual indicator (star icon, different background)
- Maintain separate order for pinned vs unpinned accounts
- Drag-and-drop reordering within pinned section
- Persist favorite status in IndexedDB

**Technical Considerations**:

- Add `isPinned` boolean field to Account interface
- Update sorting logic in TotpService
- Add toggle button to account card UI
- Update drag-and-drop to respect pinned sections
- Add tests for pinning/unpinning

**Estimated Effort**: Low-Medium (2-3 days)

---

### 5. Auto-Backup 💾

**Description**: Automatically create encrypted backups on a schedule.

**User Story**: As a user, I want automatic backups of my accounts, so I don't lose my data if something goes wrong.

**Implementation Details**:

- Configurable backup schedule (daily, weekly, monthly)
- Auto-save to local file system or Downloads folder
- Backup rotation (keep last N backups)
- Backup reminder notifications
- Manual backup trigger
- Backup verification (test restore)
- Show last backup date/time in settings

**Technical Considerations**:

- Use Web Workers or Service Workers for background tasks
- File System Access API for web version
- Tauri file system API for desktop
- Store backup settings in IndexedDB
- Add notification permission request
- Implement backup cleanup to prevent storage bloat

**Estimated Effort**: Medium-High (4-5 days)

---

## 📊 Medium Priority Features

### 6. Account Statistics & History 📊

**Description**: Track and display usage statistics for accounts.

**User Story**: As a user, I want to see which accounts I use most frequently, so I can organize them better.

**Implementation Details**:

- Track copy events per account
- Store last used timestamp
- Usage frequency counter
- Statistics dashboard showing:
  - Most used accounts
  - Least used accounts
  - Usage trends over time
  - Total codes generated
- Export statistics as CSV/JSON

**Technical Considerations**:

- Add `usageCount` and `lastUsed` fields to Account
- Update on each code copy
- Create statistics component
- Use charts library (Chart.js, D3.js) for visualizations
- Privacy consideration: make tracking opt-in

**Estimated Effort**: Medium (3-4 days)

---

### 7. Customizable Themes 🎨

**Description**: Provide multiple theme options and customization.

**User Story**: As a user, I want to customize the app's appearance to match my preferences and accessibility needs.

**Implementation Details**:

- Pre-built themes:
  - Light (current)
  - Dark (current)
  - High contrast
  - Solarized
  - Nord
  - Dracula
  - Custom
- Theme customization options:
  - Primary color picker
  - Accent color picker
  - Background color
  - Font size adjustment
  - Border radius (rounded vs sharp)
- Theme preview before applying
- Import/export custom themes

**Technical Considerations**:

- Use CSS custom properties (variables)
- Store theme preferences in IndexedDB
- Create theme service for centralized management
- Ensure WCAG AA compliance for all themes
- Add smooth transitions between theme changes

**Estimated Effort**: Medium-High (4-5 days)

---

### 8. Browser Extension 🌐

**Description**: Create a browser extension for quick access to TOTP codes.

**User Story**: As a user, I want a browser extension that auto-fills TOTP codes on websites, so I don't have to switch between apps.

**Implementation Details**:

- Chrome/Firefox/Edge extension
- Popup UI showing all accounts
- Quick search and copy
- Auto-detect 2FA input fields on pages
- Auto-fill TOTP codes (with user confirmation)
- Sync with desktop/web app via:
  - Local storage (same browser)
  - WebSocket connection (local network)
  - Encrypted cloud sync (optional)
- Keyboard shortcuts

**Technical Considerations**:

- Manifest V3 for Chrome
- WebExtensions API for cross-browser support
- Content scripts for page interaction
- Background service worker
- Secure communication between extension and app
- Separate repository or monorepo structure

**Estimated Effort**: Very High (10-15 days)

---

### 9. Import via Camera (Mobile) 📸

**Description**: Enhanced camera features for mobile devices.

**User Story**: As a mobile user, I want to quickly scan multiple QR codes in succession when setting up my accounts.

**Implementation Details**:

- Continuous scanning mode (scan multiple QR codes)
- Batch import workflow
- OCR for manual key entry from images
- Gallery import (select multiple images)
- Scan from printed backup sheets
- Success/failure feedback for each scan
- Review imported accounts before saving

**Technical Considerations**:

- Use existing qr-scanner library
- Add Tesseract.js for OCR
- Handle camera permissions gracefully
- Optimize for mobile performance
- Add loading states and progress indicators

**Estimated Effort**: Medium-High (4-6 days)

---

### 10. Account Templates 📋

**Description**: Pre-configured templates for popular services.

**User Story**: As a user, I want my accounts to automatically show the correct logo and colors for popular services.

**Implementation Details**:

- Built-in icon library for popular services:
  - Google, GitHub, Microsoft, AWS, Facebook
  - Twitter/X, LinkedIn, Dropbox, Discord
  - Steam, Epic Games, Battle.net
  - Banking and financial services
  - 100+ popular services
- Auto-detect service from QR code/URI
- Apply service branding (icon, colors)
- Custom icon upload for unknown services
- Community-contributed icon packs
- Fallback to generic icons

**Technical Considerations**:

- Create icons JSON database
- Use SVG icons for scalability
- Implement icon matching algorithm (domain, issuer name)
- Lazy load icons to optimize bundle size
- Allow user override of auto-detected icons

**Estimated Effort**: Medium (3-4 days for initial set, ongoing for additions)

---

## 🔧 Advanced Features

### 11. HOTP Support 🔢

**Description**: Support counter-based OTP (HOTP - RFC 4226).

**User Story**: As a user with hardware tokens or enterprise systems, I want to use HOTP codes in addition to TOTP.

**Implementation Details**:

- Detect HOTP from otpauth:// URI
- Counter-based code generation
- Manual counter increment button
- Auto-increment on code copy (optional)
- Counter synchronization
- Support for different counter values
- Visual distinction from TOTP accounts

**Technical Considerations**:

- Extend otpauth library or implement RFC 4226
- Add `type` field to Account (TOTP/HOTP)
- Add `counter` field for HOTP accounts
- Update UI to show counter and increment button
- Handle counter persistence in IndexedDB

**Estimated Effort**: Medium (3-4 days)

---

### 12. Steam Guard Support 🎮

**Description**: Native support for Steam's custom TOTP implementation.

**User Story**: As a gamer, I want to use Sigil for my Steam account instead of the Steam Mobile app.

**Implementation Details**:

- Steam Guard code generation algorithm
- 5-character alphanumeric codes
- Auto-detect Steam accounts
- Steam-specific branding
- Support for Steam's time offset

**Technical Considerations**:

- Implement Steam's custom base32 alphabet
- Research Steam's TOTP variant
- Add Steam account type detection
- Test with actual Steam accounts
- Handle Steam's specific requirements

**Estimated Effort**: Medium (3-4 days, includes research)

---

### 13. Multi-Device Sync (Optional) ☁️

**Description**: End-to-end encrypted sync across devices while maintaining offline-first philosophy.

**User Story**: As a user with multiple devices, I want my accounts synced across all my devices securely.

**Implementation Details**:

- **Sync Methods**:
  - Local network sync (no internet required)
  - User's own cloud storage (Dropbox, Google Drive, iCloud)
  - Self-hosted sync server (optional)
- **Features**:
  - End-to-end encryption (zero-knowledge)
  - QR code-based device pairing
  - Conflict resolution
  - Selective sync (choose which accounts)
  - Sync status indicator
  - Manual sync trigger
- **Privacy**:
  - Completely optional
  - No Sigil-hosted servers
  - User controls encryption keys
  - Offline mode always available

**Technical Considerations**:

- Implement E2E encryption (AES-256)
- Use WebRTC for local network discovery
- Cloud provider SDKs for storage
- Conflict resolution algorithm (last-write-wins or manual)
- Sync protocol design
- Background sync with Service Workers

**Estimated Effort**: Very High (15-20 days)

---

### 14. Password Manager Integration 🔐

**Description**: Integration with popular password managers.

**User Story**: As a user who uses a password manager, I want to store my TOTP secrets alongside my passwords.

**Implementation Details**:

- Export formats compatible with:
  - Bitwarden
  - 1Password
  - KeePass/KeePassXC
  - LastPass
  - Dashlane
- Import from password managers
- One-click export to password manager format
- Documentation for manual import

**Technical Considerations**:

- Research each password manager's format
- Create format converters
- Handle field mapping
- Validate exported data
- Provide clear instructions

**Estimated Effort**: Medium-High (5-6 days)

---

### 15. Accessibility Improvements ♿

**Description**: Enhanced accessibility features for users with disabilities.

**User Story**: As a user with visual impairment, I want to use Sigil with a screen reader and keyboard navigation.

**Implementation Details**:

- **Screen Reader Optimization**:
  - ARIA labels on all interactive elements
  - Semantic HTML
  - Announce code changes
  - Descriptive alt text
- **Keyboard Navigation**:
  - Full keyboard support (no mouse required)
  - Custom keyboard shortcuts
  - Focus indicators
  - Skip navigation links
- **Visual Accessibility**:
  - High contrast mode
  - Large text mode (up to 200%)
  - Reduced motion option
  - Color blind friendly palettes
- **Voice Commands** (experimental):
  - Voice-activated code reading
  - Voice navigation

**Technical Considerations**:

- WCAG 2.1 Level AA compliance
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard trap prevention
- Focus management
- Use Web Speech API for voice features

**Estimated Effort**: High (6-8 days)

---

## 🔒 Security Enhancements

### 16. Encrypted Cloud Backup 🔒

**Description**: Optional encrypted backup to user's cloud storage.

**User Story**: As a user, I want to securely backup my accounts to the cloud without compromising security.

**Implementation Details**:

- Support for cloud providers:
  - Google Drive
  - Dropbox
  - iCloud Drive
  - OneDrive
  - Custom WebDAV
- Zero-knowledge encryption
- User-controlled encryption key
- Automatic scheduled backups
- Manual backup trigger
- Restore from cloud backup
- Backup versioning

**Technical Considerations**:

- OAuth integration for cloud providers
- Client-side encryption before upload
- Key derivation from user password
- Backup metadata (timestamp, device)
- Incremental backups to save bandwidth
- Backup integrity verification

**Estimated Effort**: High (7-9 days)

---

### 17. Auto-Lock Settings ⏱️

**Description**: Configurable auto-lock behavior for enhanced security.

**User Story**: As a security-conscious user, I want the app to automatically lock after a period of inactivity.

**Implementation Details**:

- Configurable timeout (1, 5, 15, 30 minutes, never)
- Lock on system events:
  - Screen lock
  - System sleep
  - App minimize (desktop)
  - Tab switch (web, optional)
- Immediate lock button
- Lock status indicator
- Require biometric/PIN after timeout
- Activity detection (mouse, keyboard, touch)

**Technical Considerations**:

- Use idle detection APIs
- System event listeners
- Timer management
- Persist lock settings
- Handle edge cases (during code copy, etc.)

**Estimated Effort**: Medium (3-4 days)

---

### 18. Secure Clipboard 📋

**Description**: Enhanced clipboard security to prevent unauthorized access.

**User Story**: As a security-conscious user, I want copied codes to be automatically cleared from my clipboard after a short time.

**Implementation Details**:

- Auto-clear clipboard after configurable time (10, 30, 60 seconds)
- Clipboard clear confirmation
- Prevent clipboard access by other apps (desktop)
- Clipboard history protection
- Option to disable clipboard entirely (show code only)
- Visual countdown timer
- Manual clear button

**Technical Considerations**:

- Use Clipboard API
- Timer management
- Tauri clipboard APIs for desktop
- Platform-specific clipboard protection
- Handle clipboard permissions
- Test across different OS

**Estimated Effort**: Medium (3-4 days)

---

### 19. Account Recovery 🆘

**Description**: Recovery options for backup encryption and lost PINs.

**User Story**: As a user, I want a way to recover my accounts if I forget my backup password or PIN.

**Implementation Details**:

- **Recovery Codes**:
  - Generate recovery codes on first setup
  - Print/save recovery codes
  - Use recovery code to reset PIN
  - Use recovery code to decrypt backup
- **Multi-Factor Recovery**:
  - Email recovery (optional)
  - Security questions
  - Biometric recovery
- **Emergency Access**:
  - Emergency access codes
  - Time-delayed access
- **Account Export**:
  - Export unencrypted backup (with warnings)
  - QR code export for each account

**Technical Considerations**:

- Secure recovery code generation
- Recovery code validation
- Prevent brute force attacks
- Clear security warnings
- Recovery audit log

**Estimated Effort**: High (6-7 days)

---

## 💡 UX Improvements

### 20. Onboarding Tutorial 📚

**Description**: Interactive tutorial for first-time users.

**User Story**: As a new user, I want a guided tutorial to help me understand how to use Sigil.

**Implementation Details**:

- Welcome screen on first launch
- Step-by-step tutorial:
  - What is 2FA/TOTP
  - How to add your first account
  - How to use codes
  - Security best practices
  - Backup recommendations
- Interactive walkthrough with highlights
- Skip option
- Replay tutorial from settings
- Tips and tricks section
- Video tutorials (optional)

**Technical Considerations**:

- Use a tour library (Intro.js, Shepherd.js)
- Store tutorial completion status
- Responsive design for mobile
- Localization support
- Analytics to track completion rate

**Estimated Effort**: Medium (3-4 days)

---

### 21. Notifications 🔔

**Description**: Smart notifications for important events.

**User Story**: As a user, I want to be notified about important events like backup reminders and security alerts.

**Implementation Details**:

- **Notification Types**:
  - Code expiration warnings (optional)
  - Backup reminders (weekly/monthly)
  - Security alerts (unusual activity)
  - Update available
  - Sync status
- **Notification Settings**:
  - Enable/disable per type
  - Notification sound
  - Desktop notifications
  - In-app notifications
- **Smart Notifications**:
  - Don't notify during active use
  - Respect quiet hours
  - Batch similar notifications

**Technical Considerations**:

- Web Notifications API
- Tauri notification system
- Permission handling
- Notification scheduling
- Persistent notifications
- Action buttons in notifications

**Estimated Effort**: Medium (3-4 days)

---

### 22. Widgets (Desktop) 🪟

**Description**: Desktop widgets for quick access.

**User Story**: As a desktop user, I want quick access to my codes without opening the full app.

**Implementation Details**:

- **System Tray Widget**:
  - Show recent/favorite accounts
  - Quick copy from tray menu
  - Search from tray
  - Settings access
- **Mini Window Mode**:
  - Compact view showing only codes
  - Always-on-top option
  - Resizable
  - Transparent background option
- **Desktop Widget** (macOS/Windows):
  - Dashboard widget
  - Live updating codes
  - Click to copy

**Technical Considerations**:

- Tauri system tray APIs
- Window management
- Platform-specific widgets
- Performance optimization
- Memory usage

**Estimated Effort**: High (6-8 days, platform-specific)

---

### 23. Keyboard Shortcuts ⌨️

**Description**: Comprehensive keyboard shortcuts for power users.

**User Story**: As a power user, I want to perform common actions quickly using keyboard shortcuts.

**Implementation Details**:

- **Global Shortcuts** (Desktop):
  - Show/hide app (Cmd/Ctrl+Shift+A)
  - Copy last code (Cmd/Ctrl+Shift+C)
  - Lock app (Cmd/Ctrl+L)
  - Search (Cmd/Ctrl+F)
- **In-App Shortcuts**:
  - Navigate accounts (Arrow keys)
  - Copy code (Enter/Space)
  - Add account (Cmd/Ctrl+N)
  - Settings (Cmd/Ctrl+,)
  - Delete account (Delete/Backspace)
  - Edit account (E)
  - Toggle favorite (F)
- **Customizable Shortcuts**:
  - User-defined shortcuts
  - Shortcut cheat sheet (?)
  - Conflict detection

**Technical Considerations**:

- Keyboard event handling
- Prevent conflicts with system shortcuts
- Tauri global shortcuts for desktop
- Shortcut persistence
- Accessibility considerations
- Visual shortcut hints

**Estimated Effort**: Medium (3-4 days)

---

## 📱 Platform-Specific Features

### 24. Mobile App (iOS/Android) 📱

**Description**: Native mobile applications.

**User Story**: As a mobile user, I want a native app with mobile-specific features.

**Implementation Details**:

- React Native or Flutter version
- Mobile-optimized UI
- Native biometric integration
- Share sheet integration
- Widget support (iOS/Android)
- Apple Watch / Wear OS support
- Haptic feedback
- Dark mode following system

**Technical Considerations**:

- Code sharing with web version
- Platform-specific APIs
- App store deployment
- Push notifications
- Background sync
- Battery optimization

**Estimated Effort**: Very High (20-30 days)

---

### 25. CLI Tool 💻

**Description**: Command-line interface for developers and automation.

**User Story**: As a developer, I want to access my TOTP codes from the command line for scripts and automation.

**Implementation Details**:

- Generate codes from command line
- List all accounts
- Add/remove accounts
- Export/import backups
- Pipe codes to other commands
- JSON output for scripting
- Interactive TUI mode

**Technical Considerations**:

- Rust CLI using clap
- Share storage with desktop app
- Secure credential storage
- Cross-platform support
- Man pages and documentation

**Estimated Effort**: Medium-High (5-6 days)

---

## 🌍 Internationalization

### 26. Multi-Language Support 🌐

**Description**: Support for multiple languages.

**User Story**: As a non-English speaker, I want to use Sigil in my native language.

**Implementation Details**:

- Initial languages:
  - English (default)
  - Spanish
  - French
  - German
  - Japanese
  - Chinese (Simplified & Traditional)
  - Portuguese
  - Russian
  - Arabic (RTL support)
- Language selector in settings
- Auto-detect system language
- Fallback to English
- Community translations
- Translation management platform

**Technical Considerations**:

- Angular i18n or ngx-translate
- Extract translatable strings
- RTL layout support
- Date/time localization
- Number formatting
- Pluralization rules

**Estimated Effort**: High (initial setup 4-5 days, ongoing for translations)

---

## 🧪 Testing & Quality

### 27. End-to-End Testing 🧪

**Description**: Comprehensive E2E testing suite.

**Implementation Details**:

- Playwright or Cypress tests
- Critical user flows:
  - Add account (all methods)
  - Generate codes
  - Backup/restore
  - PIN lock/unlock
  - Settings changes
- Visual regression testing
- Cross-browser testing
- Mobile testing
- Performance testing

**Estimated Effort**: High (6-8 days)

---

### 28. Performance Monitoring 📈

**Description**: Monitor and optimize app performance.

**Implementation Details**:

- Performance metrics:
  - App startup time
  - Code generation time
  - Search performance
  - Database query time
- Performance budgets
- Lighthouse CI integration
- Bundle size monitoring
- Memory leak detection
- FPS monitoring

**Estimated Effort**: Medium (3-4 days)

---

## 🎯 Priority Matrix

### Must Have (P0)

1. Search & Filter Accounts [✅]
2. Account Editing
3. Favorites/Pinning
4. Auto-Backup
5. Keyboard Shortcuts

### Should Have (P1)

6. Account Import/Export Formats [✅]
7. Customizable Themes
8. Auto-Lock Settings
9. Secure Clipboard
10. Onboarding Tutorial

### Nice to Have (P2)

11. Account Statistics
12. HOTP Support
13. Steam Guard Support
14. Notifications
15. Account Templates

### Future Consideration (P3)

16. Browser Extension
17. Multi-Device Sync
18. Mobile App
19. CLI Tool
20. Multi-Language Support

---

## 📊 Effort Estimation Summary

| Priority | Total Features | Estimated Days |
| -------- | -------------- | -------------- |
| P0       | 5              | 15-20 days     |
| P1       | 5              | 20-25 days     |
| P2       | 5              | 15-20 days     |
| P3       | 5              | 40-60 days     |

---

## 🤝 Contributing

Community contributions are welcome for any of these features! Please:

1. Check existing issues/PRs
2. Discuss major features in an issue first
3. Follow the `.cursorrules` for development
4. Include tests for new features
5. Update documentation

---

## 📝 Notes

- All features should maintain the **offline-first** philosophy
- Security and privacy are paramount
- Features should be **optional** when possible
- Maintain **cross-platform** compatibility
- Follow **accessibility** best practices
- Keep the app **lightweight** and **fast**

---

**Last Updated**: 2025-12-25
**Version**: 1.0.0
