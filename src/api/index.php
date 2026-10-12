<?php
declare(strict_types=1);
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://jyotiairconditioning.in',
    'https://www.jyotiairconditioning.in',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = strtolower(parse_url($origin, PHP_URL_HOST) ?? '');
    $isLocalOrigin = preg_match('/^(localhost|127\.0\.0\.1)$/', $originHost) === 1;
    $isAllowedOrigin = in_array($origin, $allowedOrigins, true) || ($originHost === 'jyotiairconditioning.in') || ($originHost === 'www.jyotiairconditioning.in') || $isLocalOrigin;

    if ($isAllowedOrigin) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    } else {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header(
    'Access-Control-Allow-Headers: ' .
    'Content-Type, X-Requested-With, Accept'
);
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
spl_autoload_register(function ($class) {
    $path = __DIR__ . '/' . str_replace('\\', '/', $class) . '.php';
    if (file_exists($path)) {
        require_once $path;
    }
});

use Config\Database;
use Utils\Response;
use Controllers\AuthController;
use Controllers\ProductController;
use Controllers\CustomerController;
use Controllers\EmployeeController;
use Controllers\ServiceController;
use Controllers\ComplaintController;

$db = Database::getConnection();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput ?: '{}', true) ?? [];

// Router
if (str_contains($uri, '/api/auth/register') && $method === 'POST') {
    (new AuthController($db))->register($body);
} 
elseif (str_contains($uri, '/api/auth/login') && $method === 'POST') {
    (new AuthController($db))->login($body);
} 
elseif (str_contains($uri, '/api/auth/refresh') && $method === 'POST') {
    (new AuthController($db))->refresh($body);
} 
elseif (str_contains($uri, '/api/auth/logout') && $method === 'POST') {
    (new AuthController($db))->logout($body);
} 
// API Endpoints
elseif (str_contains($uri, '/api/products')) {
    $controller = new ProductController($db);
    $method === 'POST' ? $controller->create($body) : $controller->getAll();
} 
elseif (preg_match('~/(?:customers?)/?$~', $uri)) {
    $controller = new CustomerController($db);
    if ($method === 'POST') {
        $controller->create($body);
    } elseif ($method === 'GET') {
        $controller->getAll();
    } else {
        Response::json(null, 405, 'Method not allowed for this customer endpoint.');
    }
}
elseif (str_ends_with($uri, '/api/getAll') && $method === 'GET') {
    (new EmployeeController($db))->getAll();
} 
elseif (preg_match('~/(?:employees|employes)/(\d+)/?$~', $uri, $employeeMatch)) {
    $controller = new EmployeeController($db);
    $employeeId = (int)$employeeMatch[1];

    if ($method === 'GET') {
        $controller->getById($employeeId);
    } elseif ($method === 'PUT') {
        $controller->update($employeeId, $body);
    } else {
        Response::json(null, 405, 'Method not allowed for this employee endpoint.');
    }
} 
elseif (str_contains($uri, '/api/employees') || str_contains($uri, '/api/employes')) {
    $controller = new EmployeeController($db);
    if ($method === 'POST') {
        $controller->create($body);
    } elseif ($method === 'GET') {
        $controller->getAll();
    } else {
        Response::json(null, 405, 'Method not allowed for this employee endpoint.');
    }
} 
elseif (str_contains($uri, '/api/service-slots')) {
    $controller = new ServiceController($db);
    $method === 'POST' ? $controller->createSlot($body) : $controller->getSlots();
} 
elseif (str_contains($uri, '/api/complaints')) {
    $controller = new ComplaintController($db);
    $method === 'POST' ? $controller->create($body) : $controller->getAll();
} 
else {
    Response::json(null, 404, 'Endpoint not found.');
}