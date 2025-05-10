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
    const productCatalog = document.getElementById("product-catalog");
    const cartTableBody = document.getElementById("cart-tbody");
    const orderHistoryTableBody = document.getElementById("order-history-tbody");
    const reviewsTableBody = document.getElementById("reviews-tbody");
    const noOrdersMessage = document.getElementById("no-orders");
    const noCartItemsMessage = document.getElementById("no-cart-items");
    const noReviewsMessage = document.getElementById("no-reviews");
    const noProductsMessage = document.getElementById("no-products");
    const updateProfileForm = document.getElementById("update-profile-form");
    const searchBar = document.getElementById("search-bar");
    const reviewForm = document.getElementById("review-form");
    const checkoutButton = document.getElementById("checkout-button");
    const productsPagination = document.getElementById("products-pagination");
    const cartPagination = document.getElementById("cart-pagination");
    const orderHistoryPagination = document.getElementById("order-history-pagination");
    const reviewsPagination = document.getElementById("reviews-pagination");

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
        Swal.fire({
            icon: "error",
            title: "Not Logged In",
            text: "Please log in to access the dashboard.",
        }).then(() => window.location.href = "login.html");
        return;
    }
    const customerId = loggedInUser.id;
    userName.innerText = loggedInUser.username;

    let cart = [];
    let products = [];
    let orders = [];
    let reviews = [];
    const itemsPerPage = {
        products: 6,
        cart: 5,
        orders: 5,
        reviews: 5
    };
    let currentPage = {
        products: 1,
        cart: 1,
        orders: 1,
        reviews: 1
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
                console.log(`Previous clicked for ${section}, new page: ${currentPage[section]}`);
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
                console.log(`Page ${i} clicked for ${section}, new page: ${currentPage[section]}`);
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
                console.log(`Next clicked for ${section}, new page: ${currentPage[section]}`);
                updateFunction();
            }
        });
        container.appendChild(nextButton);
    }

//----------------------------------------------------------------------------------------------------------------

    function computeAverageRatingForProduct(productId) {
        const productReviews = reviews.filter(review => review.product_id == productId);
        if (productReviews.length === 0) return 0;
        const sum = productReviews.reduce((total, review) => total + parseInt(review.rating), 0);
        return sum / productReviews.length;
    }

    function getStarRatingHTML(rating, productId) {
        const roundedRating = Math.round(rating || 0);
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fa-star ${i <= roundedRating ? 'fas' : 'far empty'}"></i>`;
        }
        return `<div class="star-rating" data-product-id="${productId}">${stars}</div>`;
    }

    function getInteractiveRatingHTML(productId) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fa-star far" data-rating="${i}" data-product-id="${productId}"></i>`;
        }
        return `<div class="interactive-rating">${stars}</div>`;
    }

    function updateProductRating(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;
        product.average_rating = computeAverageRatingForProduct(productId);
        const ratingElement = document.querySelector(`.star-rating[data-product-id="${productId}"]`);
        if (ratingElement) {
            ratingElement.innerHTML = getStarRatingHTML(product.average_rating || 0, productId).replace(`<div class="star-rating" data-product-id="${productId}">`, '').replace('</div>', '');
        }
    }

    function submitRating(productId, rating) {
        const existingReview = reviews.find(review => review.product_id == productId && review.customer_id == customerId);
        if (existingReview) {
            Swal.fire({
                icon: "warning",
                title: "Already Rated",
                text: "You have already submitted a rating for this product.",
            });
            return;
        }

        fetch(`${BASE_URL}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId, rating, review: "", customer_id: customerId })
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to submit rating");
                return response.json();
            })
            .then(newReview => {
                reviews.push(newReview);
                updateProductRating(productId);
                Swal.fire({
                    icon: "success",
                    title: "Rating Submitted",
                    text: `You rated this product ${rating} star${rating > 1 ? 's' : ''}!`,
                });
            })
            .catch(error => {
                console.error("Error submitting rating:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to submit rating. Please try again.",
                });
            });
    }

//------------------------------------------------------------------------------------------------------------------    


    function fetchProducts(query = "") {
        console.log("Fetching products with query:", query);
        fetch(`${BASE_URL}/products`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch products");
                return response.json();
            })
            .then(data => {
                console.log("Products fetched:", data);
                products = query ? data.filter(product => product.name.toLowerCase().includes(query)) : data;
                if (products.length === 0) {
                    noProductsMessage.classList.remove("hidden");
                } else {
                    noProductsMessage.classList.add("hidden");
                    products.forEach(product => {
                        product.average_rating = computeAverageRatingForProduct(product.id);
                    });
                }
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
        console.log("Rendering products, count:", products.length);
        productCatalog.innerHTML = "";
        const start = (currentPage.products - 1) * itemsPerPage.products;
        const end = start + itemsPerPage.products;
        const paginatedProducts = products.slice(start, end);

        if (paginatedProducts.length === 0) {
            noProductsMessage.classList.remove("hidden");
            return;
        }
        noProductsMessage.classList.add("hidden");

        paginatedProducts.forEach(product => {
            console.log("Rendering product:", product.name);
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");
            productCard.innerHTML = `
                <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
                <div class="p-4">
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price}</p>
                    ${getStarRatingHTML(product.average_rating, product.id)}
                    ${getInteractiveRatingHTML(product.id)}
                    <button data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            productCatalog.appendChild(productCard);
            productCard.querySelector("button").addEventListener("click", () => addToCart(product));

            const stars = productCard.querySelectorAll(".interactive-rating .fa-star");
            stars.forEach(star => {
                star.addEventListener("click", () => {
                    const rating = parseInt(star.getAttribute("data-rating"));
                    const productId = star.getAttribute("data-product-id");
                    submitRating(productId, rating);
                });
            });
        });

        renderPagination(productsPagination, products.length, itemsPerPage.products, 'products', renderProducts);
    }

    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        currentPage.cart = 1;
        updateCart();
    }

    function updateCart() {
        cartTableBody.innerHTML = "";
        const start = (currentPage.cart - 1) * itemsPerPage.cart;
        const end = start + itemsPerPage.cart;
        const paginatedCart = cart.slice(start, end);

        if (paginatedCart.length === 0) {
            noCartItemsMessage.classList.remove("hidden");
        } else {
            noCartItemsMessage.classList.add("hidden");
            paginatedCart.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>$${item.price}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price * item.quantity}</td>
                    <td><button class="remove-item" data-id="${item.id}">Remove</button></td>
                `;
                cartTableBody.appendChild(row);
                row.querySelector(".remove-item").addEventListener("click", () => {
                    cart = cart.filter(cartItem => cartItem.id !== item.id);
                    currentPage.cart = 1;
                    updateCart();
                });
            });
        }

        renderPagination(cartPagination, cart.length, itemsPerPage.cart, 'cart', updateCart);
    }

    checkoutButton.addEventListener("click", () => {
        if (!loggedInUser || loggedInUser.role !== "customer") {
            Swal.fire({
                icon: "error",
                title: "Access Denied",
                text: "You must be logged in as a customer to proceed to checkout.",
            });
            return;
        }

        if (cart.length === 0) {
            Swal.fire({
                icon: "warning",
                title: "Empty Cart",
                text: "Your cart is empty. Please add some items before proceeding to checkout.",
            });
            return;
        }

        const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        const newOrder = {
            customer_id: customerId,
            products: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            })),
            total_price: totalPrice,
            status: "processing"
        };

        fetch(`${BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newOrder)
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to create the order.");
                return response.json();
            })
            .then(order => {
                Swal.fire({
                    icon: "success",
                    title: "Order Placed",
                    text: "Your order has been successfully placed!",
                });
                cart = [];
                currentPage.cart = 1;
                updateCart();
                fetchOrderHistory();
            })
            .catch(error => {
                console.error("Error:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An error occurred while processing your order. Please try again.",
                });
            });
    });

    function addToOrderHistory(order) {
        orders.push(order);
        renderOrderHistory();
    }

    function renderOrderHistory() {
        orderHistoryTableBody.innerHTML = "";
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
                    <td>$${order.total_price}</td>
                    <td>${order.status}</td>
                    <td><button class="track-order" data-id="${order.id}">Track</button></td>
                `;
                orderHistoryTableBody.appendChild(row);
                row.querySelector(".track-order").addEventListener("click", () => trackOrder(order.id));
            });
        }

        renderPagination(orderHistoryPagination, orders.length, itemsPerPage.orders, 'orders', renderOrderHistory);
    }

    function fetchOrderHistory() {
        if (!loggedInUser || loggedInUser.role !== "customer") {
            Swal.fire({
                icon: "error",
                title: "Access Denied",
                text: "You must be logged in as a customer to view order history.",
            }).then(() => window.location.href = "login.html");
            return;
        }

        fetch(`${BASE_URL}/orders?customer_id=${customerId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch orders");
                return response.json();
            })
            .then(data => {
                orders = data;
                currentPage.orders = 1;
                renderOrderHistory();
            })
            .catch(error => {
                console.error("Error fetching order history:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load order history. Please check your connection or try again later.",
                });
                noOrdersMessage.classList.remove("hidden");
            });
    }

    function trackOrder(orderId) {
        fetch(`${BASE_URL}/orders/${orderId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch order details");
                return response.json();
            })
            .then(order => {
                Swal.fire({
                    icon: "info",
                    title: `Order ID: ${order.id}`,
                    html: `<strong>Status:</strong> ${order.status}<br><strong>Total Price:</strong> $${order.total_price}`,
                });
            })
            .catch(error => {
                console.error("Error fetching order details:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Unable to track the order. Please try again later.",
                });
            });
    }

    function fetchReviews() {
        fetch(`${BASE_URL}/reviews?customer_id=${customerId}`)
            .then(response => {
                if (!response.ok) throw new Error("Failed to fetch reviews");
                return response.json();
            })
            .then(data => {
                reviews = data;
                currentPage.reviews = 1;
                renderReviews();
                products.forEach(product => updateProductRating(product.id));
            })
            .catch(error => {
                console.error("Error fetching reviews:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to load reviews. Please try again later.",
                });
                noReviewsMessage.classList.remove("hidden");
            });
    }

    function renderReviews() {
        reviewsTableBody.innerHTML = "";
        const start = (currentPage.reviews - 1) * itemsPerPage.reviews;
        const end = start + itemsPerPage.reviews;
        const paginatedReviews = reviews.slice(start, end);

        if (paginatedReviews.length === 0) {
            noReviewsMessage.classList.remove("hidden");
        } else {
            noReviewsMessage.classList.add("hidden");
            paginatedReviews.forEach(review => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${review.product_id}</td>
                    <td>${review.rating}</td>
                    <td>${review.review || 'No comment'}</td>
                `;
                reviewsTableBody.appendChild(row);
            });
        }

        renderPagination(reviewsPagination, reviews.length, itemsPerPage.reviews, 'reviews', renderReviews);
    }

    updateProfileForm.addEventListener("submit", event => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        fetch(`${BASE_URL}/users/${customerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to update profile");
                return response.json();
            })
            .then(() => {
                Swal.fire({
                    icon: "success",
                    title: "Profile Updated",
                    text: "Your profile has been successfully updated.",
                });
            })
            .catch(error => {
                console.error("Error updating profile:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to update profile. Please try again.",
                });
            });
    });

    searchBar.addEventListener("input", () => {
        const query = searchBar.value.toLowerCase();
        currentPage.products = 1;
        fetchProducts(query);
    });

    reviewForm.addEventListener("submit", event => {
        event.preventDefault();
        const productId = document.getElementById("product-id").value;
        const rating = document.getElementById("rating").value;
        const reviewText = document.getElementById("review-text").value;

        const existingReview = reviews.find(review => review.product_id == productId && review.customer_id == customerId);
        if (existingReview) {
            Swal.fire({
                icon: "warning",
                title: "Already Reviewed",
                text: "You have already submitted a review for this product.",
            });
            return;
        }

        fetch(`${BASE_URL}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: productId, rating, review: reviewText, customer_id: customerId })
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to submit review");
                return response.json();
            })
            .then(newReview => {
                reviews.push(newReview);
                updateProductRating(productId);
                renderReviews();
                Swal.fire({
                    icon: "success",
                    title: "Review Submitted",
                    text: "Your review has been successfully submitted.",
                });
                reviewForm.reset();
            })
            .catch(error => {
                console.error("Error submitting review:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to submit review. Please try again.",
                });
            });
    });

    fetchProducts();
    fetchOrderHistory();
    fetchReviews();
});