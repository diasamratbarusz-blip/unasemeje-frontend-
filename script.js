const API_URL = "https://unasemeje.onrender.com";

/* ================= NORMAL LOGIN ================= */
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      alert("Google login failed");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Google login error");
  });
}
