<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\RoleModel;
use App\Models\RolePermissionModel;
use CodeIgniter\API\ResponseTrait;

class RoleController extends BaseController
{
    use ResponseTrait;

    // GET /api/roles
    public function index()
    {
        $model = new RoleModel();
        return $this->respond($model->findAll());
    }

    // GET /api/roles/(:num)
    public function show($id = null)
    {
        $model = new RoleModel();
        $data = $model->find($id);
        if (!$data) {
            return $this->failNotFound('No Role Found');
        }
        return $this->respond($data);
    }

    // POST /api/roles
    public function create()
    {
        $model = new RoleModel();
        $json = $this->request->getJSON();

        $data = [
            'role_name' => $json->role_name,
            'description' => $json->description ?? null
        ];

        if ($model->insert($data)) {
            $response = [
                'status'   => 201,
                'error'    => null,
                'messages' => ['success' => 'Role Created']
            ];
            return $this->respondCreated($response);
        }

        return $this->fail($model->errors());
    }

    // PUT /api/roles/(:num)
    public function update($id = null)
    {
        $model = new RoleModel();
        $json = $this->request->getJSON();

        $data = [
            'role_name' => $json->role_name,
            'description' => $json->description ?? null
        ];

        if ($model->update($id, $data)) {
             $response = [
                'status'   => 200,
                'error'    => null,
                'messages' => ['success' => 'Role Updated']
            ];
            return $this->respond($response);
        }

        return $this->fail($model->errors());
    }

    // DELETE /api/roles/(:num)
    public function delete($id = null)
    {
        $model = new RoleModel();
        $data = $model->find($id);

        if ($data) {
            $model->delete($id);
            $response = [
                'status'   => 200,
                'error'    => null,
                'messages' => ['success' => 'Role Deleted']
            ];
            return $this->respondDeleted($response);
        }

        return $this->failNotFound('No Role Found');
    }

    // GET /api/roles/(:num)/permissions
    public function getPermissions($role_id = null)
    {
        $permissionModel = new RolePermissionModel();
        $permissions = $permissionModel->where('role_id', $role_id)->findAll();
        return $this->respond($permissions);
    }

    // POST /api/roles/(:num)/permissions
    public function updatePermissions($role_id = null)
    {
        $permissionModel = new RolePermissionModel();
        $menu_ids = $this->request->getJSON()->menu_ids ?? [];

        // Delete existing permissions for the role
        $permissionModel->where('role_id', $role_id)->delete();

        // Insert new permissions
        if (!empty($menu_ids)) {
            $dataToInsert = [];
            foreach ($menu_ids as $menu_id) {
                $dataToInsert[] = [
                    'role_id' => $role_id,
                    'menu_id' => $menu_id
                ];
            }
            $permissionModel->insertBatch($dataToInsert);
        }

        return $this->respond(['status' => 200, 'message' => 'Permissions updated successfully']);
    }
}
