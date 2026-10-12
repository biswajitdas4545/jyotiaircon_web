<?php
declare(strict_types=1);

namespace Utils;

#[AllowDynamicProperties]
class Response {
    public static function json(mixed $data = null, int $statusCode = 200, string $message = ''): void {
        http_response_code($statusCode);
        header("Content-Type: application/json; charset=UTF-8");

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin !== '') {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Vary: Origin');
        } else {
            header('Access-Control-Allow-Origin: *');
        }

        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Accept");

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            exit(0);
        }

        echo json_encode([
            'success' => $statusCode >= 200 && $statusCode < 300,
            'status'  => $statusCode,
            'message' => $message,
            'data'    => $data
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit();
    }
}