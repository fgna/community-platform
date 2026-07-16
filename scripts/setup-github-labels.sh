#!/usr/bin/env bash
# setup-github-labels.sh — create the label taxonomy the issue templates
# reference (type:*, priority:*, size:*, area:*) so new issues aren't left
# pointing at labels that don't exist yet (see BACKLOG.md GH-006).
#
# Requires the GitHub CLI (https://cli.github.com/), authenticated with repo
# access: `gh auth login`. Safe to re-run — `gh label create --force` updates
# the color/description of a label that already exists instead of failing.
#
# Usage:
#   ./scripts/setup-github-labels.sh [owner/repo]
#
# If owner/repo is omitted, gh infers it from the current git remote.

set -euo pipefail

REPO="${1:-}"
REPO_ARGS=()
if [ -n "${REPO}" ]; then
  REPO_ARGS=(--repo "${REPO}")
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) not found. Install it: https://cli.github.com/" >&2
  exit 1
fi

echo "Community Platform — GitHub Label Setup"
echo "========================================"

create_label() {
  local name="$1" color="$2" description="$3"
  echo "  ${name}"
  gh label create "${name}" --color "${color}" --description "${description}" --force "${REPO_ARGS[@]}"
}

echo "Type labels:"
create_label "type:bug"      "d73a4a" "Something is broken"
create_label "type:feature"  "a2eeef" "New feature or enhancement"
create_label "type:security" "b60205" "Security-relevant change"
create_label "type:ops"      "0e8a16" "Deployment / infrastructure"
create_label "type:docs"     "0075ca" "Documentation"
create_label "type:test"     "c5def5" "Test coverage / test infra"
create_label "type:refactor" "cfd3d7" "Code cleanup, no behavior change"

echo "Priority labels:"
create_label "priority:p0" "b60205" "Drop everything"
create_label "priority:p1" "d93f0b" "High priority"
create_label "priority:p2" "fbca04" "Normal priority"
create_label "priority:p3" "c2e0c6" "Low priority / nice to have"

echo "Size labels:"
create_label "size:xs" "e8f5e9" "Extra small — under an hour"
create_label "size:s"  "c8e6c9" "Small — a few hours"
create_label "size:m"  "a5d6a7" "Medium — about a day"
create_label "size:l"  "81c784" "Large — multiple days"
create_label "size:xl" "66bb6a" "Extra large — needs its own plan"

echo "Area labels:"
create_label "area:api"      "1d76db" "apps/api (NestJS)"
create_label "area:web"      "1d76db" "apps/web (Next.js)"
create_label "area:auth"     "5319e7" "Authentication / authorization"
create_label "area:db"       "1d76db" "Database / Prisma / migrations"
create_label "area:docker"   "1d76db" "Docker / Compose"
create_label "area:ci"       "1d76db" "CI/CD, GitHub Actions"
create_label "area:mobile"   "1d76db" "apps/mobile-android"
create_label "area:docs"     "1d76db" "Documentation"
create_label "area:security" "5319e7" "Security-sensitive area"

echo "Done."
