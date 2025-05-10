document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("product-catalog");
    const searchInput = document.getElementById('search-input');
    let allProducts = []; // Store all products for searching

    // Simulate a logged-in user (you can replace this with your actual login logic)
    const isLoggedIn = localStorage.getItem("loggedInUser") !== null;

    // Fetch products from db.json
    fetch("db.json")
        .then(response => response.json())
        .then(data => {
            allProducts = data.products;
            displayProducts(allProducts);
        })
        .catch(err => console.error("Failed to fetch products:", err));

    // Display products function
    function displayProducts(products) {
        productList.innerHTML = ""; // Clear catalog
        
        products.forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price}</div>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-actions">
                        <button class="add-to-cart">Add to Cart</button>
                    </div>
                </div>
            `;
            productList.appendChild(productCard);

            // Add event listener for "Add to Cart" button
            const addToCartButton = productCard.querySelector(".add-to-cart");
            addToCartButton.addEventListener("click", () => {
                if (!isLoggedIn) {
                    Swal.fire({
                        icon: "warning",
                        title: "Login Required",
                        text: "You must log in first to add products to your cart.",
                        confirmButtonText: "Login Now",
                        showCancelButton: true,
                        cancelButtonText: "Cancel"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = "login.html";
                        }
                    });
                } else {
                    addToCart(product);
                }
            });
        });
    }

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );
        displayProducts(filteredProducts);
    });

    function addToCart(product) {
        console.log(`${product.name} added to the cart.`);
        Swal.fire({
            icon: "success",
            title: "Added to Cart",
            text: `${product.name} has been added to your cart!`,
        });
    }
});