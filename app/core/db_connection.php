<?php
// app/core/db_connection.php

// Database configuration
$host = 'localhost';
$dbname = 'emlabel_app';
$username = 'root'; // Replace with your database username
$password = ''; // Replace with your database password

// DSN (Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

// PDO options
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Create a new PDO instance
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    // Handle connection error
    throw new PDOException($e->getMessage(), (int)$e->getCode());
}

// The $pdo object is now ready to be used for database queries.
?>
