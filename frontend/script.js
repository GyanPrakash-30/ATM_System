document.addEventListener("DOMContentLoaded", function () {
  // === REGISTRATION ===
  const regForm = document.getElementById("regForm");
  if (regForm) {
    regForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      function validateForm() {
        const username = regForm.username.value.trim();
        const pin = regForm.pin.value.trim();
        const full_name = regForm.full_name.value.trim();
        const sex = regForm.sex.value;
        const dob = regForm.dob.value;
        const email = regForm.email.value.trim();
        const phone = regForm.phone.value.trim();
        const account_no = regForm.account_no.value.trim();
        const account_type = regForm.account_type.value.trim();
        const bank_name = regForm.bank_name.value.trim();
        const photo = regForm.photo.files[0];

        if (!username || !/^\d{4}$/.test(pin) || !full_name || !sex || !dob) return alert("Please fill all required fields.");
        const dobDate = new Date(dob);
        const age = new Date().getFullYear() - dobDate.getFullYear();
        if (age < 18) return alert("You must be at least 18.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Invalid email.");
        if (!/^\d{10}$/.test(phone)) return alert("Phone must be 10 digits.");
        if (!/^\d{16}$/.test(account_no)) return alert("Account number must be 16 digits.");
        if (!["saving", "current"].includes(account_type.toLowerCase())) return alert("Invalid account type.");
        if (!/^[a-zA-Z\s]+$/.test(bank_name)) return alert("Bank name must contain letters only.");
        if (!photo || !photo.type.startsWith("image/")) return alert("Upload a valid image.");
        return true;
      }

      if (!validateForm()) return;

      const formData = new FormData(regForm);
      try {
        const res = await fetch("http://127.0.0.1:5000/register", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        alert(data.message || "Registration completed.");
        if (res.ok) window.location.href = "index.html";
      } catch (err) {
        console.error("Registration Error:", err);
        alert("Error submitting form.");
      }
    });
  }

  // === LOGIN + WEBCAM FACE VERIFICATION ===
  // Elements
  const loginForm = document.getElementById('loginForm');
  const webcamContainer = document.getElementById('faceBox');
  const video = document.getElementById('webcam');
  const captureBtn = document.getElementById('captureFace');
  const usernameInput = document.getElementById('username');

  // Hide webcam section initially
  if (webcamContainer) webcamContainer.style.display = 'none';

  let stream = null;

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const pin = document.getElementById('pin').value.trim();

      if (!username || !pin) {
        alert('Please enter username and PIN');
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:5000/login", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, pin }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message);

          // Show webcam section on successful login
          webcamContainer.style.display = 'flex';

          // Start webcam stream if not started
          if (!stream) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
          }
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        alert('Error during login: ' + error.message);
      }
    });
  }

  // Handle face verification button click
  if (captureBtn) {
    captureBtn.addEventListener('click', async () => {
      if (!stream) {
        alert('Webcam not started');
        return;
      }

      // Create a canvas to capture current frame from video
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 PNG image
      const imageDataURL = canvas.toDataURL('image/png');

      const username = usernameInput.value.trim();

      try {
        const res = await fetch("http://127.0.0.1:5000/verify-face", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, image: imageDataURL }),
        });

        const data = await res.json();

        if (res.ok) {
          alert(data.message);
          localStorage.setItem("username", username);
          window.location.href = "atm.html";  // Redirect after face verification success
        } else {
          alert(data.message || 'Face verification failed');
        }
      } catch (error) {
        alert('Error during face verification: ' + error.message);
      }
    });
  }

  // === PROFILE LOAD ===
  async function getProfile() {
    const username = localStorage.getItem("username");
    const res = await fetch(`http://127.0.0.1:5000/profile?username=${username}`);
    const data = await res.json();

    if (res.ok) {
      document.getElementById("atmUsername").textContent = data.full_name;
      document.getElementById("profilePic").src = `http://127.0.0.1:5000/static/uploads/${data.photo}`;
      document.getElementById("balance").textContent = data.balance.toFixed(2);
      document.getElementById("profileDetails").innerHTML = `
        <strong>Name:</strong> ${data.full_name}<br>
        <strong>Email:</strong> ${data.email}<br>
        <strong>Phone:</strong> ${data.phone}<br>
        <strong>Sex:</strong> ${data.sex}<br>
        <strong>DOB:</strong> ${data.dob}<br>
        <strong>Account No:</strong> ${data.account_no}<br>
        <strong>Account Type:</strong> ${data.account_type}<br>
        <strong>Bank:</strong> ${data.bank_name}
      `;

      const tbody = document.getElementById("transactionBody");
      tbody.innerHTML = "";
      (data.transactions || []).reverse().forEach(tx => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${tx.date}</td><td>${tx.type}</td><td>$${tx.amount}</td>`;
        tbody.appendChild(tr);
      });
    } else {
      alert("Failed to load profile");
    }
  }

  // === DEPOSIT ===
  async function deposit() {
    const username = localStorage.getItem("username");
    const amount = parseFloat(document.getElementById("amount").value);
    if (!amount || amount <= 0) return alert("Enter valid amount");

    const res = await fetch("http://127.0.0.1:5000/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount }),
    });

    const data = await res.json();
    alert(data.message || "Deposit success");
    if (res.ok) getProfile();
  }

  // === WITHDRAW ===
  async function withdraw() {
    const username = localStorage.getItem("username");
    const amount = parseFloat(document.getElementById("amount").value);
    if (!amount || amount <= 0) return alert("Enter valid amount");

    const res = await fetch("http://127.0.0.1:5000/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount }),
    });

    const data = await res.json();
    alert(data.message || "Withdraw success");
    if (res.ok) getProfile();
  }

  // === LOGOUT ===
  window.logout = function () {
    localStorage.removeItem("username");
    window.location.href = "index.html";
  };

  // === PROFILE EDIT ===
  window.showEditModal = function () {
    document.getElementById("editModal").style.display = "flex";
  };

  window.closeEditModal = function () {
    document.getElementById("editModal").style.display = "none";
  };

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = localStorage.getItem("username");
      const formData = new FormData(this);
      formData.append("username", username);

      try {
        const res = await fetch("http://127.0.0.1:5000/update-profile", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        alert(data.message);
        if (res.ok) {
          closeEditModal();
          getProfile();
          this.reset();
        }
      } catch (err) {
        console.error("Update error:", err);
        alert("Profile update failed.");
      }
    });
  }

  // === PAGE LOAD CHECK ===
  window.onload = function () {
    if (window.location.pathname.includes("atm.html")) {
      const user = localStorage.getItem("username");
      if (!user) {
        window.location.href = "index.html";
      } else {
        getProfile();
      }
    }
  };

  // === UTILS ===
  window.deposit = deposit;
  window.withdraw = withdraw;
  window.simulateBiometric = function () {
    alert("Biometric login simulation (to be implemented)");
  };
});


// ATM Dashboard JavaScript
// Handles rendering of views and actions for deposit, withdraw, profile, etc.

const rightPanel = document.getElementById("rightPanel");
const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");
const btnTransactions = document.getElementById("btnTransactions");
const btnEditProfile = document.getElementById("btnEditProfile");
const btnChangePin = document.getElementById("btnChangePin");
const btnDeposit = document.getElementById("btnDeposit");
const btnWithdraw = document.getElementById("btnWithdraw");
const btnLogout = document.getElementById("btnLogout");

let userData = null;

async function fetchProfile() {
  const username = localStorage.getItem("username");
  if (!username) {
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch(`http://127.0.0.1:5000/profile?username=${username}`);
    if (!res.ok) throw new Error("Failed to load profile");
    userData = await res.json();
    return userData;
  } catch (err) {
    alert("Error loading profile: " + err.message);
    return null;
  }
}

function renderHome() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Welcome, ${userData.full_name}</h2>
      <p><strong>Account Number:</strong> ${userData.account_no}</p>
      <p><strong>Bank:</strong> ${userData.bank_name}</p>
      <p><strong>Balance:</strong> $${userData.balance.toFixed(2)}</p>
    </div>
  `;
}

function renderProfile() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Profile Details</h2>
      <img src="http://127.0.0.1:5000/static/uploads/${userData.photo}" class="profile-pic" />
      <p><strong>Name:</strong> ${userData.full_name}</p>
      <p><strong>Email:</strong> ${userData.email}</p>
      <p><strong>Phone:</strong> ${userData.phone}</p>
      <p><strong>Sex:</strong> ${userData.sex}</p>
      <p><strong>DOB:</strong> ${userData.dob}</p>
      <p><strong>Account Number:</strong> ${userData.account_no}</p>
      <p><strong>Account Type:</strong> ${userData.account_type}</p>
      <p><strong>Bank:</strong> ${userData.bank_name}</p>
      <p><strong>Balance:</strong> $${userData.balance.toFixed(2)}</p>
    </div>
  `;
}

function renderTransactions() {
  const transactions = userData.transactions || [];
  let rows = transactions.slice().reverse().map(tx => `
    <tr>
      <td>${tx.date}</td>
      <td>${tx.type}</td>
      <td>$${tx.amount.toFixed(2)}</td>
    </tr>
  `).join("");
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Transaction History</h2>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="3">No transactions found.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function renderEditProfile() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Edit Profile</h2>
      <form id="editProfileForm">
        <label>Full Name</label>
        <input type="text" name="full_name" value="${userData.full_name}" required />
        <label>Email</label>
        <input type="email" name="email" value="${userData.email}" required />
        <label>Phone</label>
        <input type="tel" name="phone" value="${userData.phone}" required />
        <label>Sex</label>
        <select name="sex" required>
          <option value="Male" ${userData.sex === "Male" ? "selected" : ""}>Male</option>
          <option value="Female" ${userData.sex === "Female" ? "selected" : ""}>Female</option>
          <option value="Other" ${userData.sex === "Other" ? "selected" : ""}>Other</option>
        </select>
        <label>Date of Birth</label>
        <input type="date" name="dob" value="${userData.dob}" required />
        <div class="form-button-group">
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append("username", userData.username);
    const res = await fetch("http://127.0.0.1:5000/update-profile", {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      userData = await fetchProfile();
      renderProfile();
    }
  });
}

function renderChangePin() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Change PIN</h2>
      <form id="changePinForm">
        <label>Current PIN</label>
        <input type="password" name="old_pin" required minlength="4" maxlength="4" pattern="\d{4}" />
        <label>New PIN</label>
        <input type="password" name="new_pin" required minlength="4" maxlength="4" pattern="\d{4}" />
        <label>Confirm New PIN</label>
        <input type="password" name="confirm_pin" required minlength="4" maxlength="4" pattern="\d{4}" />
        <div class="form-button-group">
          <button type="submit">Change PIN</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("changePinForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldPin = e.target.old_pin.value.trim();
    const newPin = e.target.new_pin.value.trim();
    const confirmPin = e.target.confirm_pin.value.trim();
    if (newPin !== confirmPin) return alert("New PINs do not match");
    const res = await fetch("http://127.0.0.1:5000/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userData.username, old_pin: oldPin, new_pin: newPin }),
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) e.target.reset();
  });
}

function renderDeposit() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Deposit Money</h2>
      <form id="depositForm">
        <label>Enter Amount:</label>
        <input type="number" id="depositAmount" required min="1" />
        <div class="form-button-group">
          <button type="submit">Deposit</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("depositForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("depositAmount").value);
    const res = await fetch("http://127.0.0.1:5000/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userData.username, amount }),
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      userData = await fetchProfile();
      renderHome();
    }
  });
}

function renderWithdraw() {
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Withdraw Money</h2>
      <form id="withdrawForm">
        <label>Enter Amount:</label>
        <input type="number" id="withdrawAmount" required min="1" />
        <div class="form-button-group">
          <button type="submit">Withdraw</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    const res = await fetch("http://127.0.0.1:5000/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: userData.username, amount }),
    });
    const result = await res.json();
    alert(result.message);
    if (res.ok) {
      userData = await fetchProfile();
      renderHome();
    }
  });
}

function logout() {
  localStorage.removeItem("username");
  window.location.href = "index.html";
}

btnHome.addEventListener("click", renderHome);
btnProfile.addEventListener("click", renderProfile);
btnTransactions.addEventListener("click", renderTransactions);
btnEditProfile.addEventListener("click", renderEditProfile);
btnChangePin.addEventListener("click", renderChangePin);
btnDeposit.addEventListener("click", renderDeposit);
btnWithdraw.addEventListener("click", renderWithdraw);
btnLogout.addEventListener("click", logout);

(async function init() {
  userData = await fetchProfile();
  if (userData) renderHome();
})();
