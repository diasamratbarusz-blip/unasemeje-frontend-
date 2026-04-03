const API_URL = "https://unasemeje.onrender.com";

/* ================= NORMAL LOGIN ================= */
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server");
  });
}

/* ================= GOOGLE LOGIN ================= */
function handleCredentialResponse(response) {
  console.log("Google credential:", response);

  fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: response.credential
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Backend response:", data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Google login failed");
    }
  })
  .catch(err => {
    console.error("Google login error:", err);
    alert("Google login error");
  });
}
