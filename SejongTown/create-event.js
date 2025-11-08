document.addEventListener("DOMContentLoaded", () => {
  if (!checkAuth()) {
    window.location.href = "index.html"
    return
  }

  updateAuthUI()
  setupAuthModal()
  setupPosterUpload()
  setupEventForm()
})

function checkAuth() {
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

function showAuthModal() {
  const modal = document.getElementById("authModal")
  if (modal) {
    modal.classList.add("active")
  }
}

function updateAuthUI() {
  const user = checkAuth()
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
  updateAuthUI()
  window.showNotification("Logged out successfully!")
  window.location.href = "index.html"
}

window.handleLogout = handleLogout
window.showAuthModal = showAuthModal

function setupPosterUpload() {
  const posterInput = document.getElementById("eventPoster")
  const posterPreview = document.getElementById("posterPreview")
  const posterImage = document.getElementById("posterImage")
  const removeBtn = document.getElementById("removePoster")

  if (posterInput) {
    posterInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          posterImage.src = event.target.result
          posterPreview.style.display = "block"
        }
        reader.readAsDataURL(file)
      }
    })
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      posterInput.value = ""
      posterPreview.style.display = "none"
      posterImage.src = ""
    })
  }
}

function setupEventForm() {
  const form = document.getElementById("createEventForm")
  const urlParams = new URLSearchParams(window.location.search)
  const isEditing = urlParams.has("edit")

  if (isEditing) {
    const editingEvent = JSON.parse(localStorage.getItem("editingEvent") || "{}")
    if (editingEvent.id) {
      document.getElementById("eventTitle").value = editingEvent.title || ""
      document.getElementById("eventDate").value = editingEvent.date || ""
      document.getElementById("eventTime").value = editingEvent.time || ""
      document.getElementById("eventLocation").value = editingEvent.location || ""
      document.getElementById("eventCategory").value = editingEvent.category || "Academic"
      document.getElementById("eventCapacity").value = editingEvent.capacity || ""
      document.getElementById("eventDescription").value = editingEvent.description || ""

      if (editingEvent.poster) {
        const posterImage = document.getElementById("posterImage")
        const posterPreview = document.getElementById("posterPreview")
        posterImage.src = editingEvent.poster
        posterPreview.style.display = "block"
        document.getElementById("eventPoster").required = false
      }

      document.querySelector(".form-container h2").textContent = "Edit Event"
      const submitBtn = form.querySelector('button[type="submit"]')
      if (submitBtn) submitBtn.textContent = "Update Event"
    }
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const user = checkAuth()
      if (!user) {
        window.showNotification("Please login to create events")
        window.location.href = "index.html"
        return
      }

      const posterInput = document.getElementById("eventPoster")
      const posterImage = document.getElementById("posterImage")
      let posterData = ""

      if (isEditing && posterImage.src) {
        posterData = posterImage.src
      } else if (posterInput.files && posterInput.files[0]) {
        const reader = new FileReader()
        reader.onload = (event) => {
          posterData = event.target.result
          saveEvent(posterData)
        }
        reader.readAsDataURL(posterInput.files[0])
        return
      } else {
        window.showNotification("Please upload an event poster")
        return
      }

      saveEvent(posterData)

      function saveEvent(poster) {
        const eventData = {
          id: isEditing ? JSON.parse(localStorage.getItem("editingEvent")).id : Date.now(),
          title: document.getElementById("eventTitle").value,
          date: document.getElementById("eventDate").value,
          time: document.getElementById("eventTime").value,
          location: document.getElementById("eventLocation").value,
          category: document.getElementById("eventCategory").value,
          capacity: Number.parseInt(document.getElementById("eventCapacity").value),
          description: document.getElementById("eventDescription").value,
          organizer: user.name || "You",
          registered: isEditing ? JSON.parse(localStorage.getItem("editingEvent")).registered : 0,
          creatorId: user.studentId,
          poster: poster,
        }

        const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")

        if (isEditing) {
          const eventIndex = createdEvents.findIndex((e) => e.id === eventData.id)
          if (eventIndex !== -1) {
            createdEvents[eventIndex] = eventData
            localStorage.setItem("createdEvents", JSON.stringify(createdEvents))
            localStorage.removeItem("editingEvent")
            window.showNotification("Event updated successfully!")
          }
        } else {
          createdEvents.push(eventData)
          localStorage.setItem("createdEvents", JSON.stringify(createdEvents))
          window.showNotification("Event created successfully!")
        }

        setTimeout(() => {
          window.location.href = "my-events.html"
        }, 1500)
      }
    })
  }
}

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
        window.showNotification("Student ID must be exactly 8 digits")
        return
      }

      if (isLoginMode) {
        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const user = users.find((u) => u.studentId === studentId && u.password === password)

        if (user) {
          localStorage.setItem("currentUser", JSON.stringify({ studentId: user.studentId, name: user.name }))
          modal.classList.remove("active")
          updateAuthUI()
          window.showNotification(`Welcome back, ${user.name}!`)
          authForm.reset()
        } else {
          window.showNotification("Invalid Student ID or password")
        }
      } else {
        if (!name) {
          window.showNotification("Please enter your full name")
          return
        }

        const users = JSON.parse(localStorage.getItem("users") || "[]")
        const existingUser = users.find((u) => u.studentId === studentId)

        if (existingUser) {
          window.showNotification("Student ID already registered")
          return
        }

        const newUser = { studentId, password, name }
        users.push(newUser)
        localStorage.setItem("users", JSON.stringify(users))
        localStorage.setItem("currentUser", JSON.stringify({ studentId, name }))

        modal.classList.remove("active")
        updateAuthUI()
        window.showNotification(`Welcome to SejongTown, ${name}!`)
        authForm.reset()
      }
    })
  }
}

window.showNotification = (message) => {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}