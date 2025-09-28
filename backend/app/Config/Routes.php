<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', function ($routes) {
    // Auth
    $routes->post('register', 'AuthController::register');
    $routes->post('verify-otp', 'AuthController::verify_otp');
    $routes->post('login', 'AuthController::login');

    // Dashboard (Protected)
    $routes->get('dashboard/stats', 'DashboardController::getStats', ['filter' => 'jwt']);

    // Profile (Protected)
    $routes->get('profile', 'UserController::getProfile', ['filter' => 'jwt']);
    $routes->put('profile', 'UserController::updateProfile', ['filter' => 'jwt']);
    $routes->put('profile/change-password', 'UserController::changePassword', ['filter' => 'jwt']);

    // Menus (Protected)
    $routes->resource('menus', ['controller' => 'MenuController', 'filter' => 'jwt']);

    // Roles (Protected)
    $routes->resource('roles', ['controller' => 'RoleController', 'filter' => 'jwt']);
    $routes->get('roles/(:num)/permissions', 'RoleController::getPermissions/$1', ['filter' => 'jwt']);
    $routes->post('roles/(:num)/permissions', 'RoleController::updatePermissions/$1', ['filter' => 'jwt']);
});

// Handle CORS preflight requests for any API route to prevent 404 on OPTIONS
$routes->options('api/(:any)', static function () {
    return \Config\Services::response()
        ->setStatusCode(204);
});