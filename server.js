const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./database/database");

const app = express();

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

/*
========================================
GET ALL PRODUCTS
========================================
*/

app.get("/api/products", (req, res) => {
    try {
        const products = db.prepare(`
            SELECT
                products.id,
                products.name,
                products.sku,
                products.price,
                products.stock,
                products.low_stock_threshold,
                suppliers.name AS supplier_name
            FROM products
            LEFT JOIN suppliers
            ON products.supplier_id = suppliers.id
            ORDER BY products.id DESC
        `).all();

        res.json(products);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
GET ALL SUPPLIERS
========================================
*/

app.get("/api/suppliers", (req, res) => {
    try {
        const suppliers = db
            .prepare("SELECT * FROM suppliers ORDER BY name")
            .all();

        res.json(suppliers);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
ADD SUPPLIER
========================================
*/

app.post("/api/suppliers", (req, res) => {
    try {
        const {
            name,
            email,
            phone
        } = req.body;

        if (!name) {
            return res.status(400).json({
                error: "Supplier name is required"
            });
        }

        const result = db.prepare(`
            INSERT INTO suppliers
            (name, email, phone)
            VALUES (?, ?, ?)
        `).run(
            name,
            email || "",
            phone || ""
        );

        res.status(201).json({
            message: "Supplier added successfully",
            id: result.lastInsertRowid
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
ADD PRODUCT
========================================
*/

app.post("/api/products", (req, res) => {
    try {
        const {
            name,
            sku,
            supplier_id,
            price,
            stock,
            low_stock_threshold
        } = req.body;

        if (!name || !sku) {
            return res.status(400).json({
                error: "Product name and SKU are required"
            });
        }

        const result = db.prepare(`
            INSERT INTO products
            (
                name,
                sku,
                supplier_id,
                price,
                stock,
                low_stock_threshold
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            name,
            sku,
            supplier_id || null,
            Number(price) || 0,
            Number(stock) || 0,
            Number(low_stock_threshold) || 10
        );

        res.status(201).json({
            message: "Product added successfully",
            id: result.lastInsertRowid
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {
            return res.status(400).json({
                error: "SKU already exists"
            });
        }

        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
STOCK IN
========================================
*/

app.post("/api/transactions/stock-in", (req, res) => {

    const transaction = db.transaction(() => {

        const {
            product_id,
            quantity
        } = req.body;

        const qty = Number(quantity);

        if (!product_id || !qty || qty <= 0) {
            throw new Error("Valid product and quantity are required");
        }

        const product = db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
        `).get(product_id);

        if (!product) {
            throw new Error("Product not found");
        }

        const stockBefore = product.stock;
        const stockAfter = stockBefore + qty;

        // Update stock
        db.prepare(`
            UPDATE products
            SET stock = ?
            WHERE id = ?
        `).run(
            stockAfter,
            product_id
        );

        // Log transaction
        db.prepare(`
            INSERT INTO transactions
            (
                product_id,
                type,
                quantity,
                stock_before,
                stock_after
            )
            VALUES (?, 'STOCK_IN', ?, ?, ?)
        `).run(
            product_id,
            qty,
            stockBefore,
            stockAfter
        );

        return {
            stockBefore,
            stockAfter
        };
    });

    try {

        const result = transaction();

        res.json({
            message: "Stock added successfully",
            ...result
        });

    } catch (error) {

        res.status(400).json({
            error: error.message
        });
    }
});


/*
========================================
STOCK OUT
========================================
*/

app.post("/api/transactions/stock-out", (req, res) => {

    const transaction = db.transaction(() => {

        const {
            product_id,
            quantity
        } = req.body;

        const qty = Number(quantity);

        if (!product_id || !qty || qty <= 0) {
            throw new Error("Valid product and quantity are required");
        }

        const product = db.prepare(`
            SELECT *
            FROM products
            WHERE id = ?
        `).get(product_id);

        if (!product) {
            throw new Error("Product not found");
        }

        const stockBefore = product.stock;

        if (qty > stockBefore) {
            throw new Error(
                `Insufficient stock. Available stock: ${stockBefore}`
            );
        }

        const stockAfter = stockBefore - qty;

        // Update stock
        db.prepare(`
            UPDATE products
            SET stock = ?
            WHERE id = ?
        `).run(
            stockAfter,
            product_id
        );

        // Log transaction
        db.prepare(`
            INSERT INTO transactions
            (
                product_id,
                type,
                quantity,
                stock_before,
                stock_after
            )
            VALUES (?, 'STOCK_OUT', ?, ?, ?)
        `).run(
            product_id,
            qty,
            stockBefore,
            stockAfter
        );

        return {
            stockBefore,
            stockAfter
        };
    });

    try {

        const result = transaction();

        res.json({
            message: "Stock removed successfully",
            ...result
        });

    } catch (error) {

        res.status(400).json({
            error: error.message
        });
    }
});


/*
========================================
TRANSACTION HISTORY
========================================
*/

app.get("/api/transactions", (req, res) => {

    try {

        const transactions = db.prepare(`
            SELECT
                transactions.id,
                transactions.product_id,
                products.name AS product_name,
                products.sku,
                transactions.type,
                transactions.quantity,
                transactions.stock_before,
                transactions.stock_after,
                transactions.transaction_date
            FROM transactions

            INNER JOIN products
            ON transactions.product_id = products.id

            ORDER BY transactions.transaction_date DESC
        `).all();

        res.json(transactions);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
TRANSACTION HISTORY FOR ONE PRODUCT
========================================
*/

app.get("/api/products/:id/transactions", (req, res) => {

    try {

        const transactions = db.prepare(`
            SELECT
                transactions.id,
                products.name AS product_name,
                products.sku,
                transactions.type,
                transactions.quantity,
                transactions.stock_before,
                transactions.stock_after,
                transactions.transaction_date

            FROM transactions

            INNER JOIN products
            ON transactions.product_id = products.id

            WHERE transactions.product_id = ?

            ORDER BY transactions.transaction_date DESC
        `).all(req.params.id);

        res.json(transactions);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
LOW STOCK PRODUCTS
========================================
*/

app.get("/api/alerts/low-stock", (req, res) => {

    try {

        const products = db.prepare(`
            SELECT
                products.id,
                products.name,
                products.sku,
                products.stock,
                products.low_stock_threshold
            FROM products

            WHERE products.stock <= products.low_stock_threshold

            ORDER BY products.stock ASC
        `).all();

        res.json(products);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
DASHBOARD STATISTICS
========================================
*/

app.get("/api/dashboard", (req, res) => {

    try {

        const totalProducts = db
            .prepare("SELECT COUNT(*) AS count FROM products")
            .get().count;

        const totalStock = db
            .prepare("SELECT COALESCE(SUM(stock), 0) AS total FROM products")
            .get().total;

        const lowStock = db.prepare(`
            SELECT COUNT(*) AS count
            FROM products
            WHERE stock <= low_stock_threshold
        `).get().count;

        const totalSuppliers = db
            .prepare("SELECT COUNT(*) AS count FROM suppliers")
            .get().count;

        res.json({
            totalProducts,
            totalStock,
            lowStock,
            totalSuppliers
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});


/*
========================================
START SERVER
========================================
*/

app.listen(PORT, () => {

    console.log(`
=========================================
 Inventory Management System
=========================================

 Server running at:
 http://localhost:${PORT}

=========================================
`);
});