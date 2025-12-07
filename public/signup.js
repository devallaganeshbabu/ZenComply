const API_BASE_URL = "http://localhost:3000/api";

document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Signup failed");
            return;
        }

        alert("Account created! Redirecting to login...");
        window.location.href = "index.html";

    } catch (error) {
        console.error("Signup error:", error);
        alert("Error connecting to server");
    }
});
