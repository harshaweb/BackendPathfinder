# Fix Git History - Remove Secrets

## Problem
Firebase credentials were accidentally committed to Git history and GitHub is blocking pushes.

## Solution Options

### Option 1: Allow Secret on GitHub (Quick but requires credential rotation)

1. Visit this URL to allow the secret:
   https://github.com/harshaweb/BackendPathfinder/security/secret-scanning/unblock-secret/3D2kVQI0F54gYIQaRUQJ7Cfv2Tf

2. **IMMEDIATELY** rotate your Firebase credentials:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Delete the old service account key
   - Update your local `.env` and service account JSON file

3. Push your code

### Option 2: Clean Git History (Recommended)

Use BFG Repo-Cleaner to remove secrets from history:

```bash
# Install BFG (macOS)
brew install bfg

# Clone a fresh copy
cd ..
git clone --mirror https://github.com/harshaweb/BackendPathfinder.git

# Remove the secret files from history
bfg --delete-files pathfinder-da8e0-firebase-adminsdk-fbsvc-aeed898cbb.json BackendPathfinder.git
bfg --delete-files .env BackendPathfinder.git

# Clean up
cd BackendPathfinder.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force

# Go back to your working directory
cd ../backend
git pull --rebase
```

### Option 3: Start Fresh (Nuclear option)

If the repository doesn't have important history:

1. Delete the GitHub repository
2. Create a new repository
3. Push only the latest clean code

## After Fixing

1. Ensure `.gitignore` is properly configured
2. Never commit `.env` or `*-firebase-adminsdk-*.json` files
3. Use `.env.example` as a template
4. Rotate any exposed credentials
