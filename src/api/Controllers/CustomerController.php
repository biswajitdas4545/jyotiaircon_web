<?php
declare(strict_types=1);

namespace Controllers;

use PDO;
use Utils\Response;

#[AllowDynamicProperties]
class CustomerController {
    public function __construct(private PDO $db) {}

    public function getAll(): void {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $size = min(100, max(1, (int)($_GET['size'] ?? $_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $size;

        $totalRecords = (int)$this->db->query("SELECT COUNT(*) FROM ac_customer")->fetchColumn();
        $stmt = $this->db->prepare(
            "SELECT customer_id, full_name, email, phone, address, purchase_date, ac_model, total_price
             FROM ac_customer
             ORDER BY customer_id DESC
             LIMIT :size OFFSET :offset"
        );
        $stmt->bindValue(':size', $size, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        Response::json([
            'customers' => $stmt->fetchAll(),
            'total_count' => $totalRecords,
            'page' => $page,
            'size' => $size
        ], 200, 'Customers fetched successfully.');
    }

    public function create(array $input): void {
        $stmt = $this->db->prepare("INSERT INTO ac_customer (full_name, email, phone, address, purchase_date, ac_model, total_price) VALUES (:f, :e, :p, :a, :pd, :m, :tp)");
        $stmt->execute([
            'f'  => $input['full_name'] ?? '',
            'e'  => $input['email'] ?? '',
            'p'  => $input['phone'] ?? '',
            'a'  => $input['address'] ?? '',
            'pd' => $input['purchase_date'] ?? date('Y-m-d'),
            'm'  => $input['ac_model'] ?? '',
            'tp' => $input['total_price'] ?? 0.00
        ]);
        Response::json(['customer_id' => $this->db->lastInsertId()], 201, 'Customer added successfully.');
    }
}