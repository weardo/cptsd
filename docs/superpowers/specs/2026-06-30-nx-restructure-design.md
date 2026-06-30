# Sub-project A Design Doc — Nx Canonical-Layout Restructure + Consistent Rename (cptsd monorepo)

Status: build-ready draft for user review, then `/writing-plans`. All facts cite Reports 1–4 (R1 Blast Radius, R2 Workspace Graph, R3 Nx Targets, R4 Prod Topology).

---

## 1. Goal & Scope

**Goal.** Convert the manual multi-root "monorepo" (no root `package.json`, no `pnpm-workspace.yaml`, no Nx — R2) into a canonical Nx workspace with `apps/*` + `libs/*`, a single pnpm workspace replacing the `postinstall` `cp -r` copy-hack (R2 §1), and consistently renamed runtime identifiers — without breaking the live Hetzner prod deploy (R4) and with a clean rollback to the pre-Nx commit.

**In scope (this sub-project A only):**
1. Directory restructure to Nx layout (8 units) — locked map below.
2. Root workspace tooling: `package.json`, `pnpm-workspace.yaml`, `nx.json`, `tsconfig.base.json`; per-unit `project.json`.
3. Kill `postinstall` copy-hack → pnpm workspace symlink resolution; `@cptsd/*` scope unchanged.
4. Consistent runtime rename: `/opt/cptsd-X`→`/opt/X`; container `cptsd-X-app[...]`→`X-app[...]`; network `cptsd-cms_app-network`→`cptsd_net`; ports unchanged (3000–3003).
5. Item-2 hygiene: add `tsconfig.base.json` all units extend; `git rm` the 10MB `stitch_*.zip`; scrub real-looking creds from on-disk `.env*.example` files.
6. Rewrite every Dockerfile / Jenkinsfile / compose / script / Caddy-generator / README reference (R1 blast radius).
7. Prod cutover + rollback runbook.

**Explicitly OUT of scope (separate sub-projects B/C):**
- Data migrations of any kind (Mongo `cptsd-cms`/`cptsd-journal`, Postgres `cptsd_cms`, MinIO bucket `cptsd-cms` stay as-is — R1 DO-NOT-CHANGE; R4 §5).
- Renaming Jenkins **JOB** names / `APP_NAME` env. R1 flags JOB as a decision, not one of the 5 locked buckets. **Decision for A: keep job names `cptsd-cms` / `cptsd-blog-public` / `cptsd-main` as-is**; only their `Script Path` / `dir()` / `DEPLOY_PATH` / container / network values change. Renaming jobs is a Jenkins-console action with its own credential/webhook churn → defer to B.
- Adding a real lib build step / publishing libs as compiled artifacts (libs stay raw-TS source — R2 §6, R3). Any expand-contract package-version work → B/C.
- Unifying the journal's standalone Mongo/network into the shared stack (R4 §2) — topology change, not a rename → defer.
- The `@cptsd/*` npm scope rename (locked: unchanged).
- Fixing the blog `ports: []` prod-override discrepancy beyond what cutover verification requires (R4 §3 risk) — note it, verify on box, don't redesign here.

---

## 2. Target Tree (after-state)

```
cptsd/                              # repo root — NEW workspace root
├── package.json                    # NEW: root, private, devDeps: nx, typescript; workspace scripts
├── pnpm-workspace.yaml             # NEW: packages globs apps/* libs/*
├── pnpm-lock.yaml                  # NEW: single root lockfile (regenerated)
├── nx.json                         # NEW: targetDefaults, namedInputs, plugins
├── tsconfig.base.json              # NEW: compilerOptions + paths for @cptsd/*
├── .env*.example                   # scrubbed (item 2)
├── docker-compose.jenkins.yml      # rewritten (paths + network)
├── DEPLOY.md / README.md           # rewritten (paths/dir/job refs)
├── docs/
│   └── DEPLOYMENT_SETUP.md         # rewritten
├── scripts/                        # Jenkins/deploy automation — rewritten (see §6)
├── apps/
│   ├── main/                       # was cptsd-main/      (port 3002)
│   │   ├── project.json            # NEW
│   │   ├── package.json            # postinstall removed; deps keep workspace:* for @cptsd/*
│   │   ├── tsconfig.json           # extends ../../tsconfig.base.json
│   │   ├── next.config.ts          # webpack aliases → ../../libs/*/src (or dropped)
│   │   ├── Dockerfile  Jenkinsfile  docker-compose*.yml  scripts/
│   ├── blog/                       # was cptsd-blog-public/ (port 3001)
│   │   └── … (project.json, Dockerfile, Jenkinsfile, compose, …)
│   ├── cms/                        # was cptsd-cms/        (port 3000)
│   │   └── … (project.json, jest.config.js, jest.setup.js, Dockerfile, Jenkinsfile, compose×3, scripts/)
│   ├── journal/                    # was apps/cptsd-journal/ (port 3003)
│   │   └── … (project.json, Dockerfile, docker-compose.yml, scripts/{setup-caddy,setup-env}.sh)
│   └── worker/                     # was services/worker/  (no port; tsc→dist)
│       └── … (project.json, Dockerfile, start.sh, src/, tsconfig.json)
└── libs/
    ├── db/                         # was packages/db   (@cptsd/db)   — nested self-copies removed (R2 §1)
    │   └── project.json (type-check only), package.json, src/
    ├── pets/                       # was packages/pets (@cptsd/pets)
    └── ai/                         # was packages/ai   (@cptsd/ai)
```

Notes: each Next app keeps `output:'standalone'` → Docker runs `node server.js`, not `next start` (R3 cross-cutting). `libs/*` have no `dist/` and no build target (R2 §6, R3).

---

## 3. Move Map

### 3a. Directory moves (use `git mv` to preserve history)
| Old path | New path | Notes |
|---|---|---|
| `cptsd-main/` | `apps/main/` | one level deeper → relative lib paths change `../packages`→`../../libs` |
| `cptsd-blog-public/` | `apps/blog/` | same depth change |
| `cptsd-cms/` | `apps/cms/` | network-name source (see 3c) |
| `apps/cptsd-journal/` | `apps/journal/` | depth unchanged (`apps/`) |
| `services/worker/` | `apps/worker/` | depth unchanged (two levels) |
| `packages/db/` | `libs/db/` | also `git rm -r` nested self-copies `libs/db/db/db…` (R2 §1) |
| `packages/pets/` | `libs/pets/` | no lockfile existed (R2 §4) |
| `packages/ai/` | `libs/ai/` | |

### 3b. Deploy-path (PATH) renames `/opt/cptsd-X` → `/opt/X`
| Old | New | Primary refs (R1) |
|---|---|---|
| `/opt/cptsd-cms` | `/opt/cms` | cms/Jenkinsfile:6; cms/scripts/{deploy-simple:8, deploy-cx23-remote:10, setup-domain:8}; docker-compose.jenkins.yml:16; DEPLOY.md/README PATH set; many `scripts/*.sh` |
| `/opt/cptsd-blog-public` | `/opt/blog` | blog/Jenkinsfile:6; docker-compose.jenkins.yml:17; scripts add-env/automatically/.../setup-jenkins:11 |
| `/opt/cptsd-main` | `/opt/main` | main/Jenkinsfile:6; main/docker-compose.yml:15,18; docker-compose.jenkins.yml:18 |
| `/opt/cptsd-journal`, `/opt/worker` | n/a | did not exist (R1, R4) — do not create |

### 3c. Container (CONTAINER) renames `cptsd-X-app[...]` → `X-app[...]`
| Old | New | Refs |
|---|---|---|
| `cptsd-main-app` | `main-app` | main/Jenkinsfile:52,61,74,99; image tag `cptsd-main:latest`→`main:latest` (34,71) |
| `cptsd-cms-app-1` / `-minio-1` / `-mongodb-1` | `cms-app-1` / `cms-minio-1` / `cms-mongodb-1` (derived from compose project = dir `cms`) | cms/Jenkinsfile:123 hardcodes old `docker rm -f` list — update |
| `cptsd-cms_app_1` (v1 underscore form) | `cms_app_1`/`cms-app-1` | cms/scripts/fix-admin-user.sh:115 |
| `cptsd-blog-public-app-1` | `blog-app-1` | blog/Jenkinsfile:97 hardcodes old name |
| `cptsd-journal-app-1` | `journal-app-1` | derived from dir; manual compose (R4) |

### 3d. Network (NETWORK) rename — single neutral name
| Old | New | Refs (R1 cross-cutting #1) |
|---|---|---|
| `cptsd-cms_app-network` (derived from cms dir + key `app-network`) | `cptsd_net` (explicit `name:`) | **define** `name: cptsd_net` at `apps/cms/docker-compose.yml:149-151`; **pin** at `apps/main/docker-compose.yml:59`, `apps/blog/docker-compose.yml:52`, `docker-compose.jenkins.yml:39`; **flag** `apps/main/Jenkinsfile:62` (`--network`); **create** `scripts/setup-jenkins.sh:49` (`docker network create`) |

Critical (R1, R4 §2): renaming the cms dir silently changes the *derived* network name to `cms_app-network` and breaks every external joiner. Fix = give cms's network an explicit `name: cptsd_net` so the value is decoupled from the dir name, then update all joiners + the `create` call + the `--network` flag.

### 3e. Journal's own network (decision)
`apps/journal/docker-compose.yml:128-130` defines a *separate* `app-network` (derived `cptsd-journal_app-network`, R1/R4 §2). It is standalone and not on the shared net. **Decision for A:** leave the journal's internal network as-is (do not fold into `cptsd_net`) — folding is a topology change (out of scope). Its derived name will simply become `journal_app-network` after the dir rename, which is self-consistent because journal references only its own `app-network` key. No external pin points at it.

---

## 4. Workspace Conversion

Replaces four overlapping layers (R2 §6): (a) `postinstall` `cp -r`, (b) per-unit tsconfig `paths`, (c) per-app `next.config.ts` `transpilePackages`+webpack alias, (d) dual npm/pnpm lockfiles.

### 4a. `pnpm-workspace.yaml` (root, NEW)
```yaml
packages:
  - 'apps/*'
  - 'libs/*'
```

### 4b. Root `package.json` (NEW)
```jsonc
{
  "name": "cptsd",
  "private": true,
  "packageManager": "pnpm@9",            // pin the pnpm used; lockfile v9
  "scripts": {
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint",
    "type-check": "nx run-many -t type-check"
  },
  "devDependencies": {
    "nx": "latest",                       // pin to a real version at impl time
    "typescript": "^5"
  }
}
```

### 4c. `@cptsd/*` resolution via workspace (replaces copy-hack)
- Each consumer's `package.json` declares the libs as workspace deps: `"@cptsd/db": "workspace:*"` (and `@cptsd/pets` / `@cptsd/ai` as used per unit — R2 §2). pnpm creates `node_modules/@cptsd/db` as a **symlink** into `libs/db`.
- **Delete the `postinstall` line** from all five consumer `package.json` files (R2 §1: main:6, blog:6, cms:6, journal:6, worker:6).
- Libs keep `main`/`types`/`exports` → `./src/*.ts` (R2 §5) unchanged. Next apps keep `transpilePackages: ['@cptsd/db', …]` (so Next compiles the raw-TS workspace source — R2 §6); worker keeps its own `tsc` build pulling the symlinked source.
- **Drop the per-app webpack `resolve.alias` blocks** in `next.config.ts` (main/blog/cms — R2 §6): with the symlink + `transpilePackages` + the libs' `exports` map, `@cptsd/db`, `@cptsd/db/client`, `@cptsd/db/mongodb`, `@cptsd/db/models/*`, `@cptsd/pets/components|lib` all resolve through node_modules. If any alias must be retained as a safety net, repoint it from `../packages/<pkg>/src` to the workspace path; but prefer removal so resolution is single-sourced (eliminates the type-check-vs-bundle divergence R2 §3 calls out).
- Clean the nested-copy pollution `libs/db/db/db…` (R2 §1) before first `pnpm install`.

### 4d. `tsconfig.base.json` (root, NEW — item 2)
Single source of `@cptsd/*` path mappings, pointing at lib **source** (resolves R2 §3 inconsistency where main/cms used `../packages/db/src` but blog/worker/pets-half used `./node_modules/@cptsd/*/src`):
```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@cptsd/db":        ["libs/db/src/index.ts"],
      "@cptsd/db/*":      ["libs/db/src/*"],
      "@cptsd/pets":      ["libs/pets/src/index.ts"],
      "@cptsd/pets/*":    ["libs/pets/src/*"],
      "@cptsd/ai":        ["libs/ai/src/index.ts"],
      "@cptsd/ai/*":      ["libs/ai/src/*"]
    }
    // shared strict/target/module options factored up from the units
  }
}
```
**Per-unit `extends`:**
- main/blog/cms/journal `tsconfig.json` → `"extends": "../../tsconfig.base.json"`; **remove** their local `@cptsd/*` paths (R2 §3); keep local `@/*` and Next plugin settings.
- journal (had no `@cptsd/*` paths, R2 §3) → inherits them from base; relies additionally on `transpilePackages` as today.
- worker `tsconfig.json` → `extends ../../tsconfig.base.json`; **remove** its `./node_modules/@cptsd/*/src/index` paths; keep `outDir ./dist`, `rootDir ./src`, `module CommonJS`, `moduleResolution node16` (R3 worker). Verify the base `paths` resolve under `node16` for worker's CJS build; if `node16` rejects the bare `index.ts` mapping, give worker a minimal local `paths` override (worker is the one CJS/non-bundler consumer — R2 §3).
- libs' own `tsconfig.json` → `extends ../../tsconfig.base.json` for `type-check`.

### 4e. Lockfile cleanup (R2 §4)
- `git rm` every per-unit `package-lock.json` (main, blog, cms, journal, worker, db, ai) and every per-unit `pnpm-lock.yaml` (main, blog, cms only have these).
- Generate **one** root `pnpm-lock.yaml` via `pnpm install` at root.
- Result: single lockfile, no mixed npm/pnpm state. (Note: Dockerfiles currently `npm ci`/`npm install` — §6 switches them to pnpm + workspace symlink; this is the locked "replace copy-hack with symlinks" change.)

### 4f. `nx.json` (root, NEW)
```jsonc
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts", "!{projectRoot}/jest.config.js"]
  },
  "targetDefaults": {
    "build":      { "dependsOn": ["^build"], "inputs": ["production", "^production"], "cache": true },
    "type-check": { "inputs": ["default", "^default"], "cache": true },
    "lint":       { "cache": true },
    "test":       { "inputs": ["default", "^default"], "cache": true }
  }
}
```
`^build` is harmless for the libs (no build target) — Nx skips missing targets; it correctly orders worker's `tsc` after nothing (libs are source). Keep plugins minimal (explicit `project.json` targets, §5) so the conversion is transparent and reviewable; inferred `@nx/next`/`@nx/jest` plugins can be added in a later evolve pass.

---

## 5. Per-Unit `project.json` Plan (8 projects)

All use `nx:run-commands` with `options.cwd` set to the project root, invoking the **existing verbatim scripts** (R3) so behavior is unchanged. Ports from R3: cms 3000, blog 3001, main 3002, journal 3003.

| Project | root | build | serve (dev / prod) | test | lint | type-check |
|---|---|---|---|---|---|---|
| **main** | apps/main | `next build` | dev `next dev -p 3002` / prod `next start -p 3002`* | — | `eslint` | `tsc --noEmit` |
| **blog** | apps/blog | `next build` | dev/prod `-p 3001` | — | `eslint` | — (none; R3) |
| **cms** | apps/cms | `next build` | dev `next dev` / prod `next start` (port 3000 default, no `-p`) | `jest` (next/jest, jsdom; `jest.config.js`+`jest.setup.js`) | `eslint` | `tsc --noEmit` |
| **journal** | apps/journal | `next build` | dev/prod `-p 3003` | — | `eslint .` | `tsc --noEmit` |
| **worker** | apps/worker | `tsc` (→`dist/`) | dev `tsx watch src/index.ts` / prod `node dist/index.js` | — | — | `tsc --noEmit` |
| **db** | libs/db | — (source-only) | — | — | — | `tsc --noEmit` |
| **pets** | libs/pets | — (source-only) | — | — | — | `tsc --noEmit` |
| **ai** | libs/ai | — (source-only) | — | — | — | `tsc --noEmit` |

\* Production serving for all 4 Next apps is the standalone `node server.js` inside Docker (R3 cross-cutting); the `serve` target's `next start` is dev-convenience only. The libs have **no build target** (consumed as raw TS — R2 §6, R3). Only cms has `test`; only worker has a real compile `build`. Mark `worker.build` with `"outputs": ["{projectRoot}/dist"]` for cache correctness.

Example (`apps/cms/project.json`):
```jsonc
{
  "name": "cms", "root": "apps/cms", "projectType": "application",
  "targets": {
    "build":      { "executor": "nx:run-commands", "options": { "command": "next build", "cwd": "apps/cms" }, "outputs": ["{projectRoot}/.next"] },
    "serve":      { "executor": "nx:run-commands", "options": { "command": "next dev", "cwd": "apps/cms" } },
    "test":       { "executor": "nx:run-commands", "options": { "command": "jest", "cwd": "apps/cms" } },
    "lint":       { "executor": "nx:run-commands", "options": { "command": "eslint", "cwd": "apps/cms" } },
    "type-check": { "executor": "nx:run-commands", "options": { "command": "tsc --noEmit", "cwd": "apps/cms" } }
  }
}
```

---

## 6. Config Rewrites — exhaustive checklist (cite file:line from R1)

> Rule (R1 cross-cutting #4): scope replacements to PATH/DIR/CONTAINER/NETWORK contexts only. **Never** touch Mongo db `cptsd-cms`/`cptsd-journal`, Postgres `cptsd_cms`, `S3_BUCKET_NAME=cptsd-cms`, or `@cptsd/*` import specifiers. No blind `s/cptsd-cms/cms/g`.

### Dockerfiles (DIR `cptsd-X/`→`apps/X`, `packages/*`→`libs/*`; switch copy-hack→pnpm symlink)
- **apps/main/Dockerfile** — L10 `COPY cptsd-main/package*` → `apps/main/`; L19 `COPY cptsd-main/ .`; L21 `packages/db`→`libs/db`; L22 `packages/pets`→`libs/pets`; L9 comment. Build context stays repo root. Replace the symlink/copy step to use pnpm workspace install.
- **apps/blog/Dockerfile** — L10, L19 `cptsd-blog-public/`→`apps/blog/`; L21 `libs/db`; L22 `libs/pets`; L9 comment. Keep the `public`-shim shell step (R3).
- **apps/cms/Dockerfile** — L10, L19 `cptsd-cms/`→`apps/cms/`; L21 `libs/db`; L9 comment. Preserve all build ARGs/ENV (R3).
- **apps/journal/Dockerfile** — L9 `COPY apps/cptsd-journal/package*`→`apps/journal/`; L10 `packages/db`→`libs/db`; L11 `packages/ai`→`libs/ai`; L20 `COPY apps/cptsd-journal .`→`apps/journal`; L21 `libs/db`; L22 `libs/ai`. Uses `npm install` (R3) → switch to pnpm. In-image dest `./packages/*` may stay or move to `./libs/*` consistently.
- **apps/worker/Dockerfile** — L8 `services/worker/package*`→`apps/worker/`; L9/L18/L29 `packages/db`→`libs/db`; L10/L19/L30 `packages/ai`→`libs/ai`; L17 `COPY services/worker ./services/worker`→`apps/worker`; L20 `WORKDIR /app/services/worker`→`/app/apps/worker`; L27 `COPY --from=builder /app/services/worker/dist`→`/app/apps/worker/dist`.

### Jenkinsfiles
- **apps/cms/Jenkinsfile** — L6 `DEPLOY_PATH '/opt/cptsd-cms'`→`/opt/cms`; L33/L72 `dir('cptsd-cms')`→`dir('apps/cms')`; L90 `cp -r cptsd-cms/*`→`apps/cms/*`; L123 `docker rm -f cptsd-cms-app-1 cptsd-cms-minio-1 cptsd-cms-mongodb-1`→`cms-app-1 cms-minio-1 cms-mongodb-1`. Keep `APP_NAME='cptsd-cms'` (job name, out of scope). Make health gate blocking (see §7).
- **apps/blog/Jenkinsfile** — L6 `/opt/cptsd-blog-public`→`/opt/blog`; L33/L55 `dir('cptsd-blog-public')`→`dir('apps/blog')`; L73 `cp -r cptsd-blog-public/*`→`apps/blog/*`; L97 `docker rm -f cptsd-blog-public-app-1`→`blog-app-1`. Keep `DOMAIN='blog.cptsd.in'`, `APP_NAME`.
- **apps/main/Jenkinsfile** — L6 `/opt/cptsd-main`→`/opt/main`; L22 `dir('cptsd-main')`→`dir('apps/main')`; L34/L71 image `cptsd-main:latest`→`main:latest`; L52 `docker rm -f cptsd-main-app`→`main-app`; L61 `--name cptsd-main-app`→`main-app`; **L62 `--network cptsd-cms_app-network`→`cptsd_net`**; L74 `--filter name=cptsd-main-app`→`main-app`; L99 `docker logs cptsd-main-app`→`main-app`. Keep build `--network=host` (Google Fonts, R4 §3).

### Compose files
- **apps/cms/docker-compose.yml** — L8 `dockerfile: cptsd-cms/Dockerfile`→`apps/cms/Dockerfile`; **L149-151 add `name: cptsd_net`** to the `app-network` def (network-rename source, R1 #1). Leave Mongo URI/S3/`MONGO_INITDB_DATABASE` (DATA).
- **apps/cms/docker-compose.prod.yml / .atlas.yml / Makefile** — no DIR/PATH/CONTAINER/NETWORK hits (R1); leave.
- **apps/main/docker-compose.yml** — L8 `dockerfile: cptsd-main/Dockerfile`→`apps/main/Dockerfile`; L15 `- /opt/cptsd-main/.env`→`/opt/main/.env`; L18 comment; **L59 `name: cptsd-cms_app-network`→`cptsd_net`**.
- **apps/main/docker-compose.local.yml** — only Mongo URI (DATA); leave.
- **apps/blog/docker-compose.yml** — L8 `dockerfile: cptsd-blog-public/Dockerfile`→`apps/blog/Dockerfile`; **L52 `name: cptsd-cms_app-network`→`cptsd_net`**.
- **apps/blog/docker-compose.prod.yml** — no hits; but verify `ports: []` discrepancy on box (R4 §3 risk) before cutover — do not "fix" blindly here.
- **apps/journal/docker-compose.yml** — L8 `dockerfile: apps/cptsd-journal/Dockerfile`→`apps/journal/Dockerfile`; L67 `dockerfile: services/worker/Dockerfile`→`apps/worker/Dockerfile`. Leave its own `app-network` (L53/81/112/128-130, decision 3e) and Mongo db name (DATA).
- **docker-compose.jenkins.yml** (root) — L16 `/opt/cptsd-cms:/opt/cptsd-cms`→`/opt/cms:/opt/cms`; L17 `/opt/cptsd-blog-public…`→`/opt/blog…`; L18 `/opt/cptsd-main…`→`/opt/main…`; **L39 `name: cptsd-cms_app-network`→`cptsd_net`**.

### Scripts (deploy/Jenkins automation — R1 scripts §)
- **apps/journal/scripts/setup-env.sh** — L9 `CMS_DIR="../../cptsd-cms"`→`"../cms"` (now both under `apps/`); Mongo strings DATA.
- **apps/journal/scripts/setup-caddy.sh** — no rename hits (domain+port only). Verify still appends `ai.cptsd.in → localhost:3003` (R4 §1).
- **apps/worker/start.sh** — L18/L20 `../../apps/cptsd-journal/.env.local`→`../journal/.env.local` (worker now `apps/worker`, journal now `apps/journal` → sibling, `../journal`); L24 `sed 's/cptsd-cms/cptsd-journal/g'` is DATA (db-name rewrite) — **leave**.
- **apps/cms/scripts/deploy-simple.sh** — L8 `/opt/cptsd-cms`→`/opt/cms`; L46 local dev path cosmetic; L57-62 artifact filename cosmetic; Mongo/S3 DATA.
- **apps/cms/scripts/deploy-cx23-remote.sh** — L10 `/opt/cptsd-cms`→`/opt/cms`; rest cosmetic/DATA.
- **apps/cms/scripts/setup-domain.sh** — L8 `/opt/cptsd-cms`→`/opt/cms`.
- **apps/cms/scripts/fix-admin-user.sh** — L115 `docker cp … cptsd-cms_app_1:`→`cms_app_1:` (CONTAINER).
- **apps/cms/scripts/{setup-ssh-first,manual-ssh-setup,fix-password-and-setup}.sh**, **DEPLOY_NOW.md** — SSH key comments cosmetic; DEPLOY_NOW PATH lines `/opt/cptsd-cms`→`/opt/cms` (L53,66,109-123); L35 local dev path.
- **apps/cms/scripts/{deploy-hetzner,update-hetzner,quick-deploy,setup-hetzner-volumes}.sh** — no rename hits (R1).
- **scripts/setup-jenkins.sh** — L10 `CMS_PATH="/opt/cptsd-cms"`→`/opt/cms`; L11 `BLOG_PATH="/opt/cptsd-blog-public"`→`/opt/blog`; **L49 `docker network create cptsd-cms_app-network`→`cptsd_net`**; L158-159 `Script Path` `cptsd-cms/Jenkinsfile`→`apps/cms/Jenkinsfile`, `cptsd-blog-public/Jenkinsfile`→`apps/blog/Jenkinsfile` (keep job names).
- **scripts/setup-jenkins-jobs.sh** — L228-229 `create_job "cptsd-cms" "cptsd-cms/Jenkinsfile"`→ Script Path `apps/cms/Jenkinsfile`; blog →`apps/blog/Jenkinsfile` (keep 1st arg job name).
- **scripts/deploy-all.sh** — L66 `deploy_app "cptsd-cms" "./cptsd-cms" "/opt/cptsd-cms"`→ `"./apps/cms" "/opt/cms"`; L69 blog→`"./apps/blog" "/opt/blog"`; L74-79 PATH refs `/opt/cptsd-cms`→`/opt/cms`, `/opt/cptsd-blog-public`→`/opt/blog`.
- **scripts/sync-remote-env-to-jenkins.sh / setup-jenkins-env.sh / update-jenkins-env.sh** — `APP_DIR="cptsd-cms"`→`apps/cms`, `"cptsd-blog-public"`→`apps/blog` (DIR); `DEPLOY_PATH` `/opt/cptsd-cms`→`/opt/cms`, `/opt/cptsd-blog-public`→`/opt/blog` (PATH). (sync L16/17/19/20; setup-jenkins-env L20/22/46/48; update-jenkins-env L21/23/99/108/127/130.) Keep `JOB_NAME` defaults.
- **scripts/{add-env-to-jenkins-global,automatically-add-env-to-jenkins,execute-groovy-to-add-env}.sh** — `DEPLOY_PATH` `/opt/cptsd-blog-public`→`/opt/blog`, `/opt/cptsd-cms`→`/opt/cms` (PATH). Keep `JOB_NAME`.
- **scripts/add-env-to-jenkins.groovy** — Mongo/S3 are DATA → **leave**.
- **scripts/{check-jenkins-builds,setup-all,configure-jenkins-webhook,trigger-build}.sh** — only JOB names → leave (jobs out of scope).
- Other `scripts/*.sh` (check-dns, fix-jenkins-github-ssh, etc.) — no hits (R1).

### Caddy
- No checked-in Caddyfile (R4 §1). Generators: `scripts/setup-domains.sh` (base blocks, ports only — no rename) and `apps/journal/scripts/setup-caddy.sh` (ai.cptsd.in→3003, no rename). **No rename edits needed**, but cutover edits the live `/etc/caddy/Caddyfile` upstreams (§7). Note `blog.cptsd.in` block is hand-added on the box, not in repo (R4 §1) — back up live file.

### Docs / README
- **README.md** (root), **apps/cms/README.md**, **DEPLOY.md**, **docs/DEPLOYMENT_SETUP.md** — rewrite all `/opt/cptsd-cms`→`/opt/cms`, `/opt/cptsd-blog-public`→`/opt/blog`, `/opt/cptsd-main`→`/opt/main` (PATH); `cptsd-cms/Jenkinsfile`/`cptsd-blog-public/Jenkinsfile` Script-Path lines → `apps/*`; tree/DIR lines; `docker network ls | grep cptsd` still matches `cptsd_net` (DEPLOYMENT_SETUP:192). Keep job names + DATA strings.
- **apps/journal/README.md** — L20-23 `apps/cptsd-journal/`→`apps/journal/`, `services/worker/`→`apps/worker/`, `packages/db`→`libs/db`, `packages/ai`→`libs/ai`; L59 `cd apps/cptsd-journal`→`apps/journal`; L84 `cd services/worker`→`apps/worker`.
- **apps/worker/README.md** — L12 `cd services/worker`→`apps/worker`; `cptsd-journal` db strings DATA.
- **apps/cms/README-CX23.md / README-HETZNER.md** — `cptsd-cms` clone-dir / `/opt/cptsd-cms`→`/opt/cms`.

### Item-2 hygiene
- `git rm --cached` (then delete) the 10MB `stitch_*.zip` (locate at impl: `git ls-files | grep stitch`); add to `.gitignore`.
- Scrub real-looking creds in on-disk `.env*.example` (e.g. `apps/cms/.env.local.example` `DATABASE_URL` password, any `changeme`/keys) → placeholders. **Keep db-name/bucket identifiers** (`cptsd_cms`, `cptsd-cms`) — those are not secrets and stay (R1 DATA).

---

## 7. Prod Cutover Runbook (low-downtime, ordered)

Constraints driving this (R4 §"Constraints"): Caddy is a **host systemd** service proxying fixed `localhost` ports; you cannot run old+new of the same app on the same host port; the shared network must exist before main/blog/jenkins; Mongo/MinIO are single self-hosted with named volumes — **do not** tear down the cms stack while main/blog run, and do not touch the volumes.

**Pre-flight (on box, before any change):**
1. `cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%s)` — captures the hand-added `blog.cptsd.in` block (R4 §1).
2. `docker ps` + `ss -ltnp` — confirm live ports 3000/3001/3002/3003, and resolve the blog `ports: []` question (R4 §3 risk): confirm 3001 is actually published.
3. Snapshot current container names/network: `docker network inspect cptsd-cms_app-network`. Record the pre-Nx git commit SHA (rollback target).
4. Confirm Mongo volumes `mongodb_data`/`mongodb_config` and `minio_data` exist and are untouched by this work.

**Network step (do first, additively):**
5. `docker network create cptsd_net` (new neutral net). Connect the running Mongo/MinIO/cms containers to **both** old and new nets temporarily so new app containers can reach `mongodb:27017` over `cptsd_net`: `docker network connect cptsd_net cptsd-cms-mongodb-1` (and cms-app, minio). This avoids a Mongo restart.

**Per app, one at a time (cms → main → blog → journal), blue/green by alternate port:**
6. Build new image from the restructured tree (Jenkins job pointed at new `apps/X/Jenkinsfile`, or manual `docker build`). Tag e.g. `main:latest`.
7. Start the **new** container on a **temporary alternate host port** (e.g. main on `3102:3002`), `--network cptsd_net`, same env/Mongo URI. Old container keeps serving the real port.
8. **Blocking health gate** (R4 §4 — pipelines are non-blocking today; add a retry loop): poll the new container's endpoint until 200 or timeout:
   - cms `/api/init`, main `/`, blog `/`, journal `/api/auth/signin`.
   Example: `for i in $(seq 1 30); do curl -fsS http://localhost:3102/ && break; sleep 2; done` — fail the cutover if it never passes.
9. Stop the new temp container; restart it bound to the **real** host port (now that it's proven), OR keep temp port and **repoint Caddy**: edit `/etc/caddy/Caddyfile` upstream `reverse_proxy localhost:3002`→`localhost:3102`, `caddy validate`, `systemctl reload caddy` (graceful reload — R4 §"Constraints" 1a). Recommended: prove on temp port (step 8), then `docker rm -f` old container, start new on the canonical port, reload Caddy back to canonical port. This keeps the steady-state Caddyfile unchanged.
10. **Drain/stop old:** `docker rm -f <old cptsd-X container>` only after the new one serves the canonical port and health passes.
11. Verify: `curl -fsS https://<domain>/` through Caddy (real public path).
12. Repeat 6–11 for the next app. **cms first** is fine because Mongo/MinIO containers are not replaced — only the cms `app` container swaps; the shared net `cptsd_net` already carries Mongo (step 5). Never run `docker-compose down` on the full cms stack (would `docker network rm` and kill Mongo — R4 §"Constraints" 2); swap only the `app` service or use the alternate-port pattern.

**Finalize network:**
13. Once all apps run on `cptsd_net` and old containers are gone, disconnect Mongo/MinIO/cms from the old `cptsd-cms_app-network` and `docker network rm cptsd-cms_app-network`.

**Caddy steady state:** upstream ports are unchanged (3000-3003 locked), so the final Caddyfile equals the backup. The only Caddyfile edits are transient (alternate-port during health-gate) and reverted.

**ROLLBACK (clean, to pre-Nx commit):**
- Code: `git checkout <pre-Nx SHA>` (the restructure lands in an isolated worktree on a branch; prod `/opt/*` dirs and Jenkins are only touched at cutover). 
- Runtime: re-run the **old** Jenkins pipelines (still referencing `/opt/cptsd-X`, old container names, `cptsd-cms_app-network`) from the pre-Nx commit → they rebuild old-named containers on the old net. Because we never deleted the Mongo/MinIO volumes and never removed `cptsd-cms_app-network` until step 13, rollback before step 13 is a redeploy of the old commit; rollback after step 13 additionally runs `docker network create cptsd-cms_app-network` first.
- Caddy: `cp /etc/caddy/Caddyfile.bak.<ts> /etc/caddy/Caddyfile && systemctl reload caddy`.
- The exact rollback command set is committed alongside the runbook so a session boundary mid-cutover can resume or revert deterministically.

---

## 8. Verification Plan

**Local (in the isolated worktree, before any prod step):**
1. Clean nested-copy pollution `libs/db/db…` (R2 §1); `git rm` stray lockfiles.
2. `pnpm install` at root — must produce one `pnpm-lock.yaml` and symlink `node_modules/@cptsd/{db,pets,ai}` into `libs/*` (verify `ls -l` shows symlinks, not copied dirs — proves copy-hack is gone).
3. `nx run-many -t type-check` — all 8 projects (libs + main/cms/journal/worker; blog has none).
4. `nx run-many -t build` — main/blog/cms/journal (`next build` standalone) + worker (`tsc`→`dist`). Libs have no build (skipped). Confirms `@cptsd/*` resolves via workspace, webpack-alias removal didn't break bundling, and `tsconfig.base.json` paths work.
5. `nx test cms` — jest/jsdom suite green (only unit with tests, R3).
6. `nx run-many -t lint` — main/blog/cms (`eslint`), journal (`eslint .`).
7. Per-unit smoke (local): `nx serve main` (3002), `blog` (3001), `cms` (3000), `journal` (3003), `worker` (`node dist/index.js` boots) — each starts and responds on its port.
8. Docker build smoke: build each app/worker image from the rewritten Dockerfiles locally; confirm `node server.js` (Next) / `node dist/index.js` (worker) starts and the symlinked libs resolve at runtime.

**Prod (post-cutover, per app):**
9. Through Caddy (public): `curl -fsS https://cms.cptsd.in/api/init`, `https://cptsd.in/`, `https://blog.cptsd.in/`, `https://ai.cptsd.in/api/auth/signin`, `https://storage.cptsd.in/minio/health/live` — all 200/expected (R4 §1, §4 endpoints).
10. `docker ps` shows new names `cms-app-1`, `main-app`, `blog-app-1`, `journal-app-1` on `cptsd_net`; old `cptsd-*` names gone.
11. `docker network inspect cptsd_net` lists all apps + mongo + minio + jenkins; `cptsd-cms_app-network` removed.
12. Mongo/MinIO unchanged: `docker exec cms-mongodb-1 mongosh --eval 'db.adminCommand("ping").ok'`; volume names intact.

---

## 9. Risks & Checkpoints (commit boundaries)

Work in an isolated git worktree on a feature branch (R user constraint); each step is independently functional and committed so a session boundary never lands mid-cutover.

| # | Checkpoint commit | Why it's a safe boundary | Key risk addressed |
|---|---|---|---|
| C0 | Pre-Nx baseline (rollback target) — tag it | The clean revert point; nothing changed yet | Rollback determinism |
| C1 | Item-2 hygiene: `git rm stitch_*.zip`, scrub `.env*.example` | Pure deletions/scrubs; builds unaffected | Smallest, reversible first step |
| C2 | `git mv` all dirs to `apps/*`/`libs/*` + clean `libs/db/db…` nested copies | Tree-only move; tooling added next; repo still builds under old per-unit installs if needed | R2 §1 pollution; history preserved |
| C3 | Add root `package.json`+`pnpm-workspace.yaml`+`nx.json`+`tsconfig.base.json`+per-unit `project.json`; delete `postinstall`; drop stray lockfiles; per-unit `extends`/alias edits | `pnpm install` + `nx run-many build/type-check/test` all green locally (§8) — the **functional gate** before touching any deploy file | Copy-hack→symlink correctness; R2 §3 resolution divergence; lockfile unification |
| C4 | Rewrite all Dockerfiles + compose `dockerfile:` + network `name: cptsd_net` definition/pins | Docker images build locally (§8.8); compose validates | R1 #1 network derivation break — the highest prod-break risk |
| C5 | Rewrite Jenkinsfiles (DEPLOY_PATH, dir, container `rm -f` lists, `--network`, image tags) + `scripts/*` + `docker-compose.jenkins.yml` + docs | All deploy automation now consistent; nothing executed yet | R1 #2/#3 (hardcoded container lists, Script Path/dir) |
| C6 | Per-app prod cutover (one commit/checkpoint **per app** after its health gate passes) | Each app's blue/green is atomic; if a boundary hits between apps, the others are already cut over and healthy, the rest still serve from old containers on the still-present `cptsd-cms_app-network` | R4 §"Constraints" 1 (fixed-port Caddy), 2 (don't kill shared net) |
| C7 | Finalize: remove old `cptsd-cms_app-network`, revert transient Caddyfile edits | Steady state reached; backup retained | Clean teardown |

**Top risks to call out for the user before approval:**
- **Network derivation (R1 #1):** the single most likely silent breakage. The explicit `name: cptsd_net` on cms's network def (C4) is the linchpin — without it the cms dir rename alone breaks every joiner.
- **Hard-cutover pipelines (R4 §3):** current Jenkins does `rm -f`/`down` *before* starting new → downtime. The runbook (§7) changes this to alternate-port + blocking health gate + graceful Caddy reload. This is a behavior change to the pipelines, flagged for user sign-off.
- **Blog `ports: []` discrepancy (R4 §3):** verify on box at pre-flight; if 3001 is published by some out-of-band mechanism, the cutover must reproduce it.
- **Mongo/MinIO are single self-hosted with named volumes (R4 §5):** never in scope to move/delete; cutover swaps only app containers and bridges Mongo onto `cptsd_net` additively (step 5) to avoid a DB restart.
- **Worker `node16`/CJS path resolution (R2 §3):** the one consumer that isn't a Next bundler; verify `tsconfig.base.json` paths compile under worker's `module:CommonJS, moduleResolution:node16` at C3, with a local `paths` override as fallback.
- **Jenkins JOB names kept as-is (decision, scope boundary):** only Script-Path/dir/path/container/network change; if the user wants jobs renamed too, that's sub-project B (console + webhook churn).

---

This synthesizes R1 (blast radius / rename inventory), R2 (workspace + `@cptsd/*` resolution mechanics), R3 (per-unit Nx targets/ports/build tools), R4 (prod topology / cutover constraints). Ready for user review → `/writing-plans`.