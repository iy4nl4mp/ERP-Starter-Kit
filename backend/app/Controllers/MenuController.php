<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\MenuModel;
use CodeIgniter\API\ResponseTrait;

class MenuController extends BaseController
{
    use ResponseTrait;

    // GET /api/menus
    public function index()
    {
        $model = new MenuModel();
        return $this->respond($model->findAll());
    }

    // GET /api/menus/(:num)
    public function show($id = null)
    {
        $model = new MenuModel();
        $data = $model->find($id);
        if (!$data) {
            return $this->failNotFound('No Menu Found');
        }
        return $this->respond($data);
    }

    // POST /api/menus
    public function create()
    {
        $model = new MenuModel();
        $json = $this->request->getJSON();

        $data = [
            'menu_name' => $json->menu_name,
            'parent_id' => $json->parent_id ?? 0,
            'url' => $json->url,
            'icon' => $json->icon ?? null,
            'menu_order' => $json->menu_order ?? 0
        ];

        if ($model->insert($data)) {
            $response = [
                'status'   => 201,
                'error'    => null,
                'messages' => [
                    'success' => 'Menu Created'
                ]
            ];
            return $this->respondCreated($response);
        }

        return $this->fail($model->errors());
    }

    // PUT /api/menus/(:num)
    public function update($id = null)
    {
        $model = new MenuModel();
        $json = $this->request->getJSON();

        $data = [
            'menu_name' => $json->menu_name,
            'parent_id' => $json->parent_id ?? 0,
            'url' => $json->url,
            'icon' => $json->icon ?? null,
            'menu_order' => $json->menu_order ?? 0
        ];

        if ($model->update($id, $data)) {
             $response = [
                'status'   => 200,
                'error'    => null,
                'messages' => [
                    'success' => 'Menu Updated'
                ]
            ];
            return $this->respond($response);
        }

        return $this->fail($model->errors());
    }

    // DELETE /api/menus/(:num)
    public function delete($id = null)
    {
        $model = new MenuModel();
        $data = $model->find($id);

        if ($data) {
            $model->delete($id);
            $response = [
                'status'   => 200,
                'error'    => null,
                'messages' => [
                    'success' => 'Menu Deleted'
                ]
            ];
            return $this->respondDeleted($response);
        }

        return $this->failNotFound('No Menu Found');
    }
}
