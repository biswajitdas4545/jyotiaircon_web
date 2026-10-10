<?php
declare(strict_types=1);

namespace Controllers;

use PDO;
use Utils\Response;

#[AllowDynamicProperties]
class ProductController {
    public function __construct(private PDO $db) {}

    public function getAll(): void {
        $stmt = $this->db->query("SELECT * FROM ac_product WHERE is_active = TRUE ORDER BY product_id DESC");
        Response::json($stmt->fetchAll(), 200, 'Products fetc successfully test for manirul.');
    }

    public function create(array $input): void {
        $stmt = $this->db->prepare("INSERT INTO ac_product (sku, brand_name, model_number, product_title, ac_type, capacity_tons, mrp, selling_price, stock_quantity) VALUES (:s, :b, :m, :t, :type, :cap, :mrp, :sp, :stock)");
        $stmt->execute([
            's'     => $input['sku'] ?? '',
            'b'     => $input['brand_name'] ?? '',
            'm'     => $input['model_number'] ?? '',
            't'     => $input['product_title'] ?? '',
            'type'  => $input['ac_type'] ?? 'Split',
            'cap'   => $input['capacity_tons'] ?? 1.5,
            'mrp'   => $input['mrp'] ?? 0,
            'sp'    => $input['selling_price'] ?? 0,
            'stock' => $input['stock_quantity'] ?? 0
        ]);
        Response::json(['product_id' => $this->db->lastInsertId()], 201, 'Product created successfully.');
    }
}