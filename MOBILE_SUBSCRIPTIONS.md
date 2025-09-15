# Mobile Subscriptions Integration with RevenueCat

This document outlines the integration of RevenueCat mobile subscriptions with the CleverNote web application using RevenueCat's REST API.

## Overview

The integration allows users who purchase subscriptions through mobile apps (iOS/Android) to access premium features on the web platform. This is achieved by:

1. Linking web users to RevenueCat user IDs
2. Using RevenueCat's REST API to check subscription status in real-time
3. Checking both web and mobile subscriptions for premium feature access

## Database Schema

### Users Table Additions

The following field has been added to the `users` table:

```sql
revenuecat_user_id VARCHAR(255) NULL -- RevenueCat user identifier (indexed)
```

## User Model Methods

### `hasActiveMobileSubscription()`
Checks if the user has an active mobile subscription using RevenueCat API:

```php
public function hasActiveMobileSubscription(): bool
{
    if (!$this->revenuecat_user_id) {
        return false;
    }
    
    $revenueCatService = app(RevenueCatService::class);
    return $revenueCatService->hasActiveSubscription($this->revenuecat_user_id);
}
```

### `hasAnyActiveSubscription()`
Unified method that checks both web and mobile subscriptions:

```php
public function hasAnyActiveSubscription(): bool
{
    return $this->activeSubscriptions()->exists() || $this->hasActiveMobileSubscription();
}
```

### `getMobileSubscriptionDetails()`
Retrieves mobile subscription details from RevenueCat:

```php
public function getMobileSubscriptionDetails(): ?array
{
    if (!$this->revenuecat_user_id) {
        return null;
    }
    
    $revenueCatService = app(RevenueCatService::class);
    return $revenueCatService->getSubscriptionDetails($this->revenuecat_user_id);
}
```

## API Endpoints

### POST /api/revenuecat/link

Links a web user account to a RevenueCat user ID.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "revenuecat_user_id": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User linked to RevenueCat successfully"
}
```

### GET /api/revenuecat/status

Retrieves current subscription status from RevenueCat.

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "active": true,
    "expires_date": "2024-02-01T00:00:00Z",
    "product_identifier": "premium_monthly",
    "platform": "ios"
  }
}
```

### POST /api/revenuecat/refresh

Forces a refresh of subscription status from RevenueCat.

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "active": true,
    "expires_date": "2024-02-01T00:00:00Z",
    "product_identifier": "premium_monthly",
    "platform": "ios"
  }
}
```

## Integration Steps

### 1. Mobile App Setup

1. Configure RevenueCat in your mobile app
2. Set up RevenueCat API keys in your web application environment
3. Configure the RevenueCatService with proper authentication

### 2. User Linking

When a user wants to access premium features on web:

1. User provides their RevenueCat user ID (from mobile app)
2. Call `POST /api/revenuecat/link` to link web account to RevenueCat
3. Store the RevenueCat user ID in the web database

### 3. Subscription Checking

The web application will:
- Check subscription status in real-time via RevenueCat API
- Cache results temporarily to avoid excessive API calls
- Grant/revoke premium features based on current status

### 4. Configuration

Add RevenueCat credentials to your `.env` file:

```env
REVENUECAT_PUBLIC_KEY=your_public_key_here
REVENUECAT_SECRET_KEY=your_secret_key_here
```

### 5. Testing

- Use the API endpoints to test subscription status checking
- Test user linking functionality
- Verify premium feature access with active mobile subscriptions

## RevenueCat Service

The `RevenueCatService` class handles all interactions with RevenueCat's REST API:

### Key Methods

- `getSubscriber($appUserId)`: Retrieves subscriber information
- `hasActiveSubscription($appUserId)`: Checks if user has active subscription
- `getSubscriptionDetails($appUserId)`: Gets detailed subscription information

### API Integration

The service uses RevenueCat's REST API v1 endpoints:

```php
// Example API call
GET /v1/subscribers/{app_user_id}
Authorization: Bearer {secret_key}
```

### Error Handling

The service includes proper error handling for:
- Network timeouts
- Invalid API responses
- Missing subscriber data
- API rate limits

## Security Considerations

- Secure API key storage and rotation
- Rate limiting for API calls
- Proper error handling and logging
- Use HTTPS for all API communications

## Backward Compatibility

Existing Stripe subscriptions continue to work unchanged. The `hasAnyActiveSubscription()` method checks both:

1. Existing Stripe subscriptions (`activeSubscriptions()->exists()`)
2. New mobile subscriptions (`hasActiveMobileSubscription()`)

## Usage Examples

### Checking Premium Access

```php
// In any controller or middleware
if ($user->hasAnyActiveSubscription()) {
    // Grant premium features
    return $this->premiumFeature();
} else {
    // Show upgrade prompt
    return $this->showUpgradePrompt();
}
```

### Getting Subscription Details

```php
// Check subscription type and details
$user = auth()->user();

if ($user->activeSubscriptions()->exists()) {
    $subscriptionType = 'stripe';
    $details = $user->activeSubscriptions()->first();
} elseif ($user->hasActiveMobileSubscription()) {
    $subscriptionType = 'mobile';
    $details = $user->getMobileSubscriptionDetails();
} else {
    $subscriptionType = 'none';
    $details = null;
}
```

### Linking User to RevenueCat

```php
// Link user to RevenueCat (typically done via API)
$user = auth()->user();
$user->update(['revenuecat_user_id' => 'rc_user_123']);

// Check if user now has mobile subscription
if ($user->hasActiveMobileSubscription()) {
    // User has active mobile subscription
    $details = $user->getMobileSubscriptionDetails();
}
```

### API Usage from Mobile App

```javascript
// Link user account to RevenueCat
fetch('/api/revenuecat/link', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        revenuecat_user_id: 'rc_user_123'
    })
});

// Check subscription status
fetch('/api/revenuecat/status', {
    headers: {
        'Authorization': 'Bearer ' + token
    }
}).then(response => response.json());
```