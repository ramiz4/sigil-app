# Release Guide for **Sigil** (GitHub)

## 1️⃣ Prepare a new version

```bash
# Bump the version (patch, minor, or major)
npm version patch   # or `npm version minor` / `npm version major`
```

## 2️⃣ What happens automatically

- **GitHub Actions** (`.github/workflows/deploy.yml`) runs on every push to `main`.
- It reads the new version from `package.json`.
- If the tag `v<new-version>` does not exist, it creates and pushes it.
- The `tauri-action` then creates a **GitHub Release** named `Sigil v<new-version>` and uploads the desktop binaries for macOS, Linux, and Windows.

## 3️⃣ Verify the release

- Go to **GitHub → Releases** in the repository.
- You should see a new release with the version you just pushed and downloadable assets.

## 4️⃣ (Optional) Publish the web build

The same workflow also builds the web app and deploys it to GitHub Pages under `/sigil-app/`.

---

> **Note:** No manual steps are required beyond bumping the version and pushing the commit; the CI pipeline handles tagging and releasing for you.
