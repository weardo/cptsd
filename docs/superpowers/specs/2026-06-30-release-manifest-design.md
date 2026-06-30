# Sub-project B Design Doc — Release Manifest + `bin/` Helpers (cptsd monorepo)

Status: design for review → execute. Builds on Sub-project A (Nx layout, `cptsd_net`, renamed `/opt/X` + `X-app`). Implements the dev-os release model adapted to this repo's **Jenkins-on-the-box, push-to-deploy** reality.

User decision (locked): **manifest + sha-tagged images, Jenkins remains the builder/deployer.**

---

## 1. Goal & Scope

**Goal.** Give deployments an immutable artifact identity and a single source of truth for "what is deployed where," so a deploy is "move the manifest forward by one sha" and a rollback is "revert the manifest line + redeploy" — one command, deterministic.

**The core change:** images stop being `:latest`-only. Each Jenkins build tags `unit:<short-sha>` (and keeps `:latest` as a convenience alias). `manifest/<env>.lock` pins the deployed short-sha per unit. `bin/` reads/writes the manifest and drives Jenkins to a chosen sha.

**In scope:**
1. `manifest/prod.lock` + `manifest/stage.lock` — pinned `unit <short-sha>` per deployable unit (main, blog, cms, journal, worker).
2. Jenkinsfile changes (all 3 + add journal/worker if we want them in the loop): tag `unit:<GIT_SHA>` + `unit:latest`; become **parameterized** with optional `DEPLOY_SHA` so a deploy can re-point to a *prebuilt* sha image **without rebuilding** (this is what makes rollback instant and bin/deploy possible).
3. `bin/` helpers (bash): `current`, `pin`, `deploy`, `promote` + shared `bin/lib.sh`.
4. Host-only `bin/.deployrc` (gitignored) holding the Jenkins base URL + API token — never committed (host-only-secrets discipline).
5. Docs: a short `RELEASE.md` + `bin/README.md` describing the loop.

**Out of scope (later / other sub-projects):**
- DB migrations tied to the manifest (Mongo is schemaless; revisit in expand-contract work).
- A real image registry (images stay local on the Hetzner box; rollback relies on retained sha-tagged images — see §6 retention).
- Ephemeral per-PR environments (serialize the one env per release-workflow.md).
- Renaming Jenkins job names (still `cptsd-main`/`cptsd-cms`/`cptsd-blog-public`).
- Auto-promote/CD: `bin/promote` is operator-run, not automatic.

---

## 2. Manifest format

`manifest/<env>.lock` — plain text, one unit per line, `unit<space>shortsha`, comments with `#`. Trivial to parse in bash, clean to diff/review, git-tracked (it IS the deployed-truth record).

```
# manifest/prod.lock — deployed artifacts in production. Edited via bin/pin / bin/promote.
main     a1b2c3d
blog     9f8e7d6
cms      a1b2c3d
journal  a1b2c3d
worker   a1b2c3d
```

`stage.lock` has the same shape. A git tag `release/<env>/<UTCdate>-<n>` is created by `bin/promote` pointing at the prod.lock state for one-command rollback to a prior release.

---

## 3. `bin/` helpers (all bash, `set -euo pipefail`)

| Helper | Signature | Behavior |
|---|---|---|
| `bin/lib.sh` | (sourced) | manifest read/write (`read_pin`, `set_pin`, `each_unit`), short-sha normalize, Jenkins trigger (`trigger_job <job> <sha>`), config load from `bin/.deployrc`. The ONE place run/trigger logic lives. |
| `bin/current` | `current <env>` | print the manifest for `<env>` (what's deployed). |
| `bin/pin` | `pin <env> <unit> <sha>` | validate unit + that `<sha>` is a real commit (`git cat-file -e`), rewrite that unit's line in `manifest/<env>.lock`. Local record only — does not deploy. |
| `bin/deploy` | `deploy <env> [unit]` | for each unit (or one) in `manifest/<env>.lock`, call `trigger_job <job> <sha>` → Jenkins `buildWithParameters?DEPLOY_SHA=<sha>`; poll the build to completion; fail loudly if the Jenkins build fails. |
| `bin/promote` | `promote <feature-branch>` | squash-merge `<feature>` → `main`; compute new `main` short-sha; `pin prod <each-changed-unit> <sha>`; `deploy prod`; on success create `release/prod/<date>-<n>` tag. Refuses if working tree dirty or not on `main` after merge. |

**Unit → Jenkins job map** (in `bin/lib.sh`, since job names ≠ unit names by A's scope decision):
`main→cptsd-main`, `blog→cptsd-blog-public`, `cms→cptsd-cms`. `journal`/`worker` have **no Jenkins job today** (A finding) → §5 decision.

---

## 4. Jenkinsfile changes (the artifact-identity unlock)

Per job, two changes (shown for `main`; same pattern for cms/blog):

**(a) Parameterize + compute sha.**
```groovy
parameters { string(name: 'DEPLOY_SHA', defaultValue: '', description: 'Deploy a prebuilt sha image without rebuilding (rollback/redeploy). Empty = build current commit.') }
environment { /* … */ }
```
Derive `SHA = params.DEPLOY_SHA ?: env.GIT_COMMIT.take(7)` in a script step.

**(b) Build tags by sha; deploy from sha; skip build on redeploy.**
- Build stage runs only when `params.DEPLOY_SHA == ''`: `docker build … -t main:${SHA} -t main:latest ..`
- When `DEPLOY_SHA` is set: skip build, assert `docker image inspect main:${SHA}` exists (fail with a clear message if the image was pruned).
- Deploy stage runs `docker run … main:${SHA}` (was `main:latest`). Health gate unchanged (A already made it blocking).

Net: normal push → builds `main:<sha>`+`:latest`, deploys `<sha>`. `bin/deploy prod` with a pinned older sha → Jenkins redeploys that image, no rebuild.

`cms`/`blog` build-once-reuse pattern (compose `--build`): same idea — tag the built image by sha, run the sha; `DEPLOY_SHA` path re-points compose/container to the existing sha image.

---

## 5. journal + worker (no Jenkins job today)

A confirmed journal/worker deploy manually (compose), not via Jenkins. **Decision for B:** include them in the manifest (so prod-truth is complete) but mark their job as `manual` in the unit map; `bin/deploy` for them prints the exact `docker`/compose command to run on the box with the pinned sha rather than triggering a (nonexistent) Jenkins job. This keeps the manifest honest without fabricating CI we don't have. Wiring journal/worker into Jenkins is a follow-up, not B.

---

## 6. Risks & decisions to confirm

- **Image retention = rollback safety.** Rollback to `unit:<oldsha>` only works if that image still exists on the box. B adds a documented retention note + a `bin/` guard that fails clearly if the sha image is gone. A registry (out of scope) would remove this constraint; for now, don't aggressively `docker image prune`.
- **Deploy behavior change (needs sign-off):** Jenkinsfiles gain a `DEPLOY_SHA` param and deploy-from-sha. Normal push-to-deploy is unchanged when the param is empty; this is additive.
- **`bin/promote` does a real merge + tag.** It mutates `main` and pushes a tag. It will be written to refuse on a dirty tree / failed deploy, and to print a dry-run summary before acting (`--dry-run` default-on for the first run).
- **Secrets:** `bin/.deployrc` (Jenkins URL + token) is host-only + gitignored; `bin/lib.sh` errors if it's missing rather than guessing.
- **Stage env:** `stage.lock` exists for the discipline, but A's infra is single-prod. `bin/deploy stage` works the same way once a stage target exists; until then it's documented as not-yet-wired.

---

## 7. Verification plan

- `bin/current prod` prints the seeded manifest.
- `bin/pin prod cms <sha>` rewrites only the cms line (diff shows one line).
- `shellcheck bin/*` clean; `bash -n` parse-check all helpers.
- Jenkinsfile lint: `bash -n` the embedded sh, and confirm the `DEPLOY_SHA`-empty path is byte-identical in behavior to today (build+tag+run) so normal deploys don't change.
- Dry-run `bin/promote <branch> --dry-run` prints the intended merge + pins + tag without executing.
- Live validation (operator, on box, when ready): push a commit → confirm `cms:<sha>` image exists; `bin/deploy prod cms` with the prior sha → confirms redeploy-without-rebuild + rollback.

---

This is additive: new `manifest/` + `bin/` + a gitignored `bin/.deployrc`, plus parameterized Jenkinsfiles whose default (empty `DEPLOY_SHA`) path is behavior-identical to today. Rollback for B itself = delete the files + revert the Jenkinsfile param.
