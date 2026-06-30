# Prod cutover — outcome + CI/CD reconciliation follow-ups (2026-06-30)

The Nx restructure (A) was deployed to prod for **main + cms**. This records what actually
happened, the prod topology that the original design got wrong, and the work still required
before the next deploy is safe.

## What is live now (verified)

- `https://cptsd.in/` → 200 (main), `https://cms.cptsd.in/` → 307 login (cms), `https://blog.cptsd.in/` → 200.
- Containers on `cptsd_net`: `main-app`, `cms-app-1`, `cms-mongodb-1` (healthy), `cms-minio-1` (healthy).
- **Mongo/MinIO data preserved** — the compose volumes were pinned to the existing prod volume
  names (`cptsd-cms_mongodb_data` / `_mongodb_config` / `_minio_data`, commit `8503d1d`). Verified:
  resources=14, generatedassets=16, stories=1.
- Old `cptsd-*` containers removed; old images retagged `main|cms|blog:latest`; old `/opt/cptsd-*`
  dirs kept as backup.

## The topology the design got wrong

- **The reverse proxy is Pangolin (pangolin ee + gerbil + Traefik v3.6), NOT Caddy.** Caddy is a
  stopped systemd unit (dead since May) — a red herring left on disk. Ignore the Caddyfile.
- **Pangolin routes each domain to a hard-coded container IP** on the `cptsd-cms_app-network`
  bridge (stored in Pangolin's sqlite `targets` table, `/app/config/db/db.sqlite`). Current targets:
  - `cptsd.in` → `172.18.0.2:3002` (main-app)
  - `cms.cptsd.in` → `172.18.0.3:3000` (cms-app-1)  *(was .6; updated during cutover)*
  - `blog.cptsd.in` → `172.18.0.2:3002` (repointed to main — blog merged into main)
- The app containers are on **both** `cptsd_net` (for mongo/inter-service) and
  `cptsd-cms_app-network` (so Pangolin/Traefik can reach them).
- Pangolin DB backups before each edit: `/root/pang-backup-*.sqlite`. To change a target, edit the
  `targets` row, restart `pangolin`, then **restart `traefik`** (it caches the resolved target).

## Routing stability — FIXED 2026-06-30 (name-based targets)

The original fragility (Pangolin pinned **container IPs**, so any redeploy that recreated an app
shuffled its IP → 502) is resolved:

- **Pangolin targets now use container NAMES, not IPs**: `cms.cptsd.in → cms-app-1:3000`,
  `cptsd.in → main-app:3002`, `blog.cptsd.in → main-app:3002`. Traefik resolves these via Docker DNS.
- **gerbil was connected to `cptsd_net`** (Traefik shares gerbil's net namespace), so name resolution
  works on `cptsd_net` — where the new Jenkins deploys place the apps.
- **Verified:** force-recreated `cms-app` (now on `cptsd_net` only, like a Jenkins deploy) → routing
  self-healed with zero Pangolin changes (`cms.cptsd.in` stayed 307).

Requirement that keeps this stable: the deploy must keep the **same container names** (`cms-app-1`
from compose project `cms`; `main-app` from `docker run --name main-app`) on a network gerbil shares
(`cptsd_net`). The new Jenkinsfiles already do this. If a unit is ever renamed, update its Pangolin
target name to match.

## Jenkins / branch reconciliation (done 2026-06-30/07-01)

- `chore/nx-restructure-a` merged → `main` and pushed (the branch was strictly ahead of
  `origin/main` `bf57c84`, clean fast-forward).
- Jenkins job Script Paths updated: `cptsd-cms` → `apps/cms/Jenkinsfile`, `cptsd-main` →
  `apps/main/Jenkinsfile`. `cptsd-blog-public` **disabled** (blog merged into main).
- Routing stability handled separately by the name-based Pangolin targets above (no static-IP work
  needed) — new Jenkins deploys keep the same container names on `cptsd_net`, which gerbil/Traefik
  resolve by DNS.

### Jenkins CI/CD — VALIDATED end-to-end 2026-07-01

The attended first deploy is done. cms (`#73`) and main (`#39`) both build the new Dockerfiles,
deploy, and pass the health check — now running freshly Jenkins-built images (`cms:048d635`,
`main:c0b791d`), data intact, all domains green. Fixing it surfaced **six pre-existing CI breakages**
(none caused by the restructure), all now fixed in the Jenkinsfiles/Dockerfiles:

1. `docker-compose` v1 calls → `docker compose` v2 (box dropped v1 ~3 months ago).
2. Jenkins container had **no compose plugin** — installed v2 at
   `/usr/local/lib/docker/cli-plugins/docker-compose` in the jenkins container (NOT in the
   jenkins_home volume, so a jenkins **container recreation** loses it — reinstall or bake into an image).
3. Dockerfiles didn't `COPY tsconfig.base.json` → `next build` failed on the `extends`. Added to cms/blog/main.
4. main/journal Dockerfiles **flattened** `apps/X`→`/app`, breaking the extends + libs paths. main
   rewritten to the nested layout (journal not deployed — fix it the same way before deploying journal).
5. Test stage used `--volumes-from jenkins` (exposed docker socket + secrets → privilege escalation).
   **Removed**; tests run at pre-commit. Re-add CI tests as a Dockerfile `--target test` if wanted.
6. Health check curled `localhost:PORT` (DinD: jenkins localhost ≠ host) → now `https://${DOMAIN}/`.

Rollback if ever needed: old images are still tagged (`cms:latest`/`main:latest` were retagged to the
prior working images before these rebuilds overwrote them — re-pull/rebuild a known-good commit).

Optional: replace the `blog.cptsd.in`→main proxy with a proper 301 redirect to `https://cptsd.in/blog`
(Traefik redirect middleware) instead of serving the main site at the blog host.

## Rollback (if needed)

- Apps: old images retagged are still present; old `/opt/cptsd-*` dirs intact; mongo volumes never
  deleted. Re-create old-named containers on `cptsd-cms_app-network` to restore the pre-cutover state.
- Pangolin: restore `/root/pang-backup-*.sqlite` → `pangolin:/app/config/db/db.sqlite`, restart
  pangolin + traefik.
