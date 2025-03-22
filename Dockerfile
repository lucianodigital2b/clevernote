# Start with a base PHP image with FPM (FastCGI Process Manager)
FROM php:8.3-fpm

# Install Composer dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql \
    && docker-php-ext-install bcmath \
    && docker-php-ext-install gd

# Install Node.js and npm
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install --global npm@latest

# Set working directory
WORKDIR /var/www/clevernote

# Copy the application files
COPY . .

# Install Composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Install NPM dependencies and build assets
RUN npm install && npm run build

# Set permissions for Laravel directories
RUN chown -R www-data:www-data /var/www/clevernote/storage /var/www/clevernote/bootstrap/cache

# Expose the necessary ports
EXPOSE 9000

# Start PHP-FPM when the container starts
CMD ["php-fpm"]
