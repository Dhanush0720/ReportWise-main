# Push to GitHub with Different Account - Quick Guide

## Step 1: Open Git Bash
1. Right-click in the project folder: `e:\Analysis Made Easy`
2. Select **"Git Bash Here"**
3. Or open Git Bash and navigate: `cd e:/Analysis\ Made\ Easy`

## Step 2: Configure Git for This Account

```bash
# Set the user for THIS REPOSITORY ONLY
git config user.name "Your Name"
git config user.email "your-email@example.com"

# Verify it worked
git config --list
```

## Step 3: Initialize Git (if not already done)

```bash
# Check if already initialized
git status

# If not initialized, run:
git init
```

## Step 4: Add All Files

```bash
git add .
```

## Step 5: Create First Commit

```bash
git commit -m "Initial commit: ReportWise AI with authentication and presentation decks"
```

## Step 6: Create GitHub Repository

1. Go to **https://github.com/new** (with your different account)
2. Repository name: `analysis-made-easy` (or your choice)
3. Description: "ReportWise - Autonomous Multi-Agent Data Analysis Platform"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README
6. Click **Create repository**

## Step 7: Connect to GitHub

```bash
# Replace YOUR_USERNAME and YOUR_REPO_NAME
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify it worked
git remote -v
```

## Step 8: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## Step 9: Enter Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Your GitHub personal access token (NOT your password!)

### How to Get Personal Access Token:
1. Go to **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `Analysis Made Easy Push`
4. Select scopes:
   - ✅ `repo` (full control of private repositories)
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password in Git Bash

## Step 10: Verify Upload

```bash
# See your commits
git log

# Or go to GitHub and refresh the page
# You should see all your files!
```

---

## Complete Commands (Copy-Paste)

```bash
# 1. Navigate to project
cd e:/Analysis\ Made\ Easy

# 2. Configure git
git config user.name "Your Name"
git config user.email "your-email@example.com"

# 3. Initialize (if needed)
git init

# 4. Stage files
git add .

# 5. Commit
git commit -m "Initial commit: ReportWise AI with authentication and presentation decks"

# 6. Add remote (REPLACE the URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 7. Push
git branch -M main
git push -u origin main
```

---

## If Already Have Remote

If you get error "fatal: remote origin already exists":

```bash
# Remove old remote
git remote remove origin

# Add new remote (with your account)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin main
```

---

## Troubleshooting

### Error: "fatal: not a git repository"
```bash
git init
git add .
git commit -m "Initial commit"
```

### Error: "Authentication failed"
- Use **personal access token**, not password
- Get token from: https://github.com/settings/tokens

### Error: "branch not found"
```bash
git branch -M main
git push -u origin main
```

### Error: "You do not have permission"
- Check repository is set to Public or you have permission
- Or create a new repository with your account

---

## After First Push

For future pushes, just use:

```bash
git add .
git commit -m "Your message"
git push
```

---

## Useful Commands

```bash
# See status
git status

# See changes
git diff

# See commit history
git log

# See branches
git branch -a

# Pull latest changes
git pull origin main

# See remote URL
git remote -v
```

---

## Done! 🎉

Your code is now on GitHub with your account!

Next time, just:
1. Make changes
2. `git add .`
3. `git commit -m "message"`
4. `git push`
