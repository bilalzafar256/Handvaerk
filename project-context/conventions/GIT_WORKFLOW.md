# Git Workflow

## Branch Naming (Inferred from git log)

Recent branches seen: `fix/docs`, `feat/audio-to-job`, `feat/phase-7`, `feat/phase-10`

**[INFERRED pattern]:**
- Features: `feat/{description}` or `feat/phase-{N}`
- Fixes: `fix/{description}`
- No evidence of `chore/`, `refactor/`, `docs/` prefixes

---

## Merge Strategy

From git log (`Merge pull request #11`): PRs are merged into `main` via GitHub Pull Requests.

---

## Commit Format (Inferred)

From recent commits:
```
05e4f24 Merge pull request #11 from bilalzafar256/feat/audio-to-job
41311f8 minor changes in UI
80d9c31  feat: AI job recording with file upload, Groq pipeline, and notification system
b622070 Merge pull request #10 from bilalzafar256/feat/phase-7
65c1780 migration fix
```

**Pattern:** Mix of Conventional Commits style (`feat:`, `fix:`) and informal messages. No enforced format (no commitlint).

---

## Deployment

- `main` branch → production deployment on Vercel [INFERRED from `.vercel/` presence]
- PRs → Vercel preview deployments [INFERRED]
- No automated tests or lint checks on PR [KI-012]

---

## [UNKNOWN — needs manual fill]
- Branch protection rules on `main`
- Required reviewers for PRs
- Any PR template
- Squash vs merge vs rebase merge strategy
- Release tagging strategy

---

→ Related: `context/KNOWN_ISSUES.md`, `architecture/INFRASTRUCTURE.md`
