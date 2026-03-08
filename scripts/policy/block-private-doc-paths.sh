#!/usr/bin/env bash
set -euo pipefail

is_blocked_path() {
  local path="$1"
  [[ "$path" == plans/* ]] || [[ "$path" == .github/instructions/* ]] || [[ "$path" == .github/agents/* ]] || [[ "$path" == ".github/copilot-instructions.md" ]]
}

files=()

if [[ "${1:-}" == "--stdin" ]]; then
  while IFS= read -r line; do
    files+=("$line")
  done
elif [[ "$#" -gt 0 ]]; then
  files=("$@")
else
  while IFS= read -r line; do
    files+=("$line")
  done < <(git diff --cached --name-only)
fi

blocked=()
for file in "${files[@]}"; do
  [[ -z "$file" ]] && continue
  if is_blocked_path "$file"; then
    blocked+=("$file")
  fi
done

if [[ "${#blocked[@]}" -gt 0 ]]; then
  echo "ERROR: Private Dharma paths detected in public repo changes."
  echo "Move these files to nosebleed-private instead:"
  printf ' - %s\n' "${blocked[@]}"
  exit 1
fi

echo "Path policy check passed."
