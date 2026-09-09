# 📦 Inventory Management System

A full-stack Inventory Management System built using **HTML5, CSS3, JavaScript, Node.js, Express.js, and SQLite**.

The application allows users to manage products, suppliers, stock levels, stock-in/stock-out transactions, transaction history, and low-stock alerts.

---

## 📌 Project Overview

The Inventory Management System is designed to help businesses track their inventory efficiently.

The system provides:

- Product catalog management
- Supplier management
- Real-time stock tracking
- Stock-in transactions
- Stock-out transactions
- Transaction history
- Low-stock alerts
- Configurable stock thresholds
- Dashboard statistics
- REST API-based backend
- SQLite relational database

A key feature of the system is that **stock levels are updated through transactions rather than being directly edited**.

---

## 🎯 Objectives

The main objectives of this project are:

1. Practice relational database design.
2. Implement REST API architecture.
3. Learn transaction-based inventory management.
4. Maintain a complete history of stock changes.
5. Implement configurable low-stock alerts.
6. Practice frontend-backend integration.
7. Work with SQLite using Node.js.
8. Implement database relationships and constraints.

---

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- SQLite
- better-sqlite3

### Other Tools

- REST API
- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```text
inventory-management-system/
│
├── server.js
├── package.json
├── package-lock.json
├── inventory.db
│
├── database/
│   └── database.js
│
└── public/
    ├── index.html
    ├── style.css
    └── script.js