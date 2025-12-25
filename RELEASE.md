# Release Process for **Sigil**

Sigil uses **fully automated versioning and releases**. There are no manual steps required to create a new version, tag, or GitHub release.

## 🚀 How it works

1.  **Develop**: Create a feature branch and implement your changes.
2.  **Commit**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: ...`, `fix: ...`).
3.  **Merge**: Create a Pull Request and merge it into the `main` branch.
4.  **Automate**: Once merged, a GitHub Action triggers `semantic-release`, which:
    - Analyzes your commits to determine the next version (patch, minor, or major).
    - Updates `package.json` and `src-tauri/tauri.conf.json`.
    - Generates/updates the `CHANGELOG.md`.
    - Creates a Git tag and a GitHub Release.
    - Uploads the desktop binaries for macOS, Linux, and Windows.

## 📝 Commit Conventions

The version is determined by the commit types:

- `fix: ...` -> **Patch** release (e.g., 0.4.2 -> 0.4.3)
- `feat: ...` -> **Minor** release (e.g., 0.4.2 -> 0.5.0)
- `feat!:` or `fix!:` (with `!`) -> **Major** release (e.g., 0.4.2 -> 1.0.0)

For more details on commit types, see the [Conventional Commits](https://www.conventionalcommits.org/) website.

## 🛠 Manual Release (Emergency only)

If you ever need to trigger a release manually for testing (rare), you can run:

```bash
pnpm release
```

_Note: This usually requires a `GITHUB_TOKEN` with write permissions._
