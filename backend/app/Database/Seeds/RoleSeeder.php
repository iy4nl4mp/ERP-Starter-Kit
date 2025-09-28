<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use App\Models\RoleModel;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            ['role_name' => 'admin',      'description' => 'Administrator system'],
            ['role_name' => 'operator',   'description' => 'Operator aplikasi'],
            ['role_name' => 'akunting',   'description' => 'Bagian akunting/keuangan'],
            ['role_name' => 'gudang',     'description' => 'Petugas gudang'],
            ['role_name' => 'manager',    'description' => 'Manajer'],
            ['role_name' => 'user',       'description' => 'Pengguna umum'],
            ['role_name' => 'pembelian',  'description' => 'Bagian pembelian'],
        ];

        $model = new RoleModel();

        foreach ($roles as $role) {
            $existing = $model->where('role_name', $role['role_name'])->first();
            if ($existing) {
                // update description if changed
                $model->update($existing['id'], [
                    'role_name'   => $role['role_name'],
                    'description' => $role['description'],
                ]);
            } else {
                $model->insert($role);
            }
        }
    }
}