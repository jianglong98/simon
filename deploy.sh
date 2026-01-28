#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil command not found. Please install the Google Cloud SDK."
    exit 1
fi

# Configuration
BUCKET="gs://simon.otalkie.com"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "🚀 Deploying simon.otalkie.com to $BUCKET..."

# 1. Sync files (upload new/changed files, delete removed ones)
# Exclude .git folder, .DS_Store, .sh scripts, and README to keep bucket clean
gsutil -m rsync -r -x "\.git.*|\.DS_Store|.*\.sh$|README\.md" "$DIR" "$BUCKET"

# 2. Ensure all files are publicly readable
gsutil iam ch allUsers:objectViewer "$BUCKET"

# 3. Configure the bucket to serve index.html as the main page
gsutil web set -m index.html "$BUCKET"

echo "✅ Deployment complete!"

# 4. Sync to GitHub
echo "🔄 Syncing to GitHub..."
if command -v git &> /dev/null && [ -d .git ]; then
    # Update README timestamp
    TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
    sed -i '' "s/\*\*Last Updated:\*\* .*/\*\*Last Updated:\*\* $TIMESTAMP/" "$DIR/README.md"

    git add .
    # Commit only if there are staged changes
    if ! git diff --cached --quiet; then
        git commit -m "Deploy update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    git pull --rebase
    git push
    echo "✅ GitHub sync complete!"
fi