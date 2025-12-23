---
description: how to commit and prepare a PR for the sigil app
---

1. Ensure all code changes are complete.
2. Run `pnpm test --watch=false` locally to verify logic.
3. Check the type of changes:
   - If a new feature: use `feat:`
   - If a bug fix: use `fix:`
   - If a breaking change: use `feat!:` or `fix!:`
4. Create a new branch: `git checkout -b <type>/<short-description>`
5. Commit changes using Conventional Commits format.
6. Push the branch and create a Pull Request targeting `main`.
7. Wait for the `PR Check` GitHub Action to pass.
8. Merge to `main` to trigger the automated version bump and release.
