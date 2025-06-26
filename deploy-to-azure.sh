#!/bin/bash

echo "🚀 Deploying Games Collection to Azure Web App"
echo "=============================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Variables
RESOURCE_GROUP="games-collection-rg"
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

# Deploy code from local directory
echo "📦 Deploying code to Azure..."
az webapp up --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku $SKU \
    --plan "${APP_NAME}-plan" \
    --runtime $RUNTIME

# Run migrations
echo "🗄️ Running database migrations..."
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP --command "cd /home/site/wwwroot && python manage.py migrate"

# Create superuser
echo "👤 Creating superuser..."
az webapp ssh --name $APP_NAME --resource-group $RESOURCE_GROUP --command "cd /home/site/wwwroot && echo \"from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else print('Admin user already exists')\" | python manage.py shell"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is now available at: https://${APP_NAME}.azurewebsites.net"
echo "👤 Admin login: username=admin, password=admin123"
echo ""
