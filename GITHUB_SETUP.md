# Setting Up GitHub Repository

Follow these steps to create a GitHub repository and push your code:

## 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Repository name: `games-collection` (or any name you prefer)
4. Description: "A collection of web-based games built with Django"
5. Choose Public or Private
6. Do NOT initialize with README, .gitignore, or license (since we already have these files)
7. Click "Create repository"

## 2. Push Your Local Repository to GitHub

After creating the repository, GitHub will show you commands to push an existing repository. Use the following commands:

```bash
# Make sure you're in the project directory
cd /Users/ubivkm1/Code/retro-platform-game

# Update the remote URL to your new repository
git remote set-url origin https://github.com/YOUR_USERNAME/games-collection.git

# Push your code to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 3. Set Up GitHub Actions for Azure Deployment

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
5. Value: Paste the publish profile XML (from `.azure-publish-profile.xml` after running `setup-azure-deployment.sh`)
6. Click "Add secret"

## 4. Verify GitHub Actions Workflow

1. Go to the "Actions" tab in your GitHub repository
2. You should see the workflow "Deploy to Azure Web App" running
3. Once it completes successfully, your app will be deployed to Azure

Your application will be available at: `https://v-games.azurewebsites.net`
