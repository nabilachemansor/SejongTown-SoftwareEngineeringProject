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
  const nameGroup = document.getElementById("authNameGroup")
  const modalTitle = document.getElementById("authModalTitle")
  const submitBtn = document.getElementById("authSubmitBtn")
  const switchText = document.getElementById("authSwitchText")

  let isLoginMode = true

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active")
    })
  }

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
        nameGroup.style.display = "none"
        switchText.innerHTML =
          'Don\'t have an account? <button type="button" id="authSwitchBtn" class="link-btn">Sign up</button>'
      } else {
        modalTitle.textContent = "Sign Up for SejongTown"
        submitBtn.textContent = "Sign Up"
        nameGroup.style.display = "block"
        switchText.innerHTML =
          'Already have an account? <button type="button" id="authSwitchBtn" class="link-btn">Login</button>'
      }

      const newSwitchBtn = document.getElementById("authSwitchBtn")
      newSwitchBtn.addEventListener("click", arguments.callee)
    })
  }

  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const studentId = document.getElementById("authStudentId").value
      const password = document.getElementById("authPassword").value
      const name = document.getElementById("authName").value

      if (!/^\d{8}$/.test(studentId)) {
        showNotification("Student ID must be exactly 8 digits")
        return
      }

      if (isLoginMode) {
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const user = users.find((u) => u.studentId === studentId && u.password === password)

        if (user) {
          localStorage.setItem("currentUser", JSON.stringify({ studentId: user.studentId, name: user.name }))
          modal.classList.remove("active")
          updateAuthUI()
          showNotification(`Welcome back, ${user.name}!`)
          authForm.reset()
        } else {
          showNotification("Invalid Student ID or password")
        }
      } else {
        if (!name) {
          showNotification("Please enter your full name")
          return
        }

        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const existingUser = users.find((u) => u.studentId === studentId)

        if (existingUser) {
          showNotification("Student ID already registered")
          return
        }

        const newUser = { studentId, password, name }
        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))
        localStorage.setItem("currentUser", JSON.stringify({ studentId, name }))

        modal.classList.remove("active")
        updateAuthUI()
        showNotification(`Welcome to SejongTown, ${name}!`)
        authForm.reset()
      }
    })
  }
}

function loadProfileData() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (currentUser) {
    document.getElementById("profileName").textContent = currentUser.name || "Student Name"
    document.getElementById("profileEmail").textContent = currentUser.studentId || "00000000"
    document.getElementById("fullName").value = currentUser.name || ""
    document.getElementById("studentId").value = currentUser.studentId || ""
    document.getElementById("studentId").disabled = true
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

  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault()
      showNotification("Profile updated successfully!")
    })
  }

  const interestsBtn = document.querySelector("#interests .btn-primary")
  if (interestsBtn) {
    interestsBtn.addEventListener("click", (e) => {
      e.preventDefault()
      showNotification("Interests updated successfully!")
    })
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