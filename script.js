let products = [];
let cart = [];
let currentUser = null;

// Show/Hide Sections
function showSection(section) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.getElementById(section).style.display = 'block';
}

// Load Products
async function loadProducts() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    products = await res.json();
    displayProducts(products);
    loadCategories();
  } catch {
    document.getElementById("products").innerHTML = "<p>⚠️ Failed to load products.</p>";
  }
}

function displayProducts(list) {
  const container = document.getElementById("products");
  container.innerHTML = "";
  list.forEach(p => {
    container.innerHTML += `
      <div class="product" onclick="showDetails(${p.id})">
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title.substring(0, 20)}...</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button onclick="event.stopPropagation(); addToCart(${p.id})">Add to Cart</button>
      </div>
    `;
  });
}

function loadCategories() {
  const categories = ["all", ...new Set(products.map(p => p.category))];
  const filter = document.getElementById("categoryFilter");
  filter.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join("");
}

function showDetails(id) {
  const product = products.find(p => p.id === id);
  const container = document.getElementById("details-container");
  container.innerHTML = `
    <img src="${product.image}" alt="${product.title}" style="max-width:200px;">
    <h2>${product.title}</h2>
    <p><strong>Category:</strong> ${product.category}</p>
    <p>${product.description}</p>
    <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
    <button onclick="addToCart(${product.id})">Add to Cart</button>
  `;
  showSection("product-details");
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const item = cart.find(i => i.id === id);
  if (item) item.qty++;
  else cart.push({ ...product, qty: 1 });
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");
  cartItems.innerHTML = "";
  let total = 0, count = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    count += item.qty;
    cartItems.innerHTML += `
      <div>
        <span>${item.title.substring(0,20)}... - $${item.price.toFixed(2)} x ${item.qty}</span>
        <div>
          <button onclick="changeQty(${item.id}, -1)">-</button>
          <button onclick="changeQty(${item.id}, 1)">+</button>
          <button onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
    `;
  });

  cartCount.innerText = count;
  cartTotal.innerText = total.toFixed(2);
}

function changeQty(id, change) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += change;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  }
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCart();
}

// Checkout
document.getElementById("checkoutBtn").addEventListener("click", () => showSection("checkout"));
document.getElementById("checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  alert("✅ Order placed successfully!");
  cart = [];
  updateCart();
  showSection("home");
});

// Search & Filter
document.getElementById("searchBar").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  displayProducts(products.filter(p => p.title.toLowerCase().includes(term)));
});
document.getElementById("categoryFilter").addEventListener("change", (e) => {
  const cat = e.target.value;
  displayProducts(cat === "all" ? products : products.filter(p => p.category === cat));
});

// ---------------- AUTH ----------------
function toggleAuth(mode) {
  document.getElementById("signupSection").style.display = "none";
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("resetSection").style.display = "none";
  if (mode === "login") document.getElementById("loginSection").style.display = "block";
  else if (mode === "reset") document.getElementById("resetSection").style.display = "block";
  else document.getElementById("signupSection").style.display = "block";
}

function checkStrength(pass, target) {
  let strength = "Weak", color = "red";
  if (pass.length > 7 && /[A-Z]/.test(pass) && /\d/.test(pass) && /\W/.test(pass)) {
    strength = "Strong"; color = "green";
  } else if (pass.length > 5 && /[A-Z]/.test(pass) && /\d/.test(pass)) {
    strength = "Medium"; color = "orange";
  }
  document.getElementById(target).innerText = `Password Strength: ${strength}`;
  document.getElementById(target).style.color = color;
}
document.getElementById("signupPassword").addEventListener("input", e => checkStrength(e.target.value, "passwordStrength"));
document.getElementById("resetPassword").addEventListener("input", e => checkStrength(e.target.value, "resetStrength"));

// Signup
document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = signupName.value, email = signupEmail.value, phone = signupPhone.value;
  const password = signupPassword.value, confirmPassword = signupConfirmPassword.value;
  if (password !== confirmPassword) return authMessage("❌ Passwords do not match!");
  let users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.find(u => u.email === email || u.phone === phone)) return authMessage("⚠️ Account already exists!");
  users.push({ name, email, phone, password });
  localStorage.setItem("users", JSON.stringify(users));
  signupForm.reset(); passwordStrength.innerText = "";
  authMessage("✅ Signup successful! Please login.");
  toggleAuth("login");
});

// Login
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const loginUserVal = loginUser.value, passwordVal = loginPassword.value;
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => (u.email === loginUserVal || u.phone === loginUserVal) && u.password === passwordVal);
  if (!user) return authMessage("❌ Invalid login credentials!");
  currentUser = user;
  updateHeaderAfterLogin(user);
  authMessage(`✅ Welcome, ${user.name}!`);
  showSection("home");
});

// Reset Password
document.getElementById("resetForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const userInput = resetUser.value, newPass = resetPassword.value, confirmPass = resetConfirm.value;
  if (newPass !== confirmPass) return authMessage("❌ Passwords do not match!");
  let users = JSON.parse(localStorage.getItem("users")) || [];
  const idx = users.findIndex(u => u.email === userInput || u.phone === userInput);
  if (idx === -1) return authMessage("⚠️ No account found!");
  users[idx].password = newPass;
  localStorage.setItem("users", JSON.stringify(users));
  resetForm.reset(); resetStrength.innerText = "";
  authMessage("✅ Password reset successful! Please login.");
  toggleAuth("login");
});

function authMessage(msg) {
  document.getElementById("auth-message").innerText = msg;
}

// Update Header with Logout
function updateHeaderAfterLogin(user) {
  const authArea = document.getElementById("authArea");
  authArea.innerHTML = `
    <span style="font-weight:bold; margin-right:10px;">${user.name}</span>
    <button onclick="logout()" style="padding:6px 12px; background:#FF4500; border:none; border-radius:6px; color:white; cursor:pointer;">Logout</button>
  `;
}

function logout() {
  currentUser = null;
  cart = [];
  updateCart();
  const authArea = document.getElementById("authArea");
  authArea.innerHTML = `<a href="#" id="authLink" onclick="showSection('auth')">Signup/Login</a>`;
  showSection("home");
}

// Init
loadProducts();
showSection("home");
