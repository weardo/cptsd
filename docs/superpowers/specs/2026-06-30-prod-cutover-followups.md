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

## ⚠️ Critical fragility — DO NOT redeploy via Jenkins until this is fixed

Pangolin pins **container IPs**. Any redeploy that recreates `main-app`/`cms-app-1` will give it a
new IP → Pangolin 502s the domain until its target is updated. Today's containers work because their
IPs happen to match the targets; the **next** `docker run`/`compose up` will not.

**Fix (pick one) before re-enabling Jenkins deploys:**
1. **Static IPs (recommended).** Give the proxy network an explicit subnet and assign each app a
   fixed `ipv4_address` in its compose/`docker run`, matching the Pangolin target. Then every deploy
   reuses the same IP and Pangolin never breaks. (Requires recreating `cptsd-cms_app-network` with a
   subnet, or moving ingress onto `cptsd_net` with a subnet — coordinate with gerbil/jenkins which
   also sit on that network.)
2. **Post-deploy target sync.** Add a deploy step that reads the new container IP and updates the
   Pangolin target (API or DB) + reloads Traefik. Brittle; prefer (1).

## Jenkins / branch reconciliation (still TODO)

1. **Merge** `chore/nx-restructure-a` → `main` (the box is already running the new structure; main
   should reflect it).
2. **Update the 3 Jenkins jobs' Script Path** → `apps/cms/Jenkinsfile`, `apps/blog/Jenkinsfile`,
   `apps/main/Jenkinsfile` (they still point at the old `cptsd-*/Jenkinsfile` paths). Jenkins UI or
   `scripts/setup-jenkins-jobs.sh`.
3. **Make the new Jenkinsfiles attach the proxy network + static IP** (per the fix above), or each CI
   deploy will re-break Pangolin routing.
4. **blog**: no Jenkins job needed — it is merged into main. Consider removing the `cptsd-blog-public`
   job and, if desired, replacing the `blog.cptsd.in`→main proxy with a proper 301 redirect to
   `https://cptsd.in/blog` (Traefik redirect middleware).

## Rollback (if needed)

- Apps: old images retagged are still present; old `/opt/cptsd-*` dirs intact; mongo volumes never
  deleted. Re-create old-named containers on `cptsd-cms_app-network` to restore the pre-cutover state.
- Pangolin: restore `/root/pang-backup-*.sqlite` → `pangolin:/app/config/db/db.sqlite`, restart
  pangolin + traefik.
