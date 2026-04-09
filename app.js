async function loadServices() {
  const res = await fetch("http://localhost:5000/api/services");
  const data = await res.json();

  const list = document.getElementById("services");

  data.forEach(s => {
    const li = document.createElement("li");
    li.innerText = `${s.service} - ${s.name} ($${s.rate})`;
    list.appendChild(li);
  });
}

async function placeOrder() {
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  const res = await fetch("http://localhost:5000/api/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ service, link, quantity })
  });

  const data = await res.json();
  alert("Order placed: " + JSON.stringify(data));
}

loadServices();
