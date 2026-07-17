#!/usr/bin/env bash
# Runs ON oracle-a (from /opt/cptsd-repo) — builds + restarts the deployed
# cptsd apps (main + cms) as arm64, decrypting their SOPS secrets on-box.
# Next apps need the prod env as --build-args (else /_not-found prerender fails).
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
cd /opt/cptsd-repo

build_args() {  # emit NUL-separated --build-arg KEY=VAL from an env file
  local f="$1" a=()
  while IFS= read -r l; do case "$l" in ''|\#*) continue;; esac; a+=(--build-arg "$l"); done < "$f"
  printf '%s\0' "${a[@]}"
}

deploy() {  # <app> <secrets.enc.env> <port>
  local app="$1" enc="$2" port="$3" env="/tmp/$app.env"
  sops -d "$enc" > "$env"
  mapfile -d '' A < <(build_args "$env")
  echo "==> build $app"
  docker build -f "apps/$app/Dockerfile" "${A[@]}" -t "$app:latest" .
  docker rm -f "$app" 2>/dev/null || true
  docker run -d --name "$app" --network edge -p "127.0.0.1:$port:$port" \
    --env-file "$env" --restart unless-stopped "$app:latest"
  rm -f "$env"
  sleep 6
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/" || echo 000)
  echo "$app health: HTTP $code"
  case "$code" in 2*|3*) : ;; *) echo "$app UNHEALTHY"; exit 1 ;; esac
}

deploy cms  apps/cms/secrets.enc.env  3000
deploy main apps/main/secrets.enc.env 3002
echo "cptsd deploy OK"
