
function logout() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You will be logged out of your account.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, log me out!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = "http://localhost:3000";
    const sections = document.querySelectorAll("main section");
    const sidebarLinks = document.querySelectorAll("#sidebar ul li a");
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector("main");
    const hamburger = document.getElementById("hamburger");
    const userName = document.getElementById("user_name");
    const usersTableBody = document.getElementById("users-tbody");
    const productsTableBody = document.getElementById("products-tbody");
    const ordersTableBody = document.getElementById("orders-tbody");
    const noUsersMessage = document.getElementById("no-users");
    const noProductsMessage = document.getElementById("no-products");
    const noOrdersMessage = document.getElementById("no-orders");
    const usersPagination = document.getElementById("users-pagination");
    const productsPagination = document.getElementById("products-pagination");
    const ordersPagination = document.getElementById("orders-pagination");

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser || loggedInUser.role !== "admin") {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You must be logged in as an admin to access this page.",
        }).then(() => window.location.href = "login.html");
        return;
    }
    userName.innerText = loggedInUser.username;

    let users = [];
    let products = [];
    let orders = [];
    const itemsPerPage = {
        users: 6,
        products: 6,
        orders: 5
    };
    let currentPage = {
        users: 1,
        products: 1,
        orders: 1
    };

    function toggleSidebar() {
        sidebar.classList.toggle("active");
        main.classList.toggle("with-sidebar");
        void main.offsetWidth; // Force reflow
    }

    hamburger.addEventListener("click", toggleSidebar);
    userName.addEventListener("click", toggleSidebar);

    function showSection(sectionId) {
        sections.forEach(section => section.classList.remove("active"));
        sidebarLinks.forEach(link => link.classList.remove("active"));
        const targetSection = document.getElementById(sectionId);
        const targetLink = document.querySelector(`#sidebar ul li a[href='#${sectionId}']`);
        if (targetSection && targetLink) {
            targetSection.classList.add("active");
            targetLink.classList.add("active");
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute("href").substring(1);
            showSection(sectionId);
        });
    });

    if (sections.length > 0) {
        showSection(sections[0].id);
    }

    function renderPagination(container, totalItems, itemsPerPage, section, updateFunction) {
        container.innerHTML = "";
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return;

        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.disabled = currentPage[section] === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage[section] > 1) {
                currentPage[section]--;
                updateFunction();
            }
        });
        container.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = i;
            pageButton.classList.toggle("active", i === currentPage[section]);
            pageButton.addEventListener("click", () => {
                currentPage[section] = i;
                updateFunction();
            });
            container.appendChild(pageButton);
        }

        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.disabled = currentPage[section] === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage[section] < totalPages) {
                currentPage[section]++;
                updateFunction();
            }
        });
        container.appendChild(nextButton);
    }

    function fetchUsers() {
        fetch(`${BASE_URL}/users`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch users");
                return response.json();
            })
            .then(data => {
                console.log("Users fetched:", data);
                users = data;
                currentPage.users = 1;
                renderUsers();
            })
            .catch(error => {
                console.error("Error fetching users:", error);
                noUsersMessage.classList.remove("hidden");
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load users. Please try again later.",
                });
            });
    }

    function renderUsers() {
        usersTableBody.innerHTML = "";
        const start = (currentPage.users - 1) * itemsPerPage.users;
        const end = start + itemsPerPage.users;
        const paginatedUsers = users.slice(start, end);

        if (paginatedUsers.length === 0) {
            noUsersMessage.classList.remove("hidden");
        } else {
            noUsersMessage.classList.add("hidden");
            paginatedUsers.forEach(user => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="edit-user edit-btn" data-id="${user.id}">Edit</button>
                        <button class="delete-user delete-btn" data-id="${user.id}">Delete</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
                row.querySelector(".edit-user").addEventListener("click", editUser);
                row.querySelector(".delete-user").addEventListener("click", deleteUser);
            });
        }

        renderPagination(usersPagination, users.length, itemsPerPage.users, 'users', renderUsers);
    }

    function fetchProducts() {
        fetch(`${BASE_URL}/products`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch products");
                return response.json();
            })
            .then(data => {
                console.log("Products fetched:", data);
                products = data;
                currentPage.products = 1;
                renderProducts();
            })
            .catch(error => {
                console.error("Error fetching products:", error);
                noProductsMessage.classList.remove("hidden");
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load products. Please try again later.",
                });
            });
    }

    function renderProducts() {
        productsTableBody.innerHTML = "";
        const start = (currentPage.products - 1) * itemsPerPage.products;
        const end = start + itemsPerPage.products;
        const paginatedProducts = products.slice(start, end);

        if (paginatedProducts.length === 0) {
            noProductsMessage.classList.remove("hidden");
        } else {
            noProductsMessage.classList.add("hidden");
            paginatedProducts.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>$${product.price}</td>
                    <td>${product.category}</td>
                    <td>${product.seller_id}</td>
                    <td>${product.approved ? "Yes" : "No"}</td>
                    <td>
                        <button class="approve-product approve-btn" data-id="${product.id}" ${product.approved ? "disabled" : ""}>Approve</button>
                        <button class="edit-product edit-btn" data-id="${product.id}">Edit</button>
                        <button class="delete-product delete-btn" data-id="${product.id}">Delete</button>
                    </td>
                `;
                productsTableBody.appendChild(row);
                row.querySelector(".approve-product").addEventListener("click", approveProduct);
                row.querySelector(".edit-product").addEventListener("click", editProduct);
                row.querySelector(".delete-product").addEventListener("click", deleteProduct);
            });
        }

        renderPagination(productsPagination, products.length, itemsPerPage.products, 'products', renderProducts);
    }

    function fetchOrders() {
        fetch(`${BASE_URL}/orders`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch orders");
                return response.json();
            })
            .then(data => {
                console.log("Orders fetched:", data);
                orders = data;
                currentPage.orders = 1;
                renderOrders();
            })
            .catch(error => {
                console.error("Error fetching orders:", error);
                noOrdersMessage.classList.remove("hidden");
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load orders. Please try again later.",
                });
            });
    }

    function renderOrders() {
        ordersTableBody.innerHTML = "";
        const start = (currentPage.orders - 1) * itemsPerPage.orders;
        const end = start + itemsPerPage.orders;
        const paginatedOrders = orders.slice(start, end);

        if (paginatedOrders.length === 0) {
            noOrdersMessage.classList.remove("hidden");
        } else {
            noOrdersMessage.classList.add("hidden");
            paginatedOrders.forEach(order => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customer_id}</td>
                    <td>$${order.total_price}</td>
                    <td>${order.status}</td>
                    <td>
                        <button class="update-order-status" data-id="${order.id}">Update Status</button>
                    </td>
                `;
                ordersTableBody.appendChild(row);
                row.querySelector(".update-order-status").addEventListener("click", updateOrderStatus);
            });
        }

        renderPagination(ordersPagination, orders.length, itemsPerPage.orders, 'orders', renderOrders);
    }

    function editUser(event) {
        const userId = event.target.dataset.id;
        fetch(`${BASE_URL}/users/${userId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch user");
                return response.json();
            })
            .then(user => {
                Swal.fire({
                    title: "Edit User",
                    html: `
                        <input id="username" class="swal2-input" placeholder="Username" value="${user.username}">
                        <select id="role" class="swal2-input">
                            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
                            <option value="seller" ${user.role === "seller" ? "selected" : ""}>Seller</option>
                            <option value="customer" ${user.role === "customer" ? "selected" : ""}>Customer</option>
                        </select>
                    `,
                    showCancelButton: true,
                    confirmButtonText: "Save",
                    cancelButtonText: "Cancel",
                    preConfirm: () => {
                        const username = document.getElementById("username").value;
                        const role = document.getElementById("role").value;

                        if (!username) {
                            Swal.showValidationMessage("Username cannot be empty!");
                        }

                        return { username, role };
                    }
                }).then(result => {
                    if (result.isConfirmed) {
                        const { username, role } = result.value;
                        fetch(`${BASE_URL}/users/${userId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username, role })
                        })
                            .then(response => {
                                if (!response.ok) throw new Error("Failed to update user");
                                Swal.fire({
                                    icon: "success",
                                    title: "User Updated",
                                    text: "User details updated successfully!",
                                });
                                fetchUsers();
                            })
                            .catch(error => {
                                console.error("Error updating user:", error);
                                Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: "Failed to update user. Please try again.",
                                });
                            });
                    }
                });
            })
            .catch(error => {
                console.error("Error fetching user:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load user details. Please try again.",
                });
            });
    }

    function deleteUser(event) {
        const userId = event.target.dataset.id;
        Swal.fire({
            title: "Are you sure?",
            text: "This action will delete the user. You won't be able to undo this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${BASE_URL}/users/${userId}`, { method: "DELETE" })
                    .then(response => {
                        if (!response.ok) throw new Error("Failed to delete user");
                        Swal.fire({
                            icon: "success",
                            title: "Deleted",
                            text: `User with ID ${userId} has been deleted successfully.`,
                        });
                        fetchUsers();
                    })
                    .catch(error => {
                        console.error("Error deleting user:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Failed to delete user. Please try again.",
                        });
                    });
            }
        });
    }

    function approveProduct(event) {
        const productId = event.target.dataset.id;
        fetch(`${BASE_URL}/products/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approved: true })
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to approve product");
                Swal.fire({
                    icon: "success",
                    title: "Product Approved",
                    text: `Product with ID ${productId} has been approved.`,
                });
                fetchProducts();
            })
            .catch(error => {
                console.error("Error approving product:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to approve product. Please try again.",
                });
            });
    }

    function editProduct(event) {
        const productId = event.target.dataset.id;
        fetch(`${BASE_URL}/products/${productId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch product");
                return response.json();
            })
            .then(product => {
                Swal.fire({
                    title: "Edit Product",
                    html: `
                        <input id="product-name" class="swal2-input" placeholder="Product Name" value="${product.name}">
                        <input id="product-price" class="swal2-input" placeholder="Product Price" type="number" value="${product.price}">
                        <input id="product-category" class="swal2-input" placeholder="Product Category" value="${product.category}">
                    `,
                    showCancelButton: true,
                    confirmButtonText: "Save",
                    cancelButtonText: "Cancel",
                    preConfirm: () => {
                        const name = document.getElementById("product-name").value;
                        const price = document.getElementById("product-price").value;
                        const category = document.getElementById("product-category").value;

                        if (!name || !price || !category) {
                            Swal.showValidationMessage("All fields are required!");
                        }

                        return { name, price, category };
                    }
                }).then(result => {
                    if (result.isConfirmed) {
                        const { name, price, category } = result.value;
                        fetch(`${BASE_URL}/products/${productId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, price, category })
                        })
                            .then(response => {
                                if (!response.ok) throw new Error("Failed to update product");
                                Swal.fire({
                                    icon: "success",
                                    title: "Product Updated",
                                    text: "Product details updated successfully!",
                                });
                                fetchProducts();
                            })
                            .catch(error => {
                                console.error("Error updating product:", error);
                                Swal.fire({
                                    icon: "error",
                                    title: "Error",
                                    text: "Failed to update product. Please try again.",
                                });
                            });
                    }
                });
            })
            .catch(error => {
                console.error("Error fetching product:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load product details. Please try again.",
                });
            });
    }

    function deleteProduct(event) {
        const productId = event.target.dataset.id;
        Swal.fire({
            title: "Are you sure?",
            text: "This action will delete the product. You won't be able to undo this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${BASE_URL}/products/${productId}`, { method: "DELETE" })
                    .then(response => {
                        if (!response.ok) throw new Error("Failed to delete product");
                        Swal.fire({
                            icon: "success",
                            title: "Deleted",
                            text: `Product with ID ${productId} has been deleted successfully.`,
                        });
                        fetchProducts();
                    })
                    .catch(error => {
                        console.error("Error deleting product:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Failed to delete product. Please try again.",
                        });
                    });
            }
        });
    }

    function updateOrderStatus(event) {
        const orderId = event.target.dataset.id;
        Swal.fire({
            title: "Update Status",
            input: "select",
            inputOptions: {
                shipped: "Shipped",
                delivered: "Delivered"
            },
            inputPlaceholder: "Select new status",
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Cancel",
            preConfirm: (newStatus) => {
                if (!newStatus) {
                    Swal.showValidationMessage("You must select a status!");
                }
                return newStatus;
            }
        }).then(result => {
            if (result.isConfirmed) {
                const newStatus = result.value;
                fetch(`${BASE_URL}/orders/${orderId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                })
                    .then(response => {
                        if (!response.ok) throw new Error("Failed to update order");
                        Swal.fire({
                            icon: "success",
                            title: "Order Updated",
                            text: "Order status updated successfully!",
                        });
                        fetchOrders();
                    })
                    .catch(error => {
                        console.error("Error updating order:", error);
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Failed to update order status. Please try again.",
                        });
                    });
            }
        });
    }

    fetchUsers();
    fetchProducts();
    fetchOrders();
});
