# Release workflow

Deployments have two independent pinning systems (per the dev-os release model):

- **A feature** = a branch-set (here, one branch in this monorepo).
- **An environment** = `manifest/<env>.lock` — the source of truth for the **sha** of
  each unit deployed in `prod`/`stage`. Environments move independently of branches,
  so one shared env never requires one shared branch.

Images are tagged by immutable git short-sha (`main:<sha>`, `cms:<sha>`, `blog:<sha>`),
so a rollback is "re-point the manifest + redeploy that sha" — no rebuild.

## Setup (once, on the machine that runs deploys)

```bash
cp bin/.deployrc.example bin/.deployrc   # gitignored
# edit bin/.deployrc: JENKINS_URL, JENKINS_USER, JENKINS_TOKEN (use an API token)
```

## Daily loop

```bash
bin/current prod                 # what's deployed where
bin/promote feat/my-change       # DRY-RUN preview (default)
bin/promote feat/my-change --apply
#   -> squash-merge to main, pin prod for affected units, tag release/prod/<date>-N,
#      push main+tag. The push triggers the Jenkins webhook, which builds <sha>,
#      tags main:<sha>/cms:<sha>/blog:<sha>, and deploys it.
```

## Redeploy / rollback a specific sha (no rebuild)

```bash
bin/pin prod cms <previous-sha>  # record the target in the manifest
bin/deploy prod cms              # Jenkins redeploys cms:<previous-sha> via DEPLOY_SHA
```

`bin/deploy` triggers each unit's Jenkins job with `DEPLOY_SHA=<sha>`; the job skips the
build and runs the prebuilt `unit:<sha>` image. **Rollback only works while that image
still exists on the box** — don't aggressively `docker image prune`. If it's gone, the
job fails loudly (rebuild that commit instead).

## Test gate

Every unit has an `nx test` target (jest). Two enforcement points:

- **Local (per clone, enable once):** `git config core.hooksPath .githooks`
  — the committed `.githooks/pre-commit` runs `nx run-many -t type-check test build`
  (Nx-cached). `SKIP_BUILD=1` skips the slow build leg; `SKIP_PRE_COMMIT=1` skips all.
- **CI (blocking):** the main/cms/blog Jenkins `Test` stage runs `nx test <unit>` in a
  node container against the checked-out workspace and **fails the build before Deploy**.
  Skipped on `DEPLOY_SHA` redeploys (rollback of an already-tested artifact).

```bash
pnpm exec nx run-many -t test      # all units
pnpm exec nx test cms              # one unit
```

## Units

| Unit | Jenkins job | Deploy |
|------|-------------|--------|
| main | `cptsd-main` | `docker run main:<sha>` |
| blog | `cptsd-blog-public` | compose, `BLOG_IMAGE=blog:<sha>` |
| cms | `cptsd-cms` | compose, `CMS_IMAGE=cms:<sha>` |
| journal | — (manual) | `bin/deploy` prints the box command |
| worker | — (manual) | `bin/deploy` prints the box command |

Wiring journal/worker into Jenkins is a follow-up. See
`docs/superpowers/specs/2026-06-30-release-manifest-design.md` for the full design.
