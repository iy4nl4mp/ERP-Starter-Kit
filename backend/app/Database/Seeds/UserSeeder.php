<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use App\Models\RoleModel;
use App\Models\UserModel;

class UserSeeder extends Seeder
{
    public function run()
    {
        $roleModel = new RoleModel();
        $userModel = new UserModel();

        // Ensure the 'admin' role exists and get its ID
        $adminRole = $roleModel->where('role_name', 'admin')->first();
        if (! $adminRole) {
            // Seed roles if not present
            $this->call('RoleSeeder');
            $adminRole = $roleModel->where('role_name', 'admin')->first();
        }

        $roleId = $adminRole['id'] ?? 1;

        $data = [
            'name'            => 'iy4nl4mp',
            'email'           => 'iy4n2000@gmail.com',
            'password'        => '1234abcd', // Will be hashed by UserModel callbacks
            'role_id'         => $roleId,
            'otp_code'        => null,
            'otp_expires_at'  => '2027-01-01 00:00:00',
            'remember_token'  => 'yes',
        ];

        // Upsert by email
        $existing = $userModel->where('email', $data['email'])->first();
        if ($existing) {
            $data['id'] = $existing['id'];
        }

        $userModel->save($data);
        // Upsert and save second user 'udin'
        $userRole = $roleModel->where('role_name', 'user')->first();
        $userRoleId = $userRole['id'] ?? 2;

        $data2 = [
            'name'            => 'udin',
            'email'           => 'udin@gmail.com',
            'password'        => 'abcd123', // Will be hashed by UserModel callbacks
            'role_id'         => $userRoleId,
            'otp_code'        => null,
            'otp_expires_at'  => '2030-01-01 00:00:00',
            'remember_token'  => 'yes',
        ];

        // Upsert by email
        $existing2 = $userModel->where('email', $data2['email'])->first();
        if ($existing2) {
            $data2['id'] = $existing2['id'];
        }

        $userModel->save($data2);
    }
}