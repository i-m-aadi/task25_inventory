const Database = require("better-sqlite3");

const db = new Database("inventory.db");

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        supplier_id INTEGER,
        price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('STOCK_IN', 'STOCK_OUT')),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        stock_before INTEGER NOT NULL,
        stock_after INTEGER NOT NULL,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
    );
`);

// Insert sample suppliers
const supplierCount = db
    .prepare("SELECT COUNT(*) AS count FROM suppliers")
    .get();

if (supplierCount.count === 0) {
    const insertSupplier = db.prepare(`
        INSERT INTO suppliers (name, email, phone)
        VALUES (?, ?, ?)
    `);

    insertSupplier.run(
        "Tech Supplies Ltd.",
        "tech@example.com",
        "9876543210"
    );

    insertSupplier.run(
        "Global Electronics",
        "global@example.com",
        "9123456780"
    );
}

// Insert sample products
const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();

if (productCount.count === 0) {
    const insertProduct = db.prepare(`
        INSERT INTO products
        (name, sku, supplier_id, price, stock, low_stock_threshold)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertProduct.run(
        "Wireless Mouse",
        "WM001",
        1,
        599,
        25,
        10
    );

    insertProduct.run(
        "Mechanical Keyboard",
        "MK001",
        1,
        2499,
        8,
        10
    );

    insertProduct.run(
        "USB-C Cable",
        "UC001",
        2,
        399,
        40,
        15
    );
}

module.exports = db;