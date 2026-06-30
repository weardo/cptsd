#!/usr/bin/env bash
# bin/lib.sh — shared release helpers. SOURCE this file; do not execute it.
# The single place manifest parsing + Jenkins triggering lives, so the bin/
# commands stay thin and consistent.
set -euo pipefail

BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$BIN_DIR/.." && pwd)"
MANIFEST_DIR="$REPO_ROOT/manifest"

# Deployable units → Jenkins job name. "manual" = no CI job; deploy is printed,
# not triggered (journal/worker deploy by hand on the box today).
UNITS=(
  "main:cptsd-main"
  "blog:cptsd-blog-public"
  "cms:cptsd-cms"
  "journal:manual"
  "worker:manual"
)

die()  { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { printf '%s\n' "$*" >&2; }

unit_job() {
  local u="$1" pair
  for pair in "${UNITS[@]}"; do
    if [ "${pair%%:*}" = "$u" ]; then printf '%s\n' "${pair#*:}"; return 0; fi
  done
  return 1
}

is_unit() { unit_job "$1" >/dev/null 2>&1; }

manifest_path() {
  case "$1" in
    prod|stage) printf '%s\n' "$MANIFEST_DIR/$1.lock" ;;
    *) die "unknown env '$1' (use: prod | stage)" ;;
  esac
}

# norm_sha <commit-ish> -> 7-char sha, validating the commit exists locally.
norm_sha() {
  git -C "$REPO_ROOT" rev-parse --short=7 "$1^{commit}" 2>/dev/null \
    || die "not a valid commit: '$1'"
}

# read_pin <env> <unit> -> prints the pinned sha (empty if unset)
read_pin() {
  local file; file="$(manifest_path "$1")"
  awk -v u="$2" '$1==u {print $2; f=1} END{exit !f}' "$file" 2>/dev/null || true
}

# set_pin <env> <unit> <sha> -> rewrite (or append) that unit's line, preserving the rest
set_pin() {
  local env="$1" unit="$2" sha="$3" file tmp
  is_unit "$unit" || die "unknown unit '$unit' (one of: $(list_units))"
  file="$(manifest_path "$env")"
  [ -f "$file" ] || die "no manifest: $file"
  tmp="$(mktemp)"
  if grep -qE "^${unit}[[:space:]]" "$file"; then
    awk -v u="$unit" -v s="$sha" '$1==u{printf "%-8s %s\n", u, s; next}{print}' "$file" > "$tmp"
  else
    cp "$file" "$tmp"; printf '%-8s %s\n' "$unit" "$sha" >> "$tmp"
  fi
  mv "$tmp" "$file"
}

# each_unit <env> -> "unit sha" lines (comments/blanks stripped)
each_unit() {
  local file; file="$(manifest_path "$1")"
  [ -f "$file" ] || die "no manifest: $file"
  grep -vE '^[[:space:]]*(#|$)' "$file"
}

list_units() {
  local pair out=""
  for pair in "${UNITS[@]}"; do out="$out ${pair%%:*}"; done
  printf '%s\n' "${out# }"
}

# load_config — host-only Jenkins creds from bin/.deployrc (never committed).
load_config() {
  local rc="$BIN_DIR/.deployrc"
  [ -f "$rc" ] || die "missing $rc — copy bin/.deployrc.example and fill it in (host-only secret)"
  # shellcheck disable=SC1090
  . "$rc"
  : "${JENKINS_URL:?set JENKINS_URL in bin/.deployrc}"
  : "${JENKINS_USER:?set JENKINS_USER in bin/.deployrc}"
  : "${JENKINS_TOKEN:?set JENKINS_TOKEN in bin/.deployrc}"
}

# Tiny JSON readers (no jq dep, no eval — fixed field access only).
_queue_num()    { python3 -c 'import sys,json; print(json.load(sys.stdin).get("executable",{}).get("number","") or "")'; }
_build_result() { python3 -c 'import sys,json; print(json.load(sys.stdin).get("result") or "")'; }

# trigger_job <job> <sha> — kick Jenkins buildWithParameters DEPLOY_SHA=<sha>,
# then poll the queue item → build → result. Returns non-zero on FAILURE/abort.
# (Jenkins API tokens are crumb-exempt for POST, so no CSRF crumb needed.)
trigger_job() {
  local job="$1" sha="$2"
  load_config
  local auth="$JENKINS_USER:$JENKINS_TOKEN" base="${JENKINS_URL%/}/job/${job}"
  local qurl
  qurl="$(curl -fsS -u "$auth" -X POST \
            "${base}/buildWithParameters?DEPLOY_SHA=${sha}" -D - -o /dev/null \
          | awk 'tolower($1)=="location:"{print $2}' | tr -d '\r')" \
    || die "failed to trigger Jenkins job '$job'"
  [ -n "$qurl" ] || die "no queue Location header from Jenkins for '$job'"
  note "queued $job @ $sha"

  # queue item -> build number
  local num="" tries=0
  while [ -z "$num" ] && [ "$tries" -lt 60 ]; do
    num="$(curl -fsS -u "$auth" "${qurl%/}/api/json" | _queue_num 2>/dev/null || true)"
    [ -n "$num" ] && break
    tries=$((tries+1)); sleep 3
  done
  [ -n "$num" ] || die "Jenkins build for '$job' never started (still queued)"
  note "  building #$num — ${base}/${num}/console"

  # poll build result
  local result="" rtries=0
  while [ -z "$result" ] && [ "$rtries" -lt 200 ]; do
    result="$(curl -fsS -u "$auth" "${base}/${num}/api/json" | _build_result 2>/dev/null || true)"
    [ -n "$result" ] && break
    rtries=$((rtries+1)); sleep 6
  done
  case "$result" in
    SUCCESS) note "  ✓ $job #$num SUCCESS"; return 0 ;;
    "")      die "timed out waiting for '$job' #$num" ;;
    *)       die "'$job' #$num finished $result — see ${base}/${num}/console" ;;
  esac
}
