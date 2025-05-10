
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
    const addProductForm = document.getElementById("add-product-form");
    const productsTableBody = document.getElementById("products-tbody");
    const ordersTableBody = document.getElementById("order-history-tbody");
    const reviewsTableBody = document.getElementById("reviews-tbody");
    const noProductsMessage = document.getElementById("no-products");
    const noOrdersMessage = document.getElementById("no-orders");
    const noReviewsMessage = document.getElementById("no-reviews");
    const productsPagination = document.getElementById("products-pagination");
    const ordersPagination = document.getElementById("order-history-pagination");
    const reviewsPagination = document.getElementById("reviews-pagination");
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    console.log("Logged In User:", loggedInUser);

    if (!loggedInUser) {
        Swal.fire({
            icon: "error",
            title: "Not Logged In",
            text: "Please log in to access the dashboard.",
        }).then(() => window.location.href = "login.html");
        return;
    }
    const sellerId = loggedInUser.id;
    console.log("Seller ID:", sellerId);

    userName.innerText = loggedInUser.username;

//------------------------------------------------------

    let products = [];
    let orders = [];
    let reviews = [];
    const itemsPerPage = {
        products: 5,
        orders: 5,
        reviews: 5
    };
    let currentPage = {
        products: 1,
        orders: 1,
        reviews: 1
    };


// -------------------------------------------------------

    function toggleSidebar() {
        sidebar.classList.toggle("active");
        main.classList.toggle("with-sidebar");
        void main.offsetWidth; // Force reflow
    }

    hamburger.addEventListener("click", toggleSidebar);
    userName.addEventListener("click", toggleSidebar);

//--------------------------------------------------------



    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove("active");
            if (section.id === sectionId) {
                section.classList.add("active");
            }
        });
        sidebarLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href").substring(1) === sectionId);
        });
    }

    sidebarLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute("href").substring(1);
            showSection(sectionId);
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

//-------------------------------------------------------------

    function renderPagination(container, totalItems, itemsPerPage, type, callback) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        container.innerHTML = "";

        if (totalPages <= 1) return;

        const prevButton = document.createElement("button");
        prevButton.innerHTML = "«";
        prevButton.disabled = currentPage[type] === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage[type] > 1) {
                currentPage[type]--;
                callback();
            }
        });
        container.appendChild(prevButton);

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement("button");
            pageButton.textContent = i;
            pageButton.classList.toggle("active", i === currentPage[type]);
            pageButton.addEventListener("click", () => {
                currentPage[type] = i;
                callback();
            });
            container.appendChild(pageButton);
        }

        const nextButton = document.createElement("button");
        nextButton.innerHTML = "»";
        nextButton.disabled = currentPage[type] === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage[type] < totalPages) {
                currentPage[type]++;
                callback();
            }
        });
        container.appendChild(nextButton);
    }


//----------------------------------------------------------------------------------


    function fetchSellerProducts() {
        console.log(`Fetching products for seller_id=${sellerId}`);
        fetch(`${BASE_URL}/products?seller_id=${sellerId}`)
            .then(response => {
                console.log("Products response status:", response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                return response.json();
            })
            .then(data => {
                console.log("Products data:", data);
               
                products = data;  //property pf the object
                currentPage.products = 1; //intialize the page num
                renderProducts();
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                noProductsMessage.classList.remove("hidden");
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load products. Please try again later.'
                });
            });
    }

    function renderProducts() {
        console.log("Rendering products:", products);
        productsTableBody.innerHTML = "";
        const start = (currentPage.products - 1) * itemsPerPage.products;
        const end = start + itemsPerPage.products;
        const paginatedProducts = products.slice(start, end);
        console.log("Paginated products:", paginatedProducts);

        if (paginatedProducts.length === 0) {
            noProductsMessage.classList.remove("hidden");
            noProductsMessage.textContent = "No products found.";
        } else {
            noProductsMessage.classList.add("hidden");
            paginatedProducts.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product.name}</td>
                    <td>$${product.price}</td>
                    <td>${product.description}</td>
                    <td>
                        <button class="btn btn-warning edit-product" data-id="${product.id}">Edit</button>
                        <button class="btn btn-danger delete-product" data-id="${product.id}">Delete</button>
                    </td>
                `;
                productsTableBody.appendChild(row);
                row.querySelector(".edit-product").addEventListener("click", () => editProduct(product.id));
                row.querySelector(".delete-product").addEventListener("click", () => deleteProduct(product.id));
            });
        }

        renderPagination(productsPagination, products.length, itemsPerPage.products, 'products', renderProducts);
    }


//---------------------------------------------------------------------------------------------------------------------------------

    function fetchSellerOrders() {
        console.log(`Fetching orders for seller_id=${sellerId}`);
        fetch(`${BASE_URL}/orders?seller_id=${sellerId}`)
            .then(response => {
                console.log("Orders response status:", response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }
                return response.json();
            })
            .then(data => {
                console.log("Orders data:", data);
                orders = data;
                currentPage.orders = 1;
                renderOrders();
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                noOrdersMessage.classList.remove("hidden");
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load orders. Please try again later.'
                });
            });
    }

    function renderOrders() {
        console.log("Rendering orders:", orders);
        ordersTableBody.innerHTML = "";
        const start = (currentPage.orders - 1) * itemsPerPage.orders;
        const end = start + itemsPerPage.orders;
        const paginatedOrders = orders.slice(start, end);
        console.log("Paginated orders:", paginatedOrders);

        if (paginatedOrders.length === 0) {
            noOrdersMessage.classList.remove("hidden");
            noOrdersMessage.textContent = "No orders found.";
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
                        <button class="btn btn-warning update-order-status" data-id="${order.id}">Update Status</button>
                    </td>
                `;
                ordersTableBody.appendChild(row);
                row.querySelector(".update-order-status").addEventListener("click", () => updateOrderStatus(order.id));
            });
        }

        renderPagination(ordersPagination, orders.length, itemsPerPage.orders, 'orders', renderOrders);
    }

    function fetchReviews() {
        console.log(`Fetching reviews for seller_id=${sellerId}`);
        fetch(`${BASE_URL}/reviews?seller_id=${sellerId}`)
            .then(response => {
                console.log("Reviews response status:", response.status);
                if (!response.ok) {
                    throw new Error('Failed to fetch reviews');
                }
                return response.json();
            })
            .then(data => {
                console.log("Reviews data:", data);
                reviews = data;
                currentPage.reviews = 1;
                renderReviews();
            })
            .catch(error => {
                console.error('Error fetching reviews:', error);
                noReviewsMessage.classList.remove("hidden");
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load reviews. Please try again later.'
                });
            });
    }

    function renderReviews() {
        console.log("Rendering reviews:", reviews);
        reviewsTableBody.innerHTML = "";
        const start = (currentPage.reviews - 1) * itemsPerPage.reviews;
        const end = start + itemsPerPage.reviews;
        const paginatedReviews = reviews.slice(start, end);
        console.log("Paginated reviews:", paginatedReviews);

        if (paginatedReviews.length === 0) {
            noReviewsMessage.classList.remove("hidden");
            noReviewsMessage.textContent = "No reviews found.";
        } else {
            noReviewsMessage.classList.add("hidden");
            paginatedReviews.forEach(review => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${review.product_id}</td>
                    <td>${review.customer_id}</td>
                    <td>${review.rating} <i class="fas fa-star" style="color: #f1c40f;"></i></td>
                    <td>${review.review}</td>
                `;
                reviewsTableBody.appendChild(row);
            });
        }

        renderPagination(reviewsPagination, reviews.length, itemsPerPage.reviews, 'reviews', renderReviews);
    }

    function editProduct(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        Swal.fire({
            title: "Edit Product",
            html: `
                <input id="edit-name" class="swal2-input" placeholder="Product Name" value="${product.name}">
                <input id="edit-price" class="swal2-input" placeholder="Price" type="number" step="0.01" value="${product.price}">
                <input id="edit-description" class="swal2-input" placeholder="Description" value="${product.description}">
                <input id="edit-image" class="swal2-input" placeholder="Image URL" value="${product.image}">
            `,
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Cancel",
            preConfirm: () => {
                const name = document.getElementById("edit-name").value;
                const price = parseFloat(document.getElementById("edit-price").value);
                const description = document.getElementById("edit-description").value;
                const image = document.getElementById("edit-image").value;
                if (!name || !price || !description || !image) {
                    Swal.showValidationMessage("All fields are required!");
                }
                return { name, price, description, image };
            }
        }).then(result => {
            if (result.isConfirmed) {
                fetch(`${BASE_URL}/products/${productId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.value)
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to update product');
                        return response.json();
                    })
                    .then(data => {
                        const index = products.findIndex(p => p.id === productId);
                        products[index] = { ...products[index], ...data };
                        renderProducts();
                        Swal.fire("Updated!", "Product has been updated.", "success");
                    })
                    .catch(error => {
                        console.error('Error updating product:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to update product. Please try again later.'
                        });
                    });
            }
        });
    }

    function deleteProduct(productId) {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel!"
        }).then(result => {
            if (result.isConfirmed) {
                fetch(`${BASE_URL}/products/${productId}`, {
                    method: 'DELETE'
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to delete product');
                        }
                        products = products.filter(p => p.id !== productId);
                        renderProducts();
                        Swal.fire("Deleted!", "Product has been deleted.", "success");
                    })
                    .catch(error => {
                        console.error('Error deleting product:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete product. Please try again later.'
                        });
                    });
            }
        });
    }

    function updateOrderStatus(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        Swal.fire({
            title: "Update Order Status",
            input: "select",
            inputOptions: {
                pending: "Pending",
                shipped: "Shipped",
                delivered: "Delivered"
            },
            inputValue: order.status,
            showCancelButton: true,
            confirmButtonText: "Update",
            cancelButtonText: "Cancel",
            preConfirm: (status) => {
                if (!status) {
                    Swal.showValidationMessage("Please select a status!");
                }
                return status;
            }
        }).then(result => {
            if (result.isConfirmed) {
                fetch(`${BASE_URL}/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: result.value })
                })
                    .then(response => {
                        if (!response.ok) throw new Error('Failed to update order status');
                        return response.json();
                    })
                    .then(data => {
                        const index = orders.findIndex(o => o.id === orderId);
                        orders[index] = { ...orders[index], ...data };
                        renderOrders();
                        Swal.fire("Updated!", "Order status has been updated.", "success");
                    })
                    .catch(error => {
                        console.error('Error updating order status:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to update order status. Please try again later.'
                        });
                    });
            }
        });
    }

    addProductForm.addEventListener("submit", event => {
        event.preventDefault();
        const newProduct = {
            name: document.getElementById("product-name").value,
            price: parseFloat(document.getElementById("product-price").value),
            description: document.getElementById("product-description").value,
            image: document.getElementById("product-image").value,
            seller_id: sellerId,
            approved: false
        };

        fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add product');
                }
                return response.json();
            })
            .then(data => {
                products.push(data);
                renderProducts();
                addProductForm.reset();
                Swal.fire("Added!", "Product has been added.", "success");
            })
            .catch(error => {
                console.error('Error adding product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to add product. Please try again later.'
                });
            });
    });

    // Initialize the dashboard
    showSection("product-management-section");
    fetchSellerProducts();
    fetchSellerOrders();
    fetchReviews();
});
