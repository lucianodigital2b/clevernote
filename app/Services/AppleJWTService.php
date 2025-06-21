<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Ecdsa\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Exception;

/**
 * Apple JWT Service for generating client secrets on-demand
 * 
 * Based on the approach from: https://bannister.me/blog/generating-a-client-secret-for-sign-in-with-apple-on-each-request
 * This service generates JWT tokens on each request rather than pre-generating them,
 * eliminating the need to manage token expiration and renewal.
 */
class AppleJWTService
{
    private Configuration $jwtConfig;

    public function __construct(Configuration $jwtConfig)
    {
        $this->jwtConfig = $jwtConfig;
    }

    /**
     * Generate Apple Client Secret JWT
     * 
     * Generates a fresh JWT token on each request with a 1-hour expiration.
     * This eliminates the need to manage token expiration and renewal.
     *
     * @return string The JWT token
     */
    public function generate(): string
    {
        $now = CarbonImmutable::now();

        $token = $this->jwtConfig->builder()
            ->issuedBy(config('services.apple.team_id'))
            ->issuedAt($now)
            ->expiresAt($now->addHour())
            ->permittedFor('https://appleid.apple.com')
            ->relatedTo(config('services.apple.client_id'))
            ->withHeader('kid', config('services.apple.key_id'))
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());

        return $token->toString();
    }

    /**
     * Legacy method for backward compatibility
     * 
     * @deprecated Use generate() instead
     * @param int $expirationMonths Ignored - tokens now expire in 1 hour
     * @return string
     */
    public function generateClientSecret(int $expirationMonths = 6): string
    {
        return $this->generate();
    }
}