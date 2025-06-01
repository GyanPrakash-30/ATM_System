// === LOGIN FORM SUBMIT ===
console.log("✅ Login script loaded");

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (loginForm && emailInput && passwordInput) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // ✅ Stop default browser GET form submission

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        alert("Please enter email and password");
        return;
      }

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Login response:", data);

        if (res.ok) {
          localStorage.setItem("username", data.username);
          window.location.href = "/facebox";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Login error: " + err.message);
      }
    });
  }
});

// === FACE VERIFICATION IN facebox.html ===
document.addEventListener("DOMContentLoaded", () => {
  const webcamContainer = document.getElementById("faceBox");
  const video = document.getElementById("webcam");
  const captureBtn = document.getElementById("captureFace");

  let stream = null;
  console.log("📸 Webcam and verify button loaded");
  if (webcamContainer && captureBtn && video) {
    (async function startWebcam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
      } catch (err) {
        alert("Webcam error: " + err.message);
      }
    })();

    captureBtn.addEventListener("click", async () => {
      if (!stream) {
        alert("Webcam not started");
        return;
      }

      const username = localStorage.getItem("username");
      if (!username) {
        alert("No username found. Please login again.");
        return (window.location.href = "login.html");
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataURL = canvas.toDataURL("image/png");

      try {
        const res = await fetch("http://127.0.0.1:5000/verify-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, image: imageDataURL }),
        });

        const data = await res.json();
        alert(data.message);
        if (res.ok) {
          window.location.href = "/atm";
        } else {
          localStorage.removeItem("username");
          window.location.href = "login.html";
        }
      } catch (err) {
        alert("Face verification error: " + err.message);
        localStorage.removeItem("username");
        window.location.href = "login.html";
      }
    });
  }
});

// === VALIDATION FOR EMAIL AND PASSWORD ===
document.addEventListener("DOMContentLoaded", () => {
  const email = document.querySelector('input[type="email"]');
  const password = document.querySelector('input[type="password"]');

  if (email) {
    email.addEventListener("input", () => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
      email.style.borderColor = isValid ? "green" : "red";
    });
  }

  if (password) {
    password.addEventListener("input", () => {
      const strengthMessage = document.getElementById("strengthMessage");
      if (password.value.length < 6) {
        strengthMessage.textContent = "Weak";
        strengthMessage.style.color = "red";
        password.style.borderColor = "red";
      } else if (/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password.value)) {
        strengthMessage.textContent = "Medium";
        strengthMessage.style.color = "orange";
        password.style.borderColor = "orange";
      }
      if (/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&]).{8,}$/.test(password.value)) {
        strengthMessage.textContent = "Strong";
        strengthMessage.style.color = "green";
        password.style.borderColor = "green";
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const phoneError = document.getElementById("phoneError");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const nameRegex = /^[A-Za-z ]{2,}$/;
      if (!nameRegex.test(nameInput.value)) {
        nameError.textContent =
          "Name must contain only letters (min 2 characters).";
        nameInput.style.borderColor = "red";
      } else {
        nameError.textContent = "";
        nameInput.style.borderColor = "green";
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value)) {
        emailError.textContent = "Invalid email format.";
        emailInput.style.borderColor = "red";
      } else {
        emailError.textContent = "";
        emailInput.style.borderColor = "green";
      }
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneInput.value)) {
        phoneError.textContent = "Phone must be 10 digits.";
        phoneInput.style.borderColor = "red";
      } else {
        phoneError.textContent = "";
        phoneInput.style.borderColor = "green";
      }
    });
  }
});

function togglePassword(inputId, toggleIcon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    toggleIcon.textContent = "🙈";
  } else {
    input.type = "password";
    toggleIcon.textContent = "👁️";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dobInput = document.querySelector('input[type="date"]');
  if (dobInput) {
    dobInput.addEventListener("change", () => {
      const dob = new Date(dobInput.value);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 18) {
        alert("You must be at least 18 years old to register.");
        dobInput.value = "";
        dobInput.style.borderColor = "red";
      } else {
        dobInput.style.borderColor = "green";
      }
    });
  }
});

const accountInput = document.getElementById("account_number");
const accountError = document.getElementById("accountError");

if (accountInput) {
  accountInput.addEventListener("input", () => {
    const accountRegex = /^\d{10,16}$/;
    if (!accountRegex.test(accountInput.value)) {
      accountError.textContent = "Account number must be 10 to 16 digits.";
      accountInput.style.borderColor = "red";
    } else {
      accountError.textContent = "";
      accountInput.style.borderColor = "green";
    }
  });
}

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
  try {
    const res = await fetch("http://127.0.0.1:5000/profile", {
      method: "GET",
      credentials: "include", // 🟢 include cookies for session auth
    });

    if (res.status === 401) {
      alert("You must be logged in to access this page.");
      window.location.href = "login.html";
      return null;
    }

    if (!res.ok) throw new Error("Failed to load profile");

    const data = await res.json();
    userData = data;
    console.log("User data loaded:", userData);
    return data;
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
      <img src="http://127.0.0.1:5000/static/uploads/${
        userData.photo
      }" class="profile-pic" />
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
  let rows = transactions
    .slice()
    .reverse()
    .map(
      (tx) => `
    <tr>
      <td>${tx.date}</td>
      <td>${tx.type}</td>
      <td>$${tx.amount.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");
  rightPanel.innerHTML = `
    <div class="contentBox">
      <h2>Transaction History</h2>
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
        <tbody>${
          rows || `<tr><td colspan="3">No transactions found.</td></tr>`
        }</tbody>
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
        <input type="text" name="full_name" value="${
          userData.full_name
        }" required />
        <label>Email</label>
        <input type="email" name="email" value="${userData.email}" required />
        <label>Phone</label>
        <input type="tel" name="phone" value="${userData.phone}" required />
        <label>Sex</label>
        <select name="sex" required>
          <option value="Male" ${
            userData.gender === "Male" ? "selected" : ""
          }>Male</option>
          <option value="Female" ${
            userData.gender === "Female" ? "selected" : ""
          }>Female</option>
          <option value="Other" ${
            userData.gender === "Other" ? "selected" : ""
          }>Other</option>
        </select>
        <label>Date of Birth</label>
        <input type="date" name="dob" value="${userData.dob}" required />
        <div class="form-button-group">
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  document
    .getElementById("editProfileForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      formData.append("username", userData.username);
      const res = await fetch("http://127.0.0.1:5000/update-profile", {
        method: "POST",
        body: formData,
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
        <input type="password" name="old_pin" required minlength="4" maxlength="4"  />
        <label>New PIN</label>
        <input type="password" name="new_pin" required minlength="4" maxlength="4" />
        <label>Confirm New PIN</label>
        <input type="password" name="confirm_pin" required minlength="4" maxlength="4"  />
        <div class="form-button-group">
          <button type="submit">Change PIN</button>
        </div>
      </form>
    </div>
  `;
  document
    .getElementById("changePinForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPin = e.target.old_pin.value.trim();
      const newPin = e.target.new_pin.value.trim();
      const confirmPin = e.target.confirm_pin.value.trim();
      if (newPin !== confirmPin) return alert("New PINs do not match");
      const res = await fetch("http://127.0.0.1:5000/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userData.username,
          old_pin: oldPin,
          new_pin: newPin,
        }),
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
  document
    .getElementById("depositForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById("depositAmount").value);
      // const user_id = localStorage.getItem("user_id");  // ✅ get it from localStorage

      const res = await fetch("http://127.0.0.1:5000/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userData.user_id, amount }),
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
  document
    .getElementById("withdrawForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = parseFloat(
        document.getElementById("withdrawAmount").value
      );
      const res = await fetch("http://127.0.0.1:5000/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userData.user_id, amount }),
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
  fetch("http://127.0.0.1:5000/logout", {
    method: "POST",
    credentials: "include",
  }).then(() => {
    window.location.href = "/login";
  });
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
