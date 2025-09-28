<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class UserController extends BaseController
{
    use ResponseTrait;

    private function getUserIdFromToken()
    {
        $header = $this->request->getHeaderLine("Authorization");
        $token = explode(" ", $header)[1];
        $key = getenv('jwt.secret');
        $decoded = JWT::decode($token, new Key($key, 'HS256'));
        return $decoded->uid;
    }

    /**
     * Retrieve request payload reliably for both JSON and form-encoded bodies.
     */
    private function getPayload(): array
    {
        $req = \Config\Services::request();
        $contentType = $req->getHeaderLine('Content-Type');

        if (stripos($contentType, 'application/json') !== false) {
            $raw = $req->getBody();
            if (is_string($raw) && $raw !== '') {
                $json = json_decode($raw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
                    return $json;
                }
            }
        }

        $rawInput = $req->getRawInput();
        if (is_array($rawInput) && !empty($rawInput)) {
            return $rawInput;
        }

        $post = $req->getPost();
        if (is_array($post) && !empty($post)) {
            return $post;
        }

        return [];
    }

    // GET /api/profile
    public function getProfile()
    {
        $userId = $this->getUserIdFromToken();
        $model = new UserModel();
        $user = $model->find($userId);

        if (!$user) {
            return $this->failNotFound('User not found');
        }

        // Shape response for frontend and remove sensitive fields
        $responseUser = [
            'id'    => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role_id'], // normalized for frontend
        ];

        // Optionally include timestamps if available
        if (isset($user['created_at'])) {
            $responseUser['created_at'] = $user['created_at'];
        }
        if (isset($user['updated_at'])) {
            $responseUser['updated_at'] = $user['updated_at'];
        }

        return $this->respond($responseUser);
    }

    // PUT /api/profile
    public function updateProfile()
    {
        $userId = $this->getUserIdFromToken();
        $model = new UserModel();

        $payload = $this->getPayload();

        $rules = [
            'name' => 'required',
            'email' => "required|valid_email|is_unique[users.email,id,{$userId}]",
        ];

        if (!$this->validateData($payload, $rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = [
            'name' => $payload['name'] ?? null,
            'email' => isset($payload['email']) ? strtolower(trim($payload['email'])) : null,
        ];

        if ($model->update($userId, $data)) {
            return $this->respond(['message' => 'Profile updated successfully']);
        }

        return $this->fail($model->errors());
    }

    // PUT /api/profile/change-password
    public function changePassword()
    {
        $userId = $this->getUserIdFromToken();
        $model = new UserModel();

        $payload = $this->getPayload();

        $rules = [
            'old_password' => 'required',
            'new_password' => 'required|min_length[8]',
            'confirm_password' => 'required|matches[new_password]',
        ];

        if (!$this->validateData($payload, $rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $user = $model->find($userId);
        $old_password = $payload['old_password'] ?? '';
        
        if (!password_verify($old_password, $user['password'])) {
            return $this->fail('Invalid old password.');
        }

        $data = [
            'password' => $payload['new_password'] ?? '',
        ];

        if ($model->update($userId, $data)) {
            return $this->respond(['message' => 'Password changed successfully']);
        }

        return $this->fail($model->errors());
    }
}
