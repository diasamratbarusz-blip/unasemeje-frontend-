const API_URL = "https://unasemeje.onrender.com";

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
      alert("Login successful");
    } else {
      alert("Login failed");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error connecting to server");
  });
}
