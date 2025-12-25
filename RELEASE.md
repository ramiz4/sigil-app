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

## 📝 Commit Mapping & Versioning

The system decides the next version number based on your commit messages, following the [Conventional Commits](https://www.conventionalcommits.org/) standard:

| Commit Prefix               | Release Type              | Example                                          |
| :-------------------------- | :------------------------ | :----------------------------------------------- |
| `fix:`                      | **Patch** (0.4.2 → 0.4.3) | Bug fixes without new features.                  |
| `feat:`                     | **Minor** (0.4.2 → 0.5.0) | New features that are backward compatible.       |
| `feat!:` / `fix!:`          | **Major** (0.4.2 → 1.0.0) | Changes with "Breaking Changes" (incompatible).  |
| `chore:`, `docs:`, `style:` | **No Release**            | Internal changes with no impact on the end user. |

> **Important**: Only commits in the `main` branch are analyzed for releases. If you have multiple commits in a PR, the "highest" type (Major > Minor > Patch) determines the new version.

## 🛠 Manual Release (Emergency only)

If you ever need to trigger a release manually for testing (rare), you can run:

```bash
pnpm release
```

_Note: This usually requires a `GITHUB_TOKEN` with write permissions._
