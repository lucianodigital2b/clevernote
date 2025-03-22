#!/bin/bash

# Install Composer dependencies (just in case this wasn't done)
composer install --no-dev --optimize-autoloader

# Install NPM dependencies and build assets
npm install
npm run build

# Run migrations
php artisan migrate

# Clear Laravel caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Start the application (PHP-FPM or Nginx, etc.)
php-fpm
