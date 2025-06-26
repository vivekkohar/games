# Deploying to Azure Web Apps with GitHub Actions

This guide explains how to deploy the Games Collection application to Azure Web Apps using the free tier and GitHub Actions for CI/CD.

## Prerequisites

1. **Azure Account**: You need an Azure account. If you don't have one, you can [create a free account](https://azure.microsoft.com/en-us/free/).
2. **Azure CLI**: Install the [Azure Command Line Interface](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).
3. **GitHub Account**: You need a GitHub account to host your repository and use GitHub Actions.
4. **Git**: Make sure Git is installed on your system.

## Step 1: Set Up Azure Resources

The easiest way to set up the required Azure resources is to use the provided script:

```bash
./setup-azure-deployment.sh
```

This script will:
1. Create a resource group in East US
2. Create an App Service plan (Free tier)
3. Create a Web App named "v-games"
4. Configure the necessary settings
5. Generate and save the publish profile for GitHub Actions

## Step 2: Create a GitHub Repository

1. Create a new repository on GitHub
2. Push your code to the repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## Step 3: Configure GitHub Actions

1. In your GitHub repository, go to "Settings" > "Secrets and variables" > "Actions"
2. Click "New repository secret"
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the publish profile XML (it was copied to your clipboard by the setup script, or you can find it in the `.azure-publish-profile.xml` file)
5. Click "Add secret"

The GitHub Actions workflow file (`.github/workflows/azure-deploy.yml`) is already included in your repository. It will automatically deploy your application to Azure Web App whenever you push to the main branch.

## Step 4: Verify Deployment

After pushing your code to GitHub, the GitHub Actions workflow will automatically deploy your app to Azure. You can check the status of the deployment in the "Actions" tab of your GitHub repository.

Once the deployment is complete, your application will be available at:

```
https://v-games.azurewebsites.net
```

## Understanding the Deployment Process

The GitHub Actions workflow does the following:

1. Checks out your code
2. Sets up Python 3.11
3. Installs dependencies from requirements.txt
4. Collects static files
5. Deploys the application to Azure Web App

## Managing Your Application

### Accessing the Admin Interface

After deployment, you can access the admin interface at:

```
https://v-games.azurewebsites.net/admin/
```

You'll need to create an admin user first. You can do this by connecting to the Azure Web App using SSH:

```bash
az webapp ssh --name v-games --resource-group games-collection-rg
```

Then run:

```bash
cd site/wwwroot
python manage.py createsuperuser
```

### Viewing Logs

You can view the logs of your application using:

```bash
az webapp log tail --name v-games --resource-group games-collection-rg
```

### Restarting the Web App

If needed, you can restart the web app using:

```bash
az webapp restart --name v-games --resource-group games-collection-rg
```

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions workflow logs for errors
2. Verify that the publish profile is correctly set up as a GitHub secret
3. Check the Azure Web App logs for runtime errors
4. Make sure your application is compatible with the Azure Web App environment

## Cleaning Up

If you want to remove all resources:

```bash
az group delete --name games-collection-rg --yes
```

This will delete the resource group and all resources within it, including the Web App and App Service plan.
