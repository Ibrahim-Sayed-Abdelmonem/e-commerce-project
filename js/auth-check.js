// Check if user is logged in
function checkAuth() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "Please log in to access this page.",
            confirmButtonText: "Go to Login",
            confirmButtonColor: "#4f46e5"
        }).then(() => {
            window.location.href = "login.html";
        });
        return false;
    }
    return true;
}

// Check if user has the correct role for the page
function checkRole(allowedRoles) {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser || !allowedRoles.includes(loggedInUser.role)) {
        Swal.fire({
            icon: "error",
            title: "Access Denied",
            text: "You don't have permission to access this page.",
            confirmButtonText: "Go to Home",
            confirmButtonColor: "#4f46e5"
        }).then(() => {
            window.location.href = "index.html";
        });
        return false;
    }
    return true;
}

// Run auth check when page loads
document.addEventListener("DOMContentLoaded", () => {
    // Get current page name
    const currentPage = window.location.pathname.split("/").pop();
    
    // Define allowed roles for each page
    const pageRoles = {
        "customer.html": ["customer"],
        "seller.html": ["seller"],
        "admin.html": ["admin"]
    };

    // Check if current page requires authentication
    if (pageRoles[currentPage]) {
        // First check if user is logged in
        if (checkAuth()) {
            // Then check if user has the correct role
            checkRole(pageRoles[currentPage]);
        }
    }
}); 