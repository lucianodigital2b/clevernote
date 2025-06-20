<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Exception;

class AppleJWTService
{
    private string $teamId;
    private string $keyId;
    private string $clientId;
    private string $privateKeyPath;

    public function __construct()
    {
        $this->teamId = config('services.apple.team_id');
        $this->keyId = config('services.apple.key_id');
        $this->clientId = config('services.apple.client_id');
        $this->privateKeyPath = config('services.apple.private_key_path');
    }

    /**
     * Generate Apple Client Secret JWT
     *
     * @param int $expirationMonths Number of months until expiration (max 6)
     * @return string
     * @throws Exception
     */
    public function generateClientSecret(int $expirationMonths = 6): string
    {
        // Validate expiration (Apple allows max 6 months)
        if ($expirationMonths > 6) {
            throw new Exception('Apple JWT expiration cannot exceed 6 months');
        }

        // Read the private key
        $privateKeyPath = storage_path($this->privateKeyPath);
        $privateKey = file_get_contents($privateKeyPath);

        if (!$privateKey) {
            throw new Exception('Could not read Apple private key file at: ' . $privateKeyPath);
        }

        // JWT payload
        $payload = [
            'iss' => $this->teamId,
            'iat' => time(),
            'exp' => time() + ($expirationMonths * 30 * 24 * 60 * 60),
            'aud' => 'https://appleid.apple.com',
            'sub' => $this->clientId
        ];

        try {
            // Generate the JWT using ES256 algorithm
            return JWT::encode($payload, $privateKey, 'ES256', $this->keyId);
        } catch (Exception $e) {
            throw new Exception('Failed to generate Apple JWT: ' . $e->getMessage());
        }
    }

    /**
     * Validate if the current client secret is still valid
     *
     * @param string $jwt
     * @return bool
     */
    public function isTokenValid(string $jwt): bool
    {
        try {
            $payload = JWT::decode($jwt, $this->getPublicKey(), ['ES256']);
            return $payload->exp > time();
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get the public key for validation (if needed)
     *
     * @return string
     * @throws Exception
     */
    private function getPublicKey(): string
    {
        $privateKeyPath = storage_path($this->privateKeyPath);
        $privateKey = file_get_contents($privateKeyPath);

        if (!$privateKey) {
            throw new Exception('Could not read Apple private key file');
        }

        // For ES256, we would need to extract the public key from the private key
        // This is a simplified version - in production you might want to store the public key separately
        return $privateKey;
    }
}