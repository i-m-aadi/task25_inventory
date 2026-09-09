const API = "/api";

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.documentElement.dataset.theme = isDark ? "dark" : "light";

    if (!themeToggle) {
        return;
    }

    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent =
        isDark ? "Light mode" : "Dark mode";
}

applyTheme(localStorage.getItem("inventory-theme") || "light");

themeToggle?.addEventListener("click", () => {
    const nextTheme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";

    localStorage.setItem("inventory-theme", nextTheme);
    applyTheme(nextTheme);
});


/*
========================================
LOAD DASHBOARD
========================================
*/

async function loadDashboard() {

    try {

        const response = await fetch(`${API}/dashboard`);

        const data = await response.json();

        document.getElementById("totalProducts")
            .textContent = data.totalProducts;

        document.getElementById("totalStock")
            .textContent = data.totalStock;

        document.getElementById("lowStock")
            .textContent = data.lowStock;

        document.getElementById("totalSuppliers")
            .textContent = data.totalSuppliers;

    } catch (error) {

        console.error(error);

    }
}


/*
========================================
LOAD SUPPLIERS
========================================
*/

async function loadSuppliers() {

    try {

        const response = await fetch(`${API}/suppliers`);

        const suppliers = await response.json();

        const select =
            document.getElementById("supplier");

        select.innerHTML = `
            <option value="">
                Select Supplier
            </option>
        `;

        suppliers.forEach(supplier => {

            const option =
                document.createElement("option");

            option.value = supplier.id;

            option.textContent = supplier.name;

            select.appendChild(option);

        });

    } catch (error) {

        console.error(error);

    }
}


/*
========================================
LOAD PRODUCTS
========================================
*/

async function loadProducts() {

    try {

        const response =
            await fetch(`${API}/products`);

        const products = await response.json();

        const table =
            document.getElementById("productTable");

        const select =
            document.getElementById("transactionProduct");

        table.innerHTML = "";

        select.innerHTML = `
            <option value="">
                Select Product
            </option>
        `;


        products.forEach(product => {

            const isLow =
                product.stock <=
                product.low_stock_threshold;


            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${product.id}</td>

                <td>
                    <strong>${escapeHTML(product.name)}</strong>
                </td>

                <td>${escapeHTML(product.sku)}</td>

                <td>
                    ${escapeHTML(
                        product.supplier_name || "N/A"
                    )}
                </td>

                <td>
                    ₹${Number(product.price).toFixed(2)}
                </td>

                <td>
                    <strong>${product.stock}</strong>
                </td>

                <td>
                    ${product.low_stock_threshold}
                </td>

                <td>

                    <span class="status ${
                        isLow ? "low" : "ok"
                    }">

                        ${
                            isLow
                            ? "LOW STOCK"
                            : "IN STOCK"
                        }

                    </span>

                </td>
            `;

            table.appendChild(row);


            const option =
                document.createElement("option");

            option.value = product.id;

            option.textContent =
                `${product.name} (${product.stock} available)`;

            select.appendChild(option);

        });

    } catch (error) {

        console.error(error);

    }
}


/*
========================================
ADD PRODUCT
========================================
*/

document
    .getElementById("productForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const product = {

            name:
                document.getElementById("productName")
                    .value.trim(),

            sku:
                document.getElementById("sku")
                    .value.trim(),

            supplier_id:
                document.getElementById("supplier")
                    .value || null,

            price:
                Number(
                    document.getElementById("price").value
                ) || 0,

            stock:
                Number(
                    document.getElementById("stock").value
                ) || 0,

            low_stock_threshold:
                Number(
                    document.getElementById("threshold").value
                ) || 10
        };


        try {

            const response = await fetch(
                `${API}/products`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(product)
                }
            );


            const data = await response.json();


            if (!response.ok) {

                alert(data.error);

                return;
            }


            alert("Product added successfully!");

            this.reset();

            document.getElementById("threshold")
                .value = 10;


            await refreshAll();

        } catch (error) {

            alert("Something went wrong.");

            console.error(error);
        }

    });


/*
========================================
STOCK IN
========================================
*/

async function stockIn() {

    const productId =
        document.getElementById(
            "transactionProduct"
        ).value;

    const quantity =
        Number(
            document.getElementById(
                "transactionQuantity"
            ).value
        );


    if (!productId || !quantity || quantity <= 0) {

        alert("Please select a product and enter a valid quantity.");

        return;
    }


    await performTransaction(
        "stock-in",
        productId,
        quantity
    );
}


/*
========================================
STOCK OUT
========================================
*/

async function stockOut() {

    const productId =
        document.getElementById(
            "transactionProduct"
        ).value;

    const quantity =
        Number(
            document.getElementById(
                "transactionQuantity"
            ).value
        );


    if (!productId || !quantity || quantity <= 0) {

        alert("Please select a product and enter a valid quantity.");

        return;
    }


    await performTransaction(
        "stock-out",
        productId,
        quantity
    );
}


/*
========================================
PERFORM TRANSACTION
========================================
*/

async function performTransaction(
    type,
    productId,
    quantity
) {

    try {

        const response = await fetch(
            `${API}/transactions/${type}`,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    product_id: Number(productId),

                    quantity: Number(quantity)

                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.error);

            return;
        }


        alert(data.message);


        document.getElementById(
            "transactionQuantity"
        ).value = "";


        await refreshAll();

    } catch (error) {

        console.error(error);

        alert("Transaction failed.");
    }
}


/*
========================================
LOAD TRANSACTIONS
========================================
*/

async function loadTransactions() {

    try {

        const response =
            await fetch(`${API}/transactions`);

        const transactions =
            await response.json();


        const table =
            document.getElementById(
                "transactionTable"
            );

        table.innerHTML = "";


        transactions.forEach(transaction => {

            const row =
                document.createElement("tr");


            const date =
                new Date(
                    transaction.transaction_date
                ).toLocaleString();


            const typeClass =
                transaction.type === "STOCK_IN"
                    ? "transaction-in"
                    : "transaction-out";


            const typeText =
                transaction.type === "STOCK_IN"
                    ? "STOCK IN"
                    : "STOCK OUT";


            row.innerHTML = `

                <td>${transaction.id}</td>

                <td>
                    ${escapeHTML(transaction.product_name)}
                </td>

                <td>
                    ${escapeHTML(transaction.sku)}
                </td>

                <td class="${typeClass}">
                    ${typeText}
                </td>

                <td>
                    ${transaction.quantity}
                </td>

                <td>
                    ${transaction.stock_before}
                </td>

                <td>
                    ${transaction.stock_after}
                </td>

                <td>
                    ${date}
                </td>

            `;


            table.appendChild(row);

        });

    } catch (error) {

        console.error(error);

    }
}


/*
========================================
LOAD LOW STOCK ALERTS
========================================
*/

async function loadAlerts() {

    try {

        const response =
            await fetch(`${API}/alerts/low-stock`);

        const products =
            await response.json();


        const container =
            document.getElementById("alerts");


        container.innerHTML = "";


        if (products.length === 0) {

            container.innerHTML = `
                <div class="alert">
                    No low-stock products. All inventory levels are healthy.
                </div>
            `;

            return;
        }


        products.forEach(product => {

            const alert =
                document.createElement("div");

            alert.className = "alert";


            alert.innerHTML = `

                <strong>
                    ⚠ ${escapeHTML(product.name)}
                </strong>

                <br>

                SKU: ${escapeHTML(product.sku)}

                <br>

                Current stock:
                <strong>${product.stock}</strong>

                |
                Threshold:
                <strong>${product.low_stock_threshold}</strong>

            `;


            container.appendChild(alert);

        });

    } catch (error) {

        console.error(error);

    }
}


/*
========================================
REFRESH EVERYTHING
========================================
*/

async function refreshAll() {

    await loadDashboard();

    await loadSuppliers();

    await loadProducts();

    await loadTransactions();

    await loadAlerts();
}


/*
========================================
HTML ESCAPE
========================================
*/

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/*
========================================
INITIAL LOAD
========================================
*/

document.addEventListener(
    "DOMContentLoaded",
    refreshAll
);