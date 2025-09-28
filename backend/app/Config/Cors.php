<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default = [
        'allowedOrigins' => [
            'http://localhost:5777',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ],
        'allowedOriginsPatterns' => ['https?://(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(?::\d+)?'],
        'supportsCredentials' => false,
        'allowedHeaders' => [
            'Content-Type',
            'Authorization',
            'Accept',
            'Origin',
            'User-Agent',
            'Cache-Control',
            'Pragma',
            'X-Requested-With',
            'X-CSRF-Token',
        ],
        'exposedHeaders' => [
            'Authorization',
        ],
        'allowedMethods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'maxAge' => 7200,
    ];
}
