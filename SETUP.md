# GitHub Setup Instructions

Follow these steps to copy your Instagram clone project to GitHub:

## Step 1: Create a New GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., "instagram-clone" or "social-media-app")
4. Add a description: "Feature-rich Instagram clone built with React, Express.js, and PostgreSQL"
5. Choose "Public" or "Private" based on your preference
6. **DO NOT** initialize with README, .gitignore, or license (we already have these files)
7. Click "Create repository"

## Step 2: Initialize Git and Push to GitHub

Run these commands in your Replit terminal:

```bash
# Initialize git repository
git init

# Add all files to git
git add .

# Make your first commit
git commit -m "Initial commit: Instagram clone with React, Express.js, and PostgreSQL

Features:
- User authentication with Replit Auth
- Post creation, likes, and comments
- Real-time messaging with WebSocket
- Stories with 24h expiration
- User profiles and follow system
- Mobile-responsive Instagram-like UI
- Complete database schema with PostgreSQL"

# Add your GitHub repository as origin (replace with your actual repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

## Step 3: Update Repository Settings (Optional)

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to "Repository name" if you want to rename it
4. Add topics/tags: react, typescript, express, postgresql, instagram-clone, social-media
5. Update the repository description if needed

## Step 4: Set Up Environment Variables for GitHub (If deploying elsewhere)

If you plan to deploy this project outside of Replit, you'll need to set up these environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `REPL_ID`: Your Replit application ID (for authentication)
- `REPLIT_DOMAINS`: Your domain for authentication callbacks

## Important Notes

- The `.gitignore` file is already configured to exclude sensitive files
- Environment variables and secrets are not included in the repository
- The project is ready to run with `npm run dev` after setting up the database
- Remember to run `npm run db:push` to set up the database schema

## Next Steps

After pushing to GitHub, you can:
1. Set up GitHub Actions for CI/CD
2. Add collaborators to your repository
3. Create issues and project boards
4. Set up branch protection rules
5. Deploy to platforms like Vercel, Railway, or Heroku

Your Instagram clone is now ready to be shared and collaborated on!