#!/bin/bash

set -e  # Exit on any error

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing PHP dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader

echo "📂 Installing Node.js dependencies..."
npm ci

echo "🎨 Building frontend assets..."
npm run build

echo "🧹 Clearing Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "⚙️ Caching config, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "📂 Running database migrations..."
php artisan migrate --force

echo "🚀 Optimizing Laravel..."
php artisan optimize

echo "🔁 Restarting Horizon gracefully..."
php artisan horizon:terminate

echo "✅ Deployment complete!"
