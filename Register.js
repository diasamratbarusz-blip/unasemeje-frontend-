const API_URL = "https://unasemeje.onrender.com";

function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // ✅ Validation
  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  if (password.length < 4) {
    alert("Password must be at least 4 characters");
    return;
  }

  fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    // ✅ Handle backend errors
    if (data.error) {
      alert(data.error);
      return;
    }

    alert(data.message || "Registration successful");

    // Redirect to login page
    window.location.href = "index.html";
  })
  .catch(err => {
    console.error("Error:", err);
    alert("Registration failed. Check your connection or server.");
  });
}
