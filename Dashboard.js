import { supabase } from "./supabase.js";

/* Toast */
function toast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 3000);
}

/* Get user */
async function getUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = "index.html";
  }
  return data.user;
}

let user;

/* Logout */
window.logout = async function () {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};

/* Balance */
async function loadBalance() {
  const { data } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  document.getElementById("balance").innerText = data?.balance || 0;
}

/* Orders */
async function loadOrders() {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("orders");
  list.innerHTML = "";

  document.getElementById("totalOrders").innerText = data.length;

  data.forEach(o => {
    const li = document.createElement("li");
    li.innerText = `${o.service} - ${o.quantity} (${o.status})`;
    list.appendChild(li);
  });

  drawChart(data.length);
}

/* Create order */
window.createOrder = async function () {
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value;
  const quantity = document.getElementById("quantity").value;

  const { error } = await supabase.from("orders").insert([
    { user_id: user.id, service, link, quantity }
  ]);

  if (error) return toast(error.message);

  toast("Order created");
  loadOrders();
};

/* Deposit */
window.deposit = async function () {
  const amount = document.getElementById("amount").value;
  const code = document.getElementById("code").value;

  const { error } = await supabase.from("deposits").insert([
    { user_id: user.id, amount, code }
  ]);

  if (error) return toast(error.message);

  toast("Deposit submitted");
};

/* Chart */
let chart;

function drawChart(count) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Orders"],
      datasets: [
        {
          label: "Total Orders",
          data: [count]
        }
      ]
    }
  });
}

/* Realtime updates */
function realtime() {
  supabase
    .channel("orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      loadOrders();
    })
    .subscribe();
}

/* Init */
(async () => {
  user = await getUser();
  await loadBalance();
  await loadOrders();
  realtime();
})();
