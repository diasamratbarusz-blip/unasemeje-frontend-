const API_URL = "https://your-backend-url/api"; // CHANGE THIS

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
