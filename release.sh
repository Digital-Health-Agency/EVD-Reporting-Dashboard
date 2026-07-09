#!/usr/bin/env bash
set -euo pipefail

# --- Ensure on develop branch ---
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "develop" ]]; then
  echo "Error: You must be on the 'develop' branch to initiate a release. (Current branch: $current_branch)" >&2
  exit 1
fi

# --- Argument Parsing ---
MAJOR=0
MINOR=0
BUGFIX=0

for arg in "$@"; do
  case $arg in
    --major)
      MAJOR=1
      ;;
    --minor)
      MINOR=1
      ;;
    --bugfix)
      BUGFIX=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

# Default to --minor if no args
if [[ $MAJOR -eq 0 && $MINOR -eq 0 && $BUGFIX -eq 0 ]]; then
  MINOR=1
fi

# --- Version Bump Logic ---
get_version() {
  grep '"version"' package.json | head -1 | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/'
}

bump_version() {
  local version=$1
  local major minor bugfix
  IFS='.' read -r major minor bugfix <<< "$version"
  if [[ $MAJOR -eq 1 ]]; then
    major=$((major+1)); minor=0; bugfix=0
  fi
  if [[ $MINOR -eq 1 ]]; then
    minor=$((minor+1)); bugfix=0
  fi
  if [[ $BUGFIX -eq 1 ]]; then
    bugfix=$((bugfix+1))
  fi
  echo "$major.$minor.$bugfix"
}

old_version=$(get_version)
new_version=$(bump_version "$old_version")

# --- Update package.json ---
if [[ "$old_version" != "$new_version" ]]; then
  echo "Bumping version: $old_version -> $new_version"
  sed -i.bak -E "s/(\"version\": \")[0-9]+\.[0-9]+\.[0-9]+(\")/\1$new_version\2/" package.json
  rm -f package.json.bak
else
  echo "Version unchanged ($old_version)"
fi

# --- Prompt user for change description ---
echo "Please describe the changes for this release (single line, markdown supported):"
read -r CHANGE_DESC

# --- Update or Create CHANGE.md ---
CHANGELOG=CHANGE.md
DATE=$(date +%Y-%m-%d)
if [[ ! -f $CHANGELOG ]]; then
  echo "# Changelog" > $CHANGELOG
  echo >> $CHANGELOG
fi
if ! grep -q "## $new_version" $CHANGELOG; then
  echo -e "\n## $new_version ($DATE)\n- $CHANGE_DESC\n" >> $CHANGELOG
fi

# --- Ensure all files are added and committed ---
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Staging and committing all changes before release..."
  git add .
  git commit -m "chore: commit all changes before release"
fi

# --- Git Flow Release ---
if ! git flow release list | grep -q "$new_version"; then
  git flow release start "$new_version"
fi

git add package.json $CHANGELOG
if ! git diff --cached --quiet; then
  git commit -m "chore(release): v$new_version"
fi

# Finish the release without -m (for compatibility)
git flow release finish -n "$new_version"

# Remove any existing tag (in case git flow created it without a message)
git tag -d "v$new_version" 2>/dev/null || true

# Add or update the tag with a message (always v$new_version)
git tag -a "v$new_version" -m "Release v$new_version"

# Push changes and tags to remote so CI/CD and GitHub Actions are triggered
git push origin main develop --tags

# Always checkout develop branch at the end
git checkout develop

echo "Release v$new_version complete and pushed to remote. Switched back to develop branch."
