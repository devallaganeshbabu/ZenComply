const API_BASE_URL = "https://zencomply.onrender.com/api";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const organization = document.getElementById("organization").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const username = `${firstName} ${lastName}`;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, organization })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Signup failed");
            return;
        }

        alert("Account created! Redirecting to login...");
        window.location.href = "login.html";

    } catch (error) {
        console.error("Signup error:", error);
        alert("Error connecting to server");
    }
});
