<?php

namespace App\Contracts;

interface TextToSpeechServiceInterface
{
    /**
     * Convert text to speech and return the audio file path
     *
     * @param string $text The text to convert to speech
     * @param array $options Additional options like voice, language, etc.
     * @return array Contains 'file_path', 'duration', 'file_size', and other metadata
     * @throws \Exception When conversion fails
     */
    public function convertTextToSpeech(string $text, array $options = []): array;

    /**
     * Get available voices for the TTS service
     *
     * @return array List of available voices with their metadata
     */
    public function getAvailableVoices(): array;

    /**
     * Get supported languages for the TTS service
     *
     * @return array List of supported language codes
     */
    public function getSupportedLanguages(): array;

    /**
     * Validate if the given options are supported
     *
     * @param array $options Options to validate
     * @return bool True if options are valid
     */
    public function validateOptions(array $options): bool;

    /**
     * Get the maximum text length supported by the service
     *
     * @return int Maximum characters allowed
     */
    public function getMaxTextLength(): int;

    /**
     * Get the service name/identifier
     *
     * @return string Service name
     */
    public function getServiceName(): string;

    /**
     * Check if the service supports SSML formatting
     *
     * @return bool True if SSML is supported
     */
    public function supportsSSML(): bool;
}