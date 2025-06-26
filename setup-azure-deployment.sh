#!/bin/bash

echo "🚀 Setting up Azure Web App Deployment with GitHub Actions"
echo "=========================================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Variables
RESOURCE_GROUP="community"
APP_NAME="v-games"
LOCATION="eastus"
SKU="F1"  # Free tier
RUNTIME="PYTHON:3.11"

# Login to Azure
echo "🔑 Logging in to Azure..."
az login

# Create resource group if it doesn't exist
echo "🏗️ Creating resource group if it doesn't exist..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service plan if it doesn't exist
echo "📋 Creating App Service plan..."
az appservice plan create --name "${APP_NAME}-plan" \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku $SKU \
    --is-linux

# Create Web App
echo "🌐 Creating Web App..."
az webapp create --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan "${APP_NAME}-plan" \
    --runtime $RUNTIME

# Configure Web App settings
echo "⚙️ Configuring Web App settings..."
az webapp config set --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "gunicorn retro_game_web.wsgi:application --bind=0.0.0.0 --timeout 600"

# Set environment variables
echo "🔧 Setting environment variables..."
az webapp config appsettings set --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
    DEBUG=0 \
    DJANGO_ALLOWED_HOSTS="${APP_NAME}.azurewebsites.net" \
    DJANGO_SECRET_KEY="$(openssl rand -base64 32)" \
    WEBSITE_WEBDEPLOY_USE_SCM=true

# Get the publish profile for GitHub Actions
echo "📄 Getting publish profile for GitHub Actions..."
PUBLISH_PROFILE=$(az webapp deployment list-publishing-profiles --name $APP_NAME --resource-group $RESOURCE_GROUP --xml)

echo ""
echo "✅ Azure resources created successfully!"
echo "🌐 Your app will be available at: https://${APP_NAME}.azurewebsites.net"
echo ""
echo "📝 Next steps for GitHub Actions setup:"
echo "1. Create a GitHub repository for your project"
echo "2. Add the following secret to your GitHub repository:"
echo "   Name: AZURE_WEBAPP_PUBLISH_PROFILE"
echo "   Value: The publish profile XML (copied to your clipboard)"
echo ""
echo "The publish profile has been saved to .azure-publish-profile.xml"
echo "⚠️  IMPORTANT: This file contains sensitive information. Do not commit it to your repository!"
echo ""

# Save the publish profile to a file
echo "$PUBLISH_PROFILE" > .azure-publish-profile.xml

# Try to copy to clipboard based on OS
if command -v pbcopy &> /dev/null; then
    # macOS
    echo "$PUBLISH_PROFILE" | pbcopy
    echo "✅ Publish profile copied to clipboard!"
elif command -v xclip &> /dev/null; then
    # Linux with xclip
    echo "$PUBLISH_PROFILE" | xclip -selection clipboard
    echo "✅ Publish profile copied to clipboard!"
elif command -v clip.exe &> /dev/null; then
    # Windows
    echo "$PUBLISH_PROFILE" | clip.exe
    echo "✅ Publish profile copied to clipboard!"
else
    echo "⚠️  Could not copy to clipboard. Please manually copy the content of .azure-publish-profile.xml"
fi

echo ""
echo "After pushing your code to GitHub, the GitHub Actions workflow will automatically deploy your app to Azure."
echo "=========================================================="
