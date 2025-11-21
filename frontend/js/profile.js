document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
    window.location.href = "index.html"
    return
  }

  updateAuthUI()
  setupAuthModal()
  setupProfileMenu()
  setupProfileForms()
  loadProfileData()
})

function updateAuthUI() {
  const user = JSON.parse(localStorage.getItem("currentUser"))
  const authButtonContainer = document.getElementById("authButtonContainer")

  if (authButtonContainer) {
    if (user) {
      authButtonContainer.innerHTML = `
        <button class="auth-btn logout" onclick="handleLogout()">Logout</button>
      `
    } else {
      authButtonContainer.innerHTML = `
        <button class="auth-btn" onclick="showAuthModal()">Login</button>
      `
    }
  }
}

function handleLogout() {
  localStorage.removeItem("currentUser")
  showNotification("Logged out successfully!")
  window.location.href = "index.html"
}

window.handleLogout = handleLogout

function setupAuthModal() {
  const modal = document.getElementById("authModal")
  const closeBtn = document.getElementById("authModalClose")
  const switchBtn = document.getElementById("authSwitchBtn")
  const authForm = document.getElementById("authForm")
  const emailGroup = document.getElementById("authEmailGroup")
  const nameGroup = document.getElementById("authNameGroup")
  const departmentGroup = document.getElementById("authDepartmentGroup")
  const modalTitle = document.getElementById("authModalTitle")
  const submitBtn = document.getElementById("authSubmitBtn")
  const switchText = document.getElementById("authSwitchText")

  let isLoginMode = true

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active")
    })
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active")
      }
    })
  }

  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      isLoginMode = !isLoginMode

      if (isLoginMode) {
        modalTitle.textContent = "Login to SejongTown"
        submitBtn.textContent = "Login"
        emailGroup.style.display = "none"
        nameGroup.style.display = "none"
        departmentGroup.style.display = "none"
        switchText.innerHTML =
          'Don\'t have an account? <button type="button" id="authSwitchBtn" class="link-btn">Sign up</button>'
      } else {
        modalTitle.textContent = "Sign Up for SejongTown"
        submitBtn.textContent = "Sign Up"
        emailGroup.style.display = "block"
        nameGroup.style.display = "block"
        departmentGroup.style.display = "block"
        switchText.innerHTML =
          'Already have an account? <button type="button" id="authSwitchBtn" class="link-btn">Login</button>'
      }

      // Re-attach event listener to new button
      const newSwitchBtn = document.getElementById("authSwitchBtn")
      newSwitchBtn.addEventListener("click", arguments.callee)
    })
  }

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const studentId = document.getElementById("authStudentId").value
      const name = document.getElementById("authName").value
      const email = document.getElementById("authEmail").value
      const password = document.getElementById("authPassword").value
      const department = document.getElementById("authDepartment").value

      if (!/^\d{8}$/.test(studentId)) {
        window.showNotification("Student ID must be exactly 8 digits")
        return
      }

      if (isLoginMode) {
        // LOGIN FLOW
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id: studentId, password })
        })

        const result = await response.json()

        if (!response.ok) {
          window.showNotification(result.message)
          return
        }

        // normalize and store current user
        {
          const userObj = result.user || result
          const normalized = {
            student_id: userObj.student_id || userObj.studentId || studentId,
            name: userObj.name || name || "",
            email: userObj.email || email || "",
            department: userObj.department || department || "",
          }
          localStorage.setItem("currentUser", JSON.stringify(normalized))
        }
        modal.classList.remove("active")
        updateAuthUI()
        window.showNotification(`Welcome back, ${result.user.name}!`)
        authForm.reset()

      } else {
        // SIGNUP FLOW
        const response = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            name,
            email,
            password,
            department
          })
        })

        const result = await response.json()

        if (!response.ok) {
          window.showNotification(result.message)
          return
        }

        // normalize and store current user from signup response
        {
          const userObj = result.user || result
          const normalized = {
            student_id: userObj.student_id || userObj.studentId || studentId,
            name: userObj.name || name || "",
            email: userObj.email || email || "",
            department: userObj.department || department || "",
          }
          localStorage.setItem("currentUser", JSON.stringify(normalized))
        }
        modal.classList.remove("active")
        updateAuthUI()
        window.showNotification(`Welcome to SejongTown, ${name}!`)
        authForm.reset()
      }
    })
  }
}

// PROFILE DATA FROM BACKEND
async function loadProfileData() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const student_id = currentUser.student_id; // matches localStorage
  console.log("Student ID:", currentUser); // DEBUG

  if (!currentUser || !currentUser.student_id) {
    console.error("No studentId in localStorage");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/auth/profile/${student_id}`);
    console.log("Fetch status:", res.status); // DEBUG

    if (!res.ok) throw new Error("Failed to fetch profile");

    const data = await res.json();
    console.log("Fetched profile data:", data); // DEBUG

    // Populate HTML
    document.getElementById("profileName").textContent = data.name || "Student Name"
    document.getElementById("profileID").textContent = data.student_id || "Student ID"
    document.getElementById("fullName").value = data.name || "-";
    document.getElementById("email").value = data.email || "-";
    document.getElementById("studentId").value = data.student_id || "-";
    document.getElementById("department").value = data.department || "-";
    document.getElementById("studentId").disabled = true
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

function setupProfileMenu() {
  const menuItems = document.querySelectorAll(".menu-item")

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Remove active class from all items and sections
      document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"))
      document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"))

      // Add active class to clicked item and corresponding section
      item.classList.add("active")
      const sectionId = item.dataset.section
      const section = document.getElementById(sectionId)
      if (section) {
        section.classList.add("active")
      }
    })
  })
}

function setupProfileForms() {
  const profileForm = document.querySelector(".profile-form")

  // UPDATE PROFILE
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"))
      const student_id = currentUser.student_id; // matches localStorage
      console.log("Student ID:", currentUser); // DEBUG

      if (!currentUser || !currentUser.student_id) {
        console.error("No studentId in localStorage");
        return;
      }

      const updatedData = {
        name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        department: document.getElementById("department").value
      };

      try {
        const res = await fetch(`http://localhost:5000/api/auth/profile/${student_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Failed to update profile");

        window.showNotification("Profile updated successfully!");
      } catch (err) {
        console.error(err);
        window.showNotification("Error updating profile.");
      }
    })
  }

  // INTERESTS FORM SUBMISSION
  const interestsBtn = document.querySelector("#interests .btn-primary");
  if (interestsBtn) {
    interestsBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));

      // 1. Get all selected interests
      const selectedInterests = Array.from(
        document.querySelectorAll('input[type="checkbox"]:checked')
      ).map((checkbox) => checkbox.value);

      if (selectedInterests.length === 0) {
        showNotification("Please select at least one interest.");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/interests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: currentUser.student_id,
            interests: selectedInterests,
          }),
        });

        if (!res.ok) throw new Error("Failed to save interests");

        showNotification("Interests updated successfully!");
      } catch (err) {
        console.error("Error updating interests:", err);
        showNotification("Failed to save interests.");
      }
    });
  }
}

function showNotification(message) {
  const toast = document.getElementById("notificationToast")
  if (toast) {
    toast.textContent = message
    toast.classList.add("show")

    setTimeout(() => {
      toast.classList.remove("show")
    }, 3000)
  }
}

window.showNotification = showNotification