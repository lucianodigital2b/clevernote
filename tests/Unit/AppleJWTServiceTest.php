<?php

namespace Tests\Unit;

use App\Services\AppleJWTService;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Token;
use Tests\TestCase;

class AppleJWTServiceTest extends TestCase
{
    /** @test */
    public function it_is_permitted_for_apple()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertTrue($token->isPermittedFor('https://appleid.apple.com'));
    }

    /** @test */
    public function it_generates_valid_jwt_token()
    {
        $service = app(AppleJWTService::class);
        $token = $service->generate();

        $this->assertIsString($token);
        $this->assertNotEmpty($token);
        
        // JWT tokens have 3 parts separated by dots
        $parts = explode('.', $token);
        $this->assertCount(3, $parts);
    }

    /** @test */
    public function it_has_correct_issuer()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertEquals(config('services.apple.team_id'), $token->claims()->get('iss'));
    }

    /** @test */
    public function it_has_correct_subject()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertEquals(config('services.apple.client_id'), $token->claims()->get('sub'));
    }

    /** @test */
    public function it_has_correct_audience()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertTrue($token->isPermittedFor('https://appleid.apple.com'));
    }

    /** @test */
    public function it_has_correct_key_id_in_header()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertEquals(config('services.apple.key_id'), $token->headers()->get('kid'));
    }

    /** @test */
    public function it_expires_in_one_hour()
    {
        $beforeGeneration = now();
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());
        $afterGeneration = now();

        $expirationTime = $token->claims()->get('exp');
        $issuedTime = $token->claims()->get('iat');

        // Token should expire approximately 1 hour (3600 seconds) after issuance
        $this->assertEqualsWithDelta(3600, $expirationTime - $issuedTime, 5);
        
        // Expiration should be approximately 1 hour from now
        $expectedExpiration = $beforeGeneration->addHour()->timestamp;
        $this->assertEqualsWithDelta($expectedExpiration, $expirationTime, 60);
    }

    /** @test */
    public function it_has_issued_at_time_close_to_current_time()
    {
        $beforeGeneration = now()->timestamp;
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());
        $afterGeneration = now()->timestamp;

        $issuedAt = $token->claims()->get('iat');
        
        $this->assertGreaterThanOrEqual($beforeGeneration, $issuedAt);
        $this->assertLessThanOrEqual($afterGeneration, $issuedAt);
    }

    /** @test */
    public function it_generates_different_tokens_on_each_call()
    {
        $service = app(AppleJWTService::class);
        
        $token1 = $service->generate();
        sleep(1); // Ensure different issued time
        $token2 = $service->generate();

        $this->assertNotEquals($token1, $token2);
    }

    /** @test */
    public function legacy_generate_client_secret_method_works()
    {
        $service = app(AppleJWTService::class);
        
        $token = $service->generateClientSecret();
        
        $this->assertIsString($token);
        $this->assertNotEmpty($token);
        
        // Should be the same as generate() method
        $this->assertEquals($service->generate(), $service->generateClientSecret());
    }

    /** @test */
    public function it_uses_es256_algorithm()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertEquals('ES256', $token->headers()->get('alg'));
    }

    /** @test */
    public function it_has_jwt_type_header()
    {
        $token = app(Configuration::class)
            ->parser()
            ->parse(app(AppleJWTService::class)->generate());

        $this->assertEquals('JWT', $token->headers()->get('typ'));
    }

    /** @test */
    public function it_can_be_verified_with_configuration()
    {
        $config = app(Configuration::class);
        $service = app(AppleJWTService::class);
        
        $tokenString = $service->generate();
        $token = $config->parser()->parse($tokenString);
        
        $constraints = $config->validationConstraints();
        
        // Should not throw exception if valid
        $this->assertTrue($config->validator()->validate($token, ...$constraints));
    }
}