<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Config\Services;

class JWTFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Allow CORS preflight requests to pass through without JWT validation
        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return;
        }

        $header = $request->getHeaderLine('Authorization');
        $token = null;

        // Extract the Bearer token from the Authorization header
        if (!empty($header) && preg_match('/Bearer\s(\S+)/', $header, $matches)) {
            $token = $matches[1];
        }

        // Token missing
        if (is_null($token) || $token === '') {
            $response = Services::response();
            return $response
                ->setStatusCode(401)
                ->setJSON(['error' => 'Access denied', 'code' => 'TOKEN_MISSING']);
        }

        try {
            $key = getenv('jwt.secret');
            if (!$key) {
                $response = Services::response();
                return $response
                    ->setStatusCode(500)
                    ->setJSON(['error' => 'Server misconfiguration', 'code' => 'JWT_SECRET_MISSING']);
            }

            // Validate token signature and expiration
            JWT::decode($token, new Key($key, 'HS256'));
        } catch (\Throwable $e) {
            $response = Services::response();
            return $response
                ->setStatusCode(401)
                ->setJSON(['error' => 'Access denied', 'code' => 'TOKEN_INVALID']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
