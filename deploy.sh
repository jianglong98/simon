#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
BUCKET="gs://simon.otalkie.com"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Detect OS - important for correctly handling sed
OS="$(uname)"

# Check if gsutil is installed (Windows often uses gsutil.cmd)
if command -v gsutil &> /dev/null; then
    GSUTIL_CMD="gsutil"
elif command -v gsutil.cmd &> /dev/null; then
    GSUTIL_CMD="gsutil.cmd"
else
    echo "❌ Error: gsutil command not found. Please install the Google Cloud SDK and add it to your PATH."
    exit 1 # Exit if gsutil is not found
fi

# 1. Sync with GitHub (Commit & Pull updates)
echo "🔄 Checking for updates from GitHub..."
if command -v git &> /dev/null && [ -d .git ]; then
    # Pull latest changes BEFORE making local commits to avoid conflicts
    echo "⬇️ Pulling latest changes..."
    # --autostash saves local changes, pulls, then restores them
    git pull --rebase --autostash || echo "⚠️ Git pull warning. Proceeding..."

    # Update README timestamp
    TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    
    # Handle sed differences between macOS (Darwin) and Linux/Windows (Git Bash)
    if [[ "$OS" == "Darwin" ]]; then
        sed -i '' "s/\*\*Last Updated:\*\* .*/\*\*Last Updated:\*\* $TIMESTAMP/" "$DIR/README.md"
    else
        sed -i "s/\*\*Last Updated:\*\* .*/\*\*Last Updated:\*\* $TIMESTAMP/" "$DIR/README.md"
    fi

    # Ensure music folder is removed from git tracking
    if [ -d "music" ]; then
        git rm -r --cached music/ 2>/dev/null || true
    fi

    git add .
    # Commit only if there are staged changes
    if ! git diff --cached --quiet; then
        git commit -m "Deploy update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
fi

echo "🚀 Deploying simon.otalkie.com to $BUCKET..."

# 2. Sync files (upload new/changed files, delete removed ones)
# Added -c to compute checksums (slower but more accurate for cross-platform)
# Exclude .git folder, .DS_Store, .sh scripts, README, and git config files
$GSUTIL_CMD -m rsync -r -c -x "\.git.*|\.DS_Store|.*\.sh$|README\.md|\.gitignore|\.gitattributes" "$DIR" "$BUCKET"

# 3. Ensure all files are publicly readable
$GSUTIL_CMD iam ch allUsers:objectViewer "$BUCKET"

# 4. Configure the bucket to serve index.html as the main page
$GSUTIL_CMD web set -m index.html "$BUCKET"

echo "✅ Deployment complete!"

# 5. Push to GitHub
if command -v git &> /dev/null && [ -d .git ]; then
    echo "🔄 Pushing to GitHub..."
    git push
    echo "✅ GitHub sync complete!"
fi

# Final message
echo "🎉 Deployment process completed."
echo "  - Website URL: https://simon.otalkie.com"
echo "  - GCP Bucket: $BUCKET"

#Give user some helpful advice
echo "Make sure you have set up billing correctly for your GCP project."
