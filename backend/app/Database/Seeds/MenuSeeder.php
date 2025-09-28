<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use App\Models\MenuModel;
use App\Models\RoleModel;
use App\Models\RolePermissionModel;

class MenuSeeder extends Seeder
{
    public function run()
    {
        $model = new MenuModel();

        $createOrUpdate = function (string $name, string $url, int $parentId, int $order, ?string $icon) use ($model): int {
            $existing = $model->where('menu_name', $name)->first();

            $data = [
                'menu_name'  => $name,
                'parent_id'  => $parentId,
                'url'        => $url,
                'icon'       => $icon,
                'menu_order' => $order,
            ];

            if ($existing) {
                $model->update($existing['id'], $data);
                return (int) $existing['id'];
            }

            return (int) $model->insert($data, true);
        };

        // Top-level: Dashboard
        $createOrUpdate('Dashboard', '/dashboard', 0, 1, 'home');

        // Top-level: Master Data
        $masterId = $createOrUpdate('Master Data', '#', 0, 2, 'database');

        // Children of Master Data
        $createOrUpdate('Barang', '/barang', $masterId, 1, 'box');
        $createOrUpdate('Stok', '/stok', $masterId, 2, 'archive');

        // Optional additional top-level menus
        $createOrUpdate('Roles', '/roles', 0, 3, 'users');
        $createOrUpdate('Menus', '/menus', 0, 4, 'menu');

        // Grant admin role permission to ALL menus
        $roleModel = new RoleModel();
        $permissionModel = new RolePermissionModel();
        $admin = $roleModel->where('role_name', 'admin')->first();

        if ($admin) {
            $allMenus = $model->findAll();
            // Clear existing permissions for admin to avoid duplicates
            $permissionModel->where('role_id', (int) $admin['id'])->delete();

            $dataToInsert = [];
            foreach ($allMenus as $menu) {
                $dataToInsert[] = [
                    'role_id' => (int) $admin['id'],
                    'menu_id' => (int) $menu['id'],
                ];
            }

            if (!empty($dataToInsert)) {
                $permissionModel->insertBatch($dataToInsert);
            }
        }
    }
}