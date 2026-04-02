const API_URL = "https://unasemeje.onrender.com";

function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
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
    if (data.error) {
      alert(data.error);
    } else {
      alert(data.message);
      window.location.href = "index.html";
    }
  })
  .catch(err => {
    console.error(err);
    alert("Registration failed");
  });
}
