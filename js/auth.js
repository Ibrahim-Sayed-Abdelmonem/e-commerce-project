// auth.js
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    // Base URL for JSON Server
    const BASE_URL = "http://localhost:3000";

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");
            const emailError = document.getElementById("login-email-error");
            const passwordError = document.getElementById("login-password-error");

            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            emailError.style.display = "none";
            passwordError.style.display = "none";

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            let isValid = true;

            if (!emailPattern.test(email)) {
                emailError.style.display = "block";
                emailError.textContent = "Email must be valid like example@mail.com...";
                isValid = false;
            }

            if (password.length < 6) {
                passwordError.style.display = "block";
                passwordError.textContent = "Password must be at least 6 characters";
                isValid = false;
            }

            if (!isValid)
                return;

            try {
                const response = await fetch(`${BASE_URL}/users`);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const users = await response.json();

                const user = users.find(u =>
                    u.email.toLowerCase() === email.toLowerCase() &&
                    u.password === password
                );

                if (user) {
                    localStorage.setItem("loggedInUser", JSON.stringify({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        password: user.password,
                        role: user.role
                    }));

                    await Swal.fire({
                        title: `Welcome, ${user.username}!`,
                        text: `You're logged in as ${user.role}`,
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                        willClose: () => {
                            switch (user.role) {
                                case "admin":
                                    window.location.href = "admin.html";
                                    break;
                                case "customer":
                                    window.location.href = "customer.html";
                                    break;
                                case "seller":
                                    window.location.href = "seller.html";
                                    break;
                                default:
                                    window.location.href = "index.html";
                            }
                        }
                    });
                } else {

                    await Swal.fire({
                        title: 'Login Failed',
                        text: 'Invalid email or password',
                        icon: 'error',
                        confirmButtonText: 'Try Again',
                        confirmButtonColor: '#3498db'
                    });
                }
            } catch (error) {
                console.error("Login error:", error);
                await Swal.fire({
                    title: 'Error',
                    text: 'An error occurred. Please try again later.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3498db'
                });
            }
        });
    }


    // -------------------------------------------------------------------------------------------------------------------
    
    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;
            const password = document.getElementById("password").value.trim();
            const role = document.querySelector('input[name="role"]:checked')?.value;

            // Validation Errors
            let nameError = document.getElementById('user-name-error');
            let emailError = document.getElementById("email-error");
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            let phoneError = document.getElementById("phone-error");
            const phonePattern = /^(010|012|011|015)\d{8}$/;
            let passwordError = document.getElementById("password-error");
            let radioError = document.getElementById("radio-error");

            nameError.style.display = "none";
            emailError.style.display = "none";
            phoneError.style.display = "none";
            passwordError.style.display = "none";
            radioError.style.display = "none";

            let isValid = true;

            if (username.length < 3) {
                nameError.style.display = "block";
                nameError.textContent = "Name must be at least 3 characters...";
                isValid = false;
            }

            if (!email.match(emailPattern)) {
                emailError.style.display = "block";
                emailError.textContent = "Email must be valid like example@mail.com...";
                isValid = false;
            }

            if (!phone.match(phonePattern)) {
                phoneError.style.display = "block";
                phoneError.textContent = "Phone number must be 11 digits...";
                isValid = false;
            }

            if (password.length < 6) {
                passwordError.style.display = "block";
                passwordError.textContent = "Password must be at least 6...";
                isValid = false;
            }

            if (!role) {
                radioError.style.display = "block";
                radioError.textContent = "Please select a role...";
                isValid = false;
            }

            if (!isValid)
                return;

            const newUser = { username, email, phone, password, role };

            try {
                const response = await fetch(`${BASE_URL}/users`);
                const users = await response.json();

                const existingUser = users.find(
                    (user) => user.username === username
                );

                if (existingUser) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Name exists',
                        text: 'Name already exists. Please choose another one...',
                    });
                    return;
                }

                const existingEmail = users.find(
                    (user) => user.email === email
                );

                if (existingEmail) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Email exists',
                        text: 'Email already exists. Please choose another one...',
                    });
                    return;
                }

                const registerResponse = await fetch(`${BASE_URL}/users`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newUser),
                });

                if (registerResponse.ok) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Registration Successful!',
                        text: 'You will be redirected to login page',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                    });
                    window.location.href = "login.html";
                } else {
                    const errorData = await registerResponse.json();
                    throw new Error(errorData.message || 'Registration failed');
                }
            } catch (err) {
                console.error("Error during registration:", err.message);
                await Swal.fire({
                    icon: 'error',
                    title: 'Registration Failed',
                    text: 'An error occurred. Please try again.',
                });
            }
        });
    }
});