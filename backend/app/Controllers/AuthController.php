<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use \Firebase\JWT\JWT;

class AuthController extends BaseController
{
    use ResponseTrait;


    /**
     * Retrieve request payload reliably for both JSON and form-encoded bodies.
     * Avoids exceptions from getJSON when the body is not valid JSON.
     */
    private function getPayload(): array
    {
        /** @var \CodeIgniter\HTTP\IncomingRequest $req */
        $req = \Config\Services::request(); // IncomingRequest
        $contentType = $req->getHeaderLine('Content-Type');

        // Try JSON body first without throwing
        if (stripos($contentType, 'application/json') !== false) {
            $raw = $req->getBody();
            if (is_string($raw) && $raw !== '') {
                $json = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
                    return $json;
                }
            }
        }

        // Try raw input (works for JSON or other payloads parsed by CI)
        $rawInput = $req->getRawInput();
        if (is_array($rawInput) && !empty($rawInput)) {
            return $rawInput;
        }

        // Finally, consider form-encoded fields
        $post = $req->getPost();
        if (is_array($post) && !empty($post)) {
            return $post;
        }

        return [];
    }

    public function register()
    {
        $userModel = new UserModel();

        $payload = $this->getPayload();

        $rules = [
            'name' => 'required',
            'email' => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
        ];

        if (!$this->validateData($payload, $rules)) {
            return $this->fail($this->validator->getErrors(), 422);
        }

        // Generate OTP
        $otp = random_int(100000, 999999);
        $otp_expires = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $data = [
            'name' => $payload['name'] ?? null,
            'email' => isset($payload['email']) ? strtolower(trim($payload['email'])) : null,
            'password' => $payload['password'] ?? null,
            'role_id' => 2, // Default user role
            'otp_code' => (string) $otp,
            'otp_expires_at' => $otp_expires,
        ];

        // Save user (hash handled by UserModel callbacks)
        $userModel->save($data);

        // Send OTP to email via configured SMTP
        $emailService = \Config\Services::email();
        $fromEmail = env('email.fromEmail', '');
        $fromName  = env('email.fromName', 'No-Reply');
        if ($fromEmail) {
            $emailService->setFrom($fromEmail, $fromName);
        }
        $emailService->setTo($data['email']);
        $emailService->setSubject('Your OTP Code');
        $emailService->setMailType('html'); // ensure HTML emails even if .env not set

        $htmlMessage = '<p>Hello ' . htmlspecialchars($data['name'] ?? 'User', ENT_QUOTES, 'UTF-8') . ',</p>'
            . '<p>Your OTP code is: <strong>' . $otp . '</strong></p>'
            . '<p>This code will expire at <strong>' . $otp_expires . '</strong>.</p>'
            . '<p>If you did not request this, please ignore this email.</p>';
        $emailService->setMessage($htmlMessage);

        $emailSent = false;
        try {
            $emailSent = $emailService->send();
        } catch (\Throwable $e) {
            log_message('error', 'Failed to send OTP email: ' . $e->getMessage());
            $emailSent = false;
        }

        $response = [
            'status' => 201,
            'message' => 'Registration successful. Please check your email for OTP.',
            'data' => [
                'email' => $data['email'],
            ],
        ];

        // In non-production, also include OTP for easier local testing
        if (defined('ENVIRONMENT') && ENVIRONMENT !== 'production') {
            $response['data']['otp'] = $otp;
            if (!$emailSent) {
                $response['data']['email_warning'] = 'Email sending failed. Check SMTP config in .env and Config\\Email.php.';
            }
        }

        return $this->respondCreated($response);
    }

    public function verify_otp()
    {
        $userModel = new UserModel();

        // Use JSON/post payload consistently for validation
        $payload = $this->getPayload();

        $rules = [
            'email' => 'required|valid_email',
            'otp' => 'required|numeric|exact_length[6]',
        ];

        if (!$this->validateData($payload, $rules)) {
            return $this->fail($this->validator->getErrors(), 422);
        }

        $email = strtolower(trim($payload['email'] ?? ''));
        $otp = $payload['otp'] ?? null;
        
        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        if ((string) $user['otp_code'] !== (string) $otp) {
            return $this->fail('Invalid OTP code.');
        }

        if (strtotime($user['otp_expires_at']) < time()) {
            return $this->fail('OTP has expired.');
        }

        // OTP is valid, activate user (e.g., clear OTP fields)
        $data = [
            'otp_code' => null,
            'otp_expires_at' => null,
        ];
        $userModel->update($user['id'], $data);

        return $this->respond(['message' => 'OTP verified successfully. You can now log in.']);
    }

    public function login()
    {
        $userModel = new UserModel();

        // Use JSON/post payload consistently for validation
        $payload = $this->getPayload();

        $rules = [
            'email' => 'required|valid_email',
            'password' => 'required',
        ];

        if (!$this->validateData($payload, $rules)) {
            return $this->fail($this->validator->getErrors(), 422);
        }

        $email = strtolower(trim($payload['email'] ?? ''));
        $password = $payload['password'] ?? null;

        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        // Check if OTP was verified
        if ($user['otp_code'] !== null) {
            return $this->fail('Please verify your OTP before logging in.');
        }

        if (!password_verify($password, $user['password'])) {
            return $this->fail('Invalid password.');
        }

        // Generate JWT
        $key = getenv('jwt.secret');
        if (!$key) {
            return $this->fail('JWT secret not configured.');
        }

        $iat = time(); // current time
        $exp = $iat + 3600; // 1 hour

        $jwtPayload = [
            'iss' => 'CodeIgniter4',
            'aud' => 'WebApp',
            'sub' => 'Authentication',
            'iat' => $iat,
            'exp' => $exp,
            'uid' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role_id'],
        ];

        $token = JWT::encode($jwtPayload, $key, 'HS256');

        return $this->respond(['token' => $token]);
    }
}