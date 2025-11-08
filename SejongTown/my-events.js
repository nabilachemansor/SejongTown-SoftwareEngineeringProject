document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
    window.location.href = "index.html"
    return
  }

  updateAuthUI()
  setupAuthModal()
  setupEventFilters()
  renderMyEvents("registered")
})

function updateAuthUI() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const authButtonContainer = document.getElementById("authButtonContainer")
  const profileLinkContainer = document.getElementById("profileLinkContainer")

  if (authButtonContainer) {
    if (currentUser) {
      authButtonContainer.innerHTML = `
        <button class="auth-btn logout" onclick="handleLogout()">Logout</button>
      `
    } else {
      authButtonContainer.innerHTML = `
        <button class="auth-btn" onclick="showAuthModal()">Login</button>
      `
    }
  }

  if (profileLinkContainer) {
    if (currentUser) {
      profileLinkContainer.innerHTML = '<a href="profile.html">Profile</a>'
    } else {
      profileLinkContainer.innerHTML = ""
    }
  }
}

let authIsLoginMode = true

function setupAuthModal() {
  const modal = document.getElementById("authModal")
  const closeBtn = document.getElementById("authModalClose")
  const authForm = document.getElementById("authForm")
  const authSwitchBtn = document.getElementById("authSwitchBtn")

  closeBtn.onclick = () => {
    modal.style.display = "none"
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = "none"
    }
  }

  authSwitchBtn.onclick = () => {
    authIsLoginMode = !authIsLoginMode
    toggleAuthMode(authIsLoginMode)
  }

  authForm.onsubmit = (e) => {
    e.preventDefault()
    if (authIsLoginMode) {
      handleLogin()
    } else {
      handleSignup()
    }
  }
}

function toggleAuthMode(isLogin) {
  const modalTitle = document.getElementById("authModalTitle")
  const submitBtn = document.getElementById("authSubmitBtn")
  const switchText = document.getElementById("authSwitchText")
  const nameGroup = document.getElementById("authNameGroup")

  if (isLogin) {
    modalTitle.textContent = "Login to SejongTown"
    submitBtn.textContent = "Login"
    switchText.innerHTML =
      'Don\'t have an account? <button type="button" id="authSwitchBtn" class="link-btn">Sign up</button>'
    nameGroup.style.display = "none"
  } else {
    modalTitle.textContent = "Sign up for SejongTown"
    submitBtn.textContent = "Sign Up"
    switchText.innerHTML =
      'Already have an account? <button type="button" id="authSwitchBtn" class="link-btn">Login</button>'
    nameGroup.style.display = "block"
  }

  document.getElementById("authSwitchBtn").onclick = () => {
    authIsLoginMode = !authIsLoginMode
    toggleAuthMode(authIsLoginMode)
  }
}

function showAuthModal() {
  document.getElementById("authModal").style.display = "flex"
}

function handleLogin() {
  const studentId = document.getElementById("authStudentId").value
  const password = document.getElementById("authPassword").value

  if (!/^\d{8}$/.test(studentId)) {
    showNotification("Student ID must be exactly 8 digits")
    return
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const user = users.find((u) => u.studentId === studentId && u.password === password)

  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user))
    document.getElementById("authModal").style.display = "none"
    updateAuthUI()
    showNotification("Welcome back, " + user.name + "!")
  } else {
    showNotification("Invalid credentials. Please try again.")
  }
}

function handleSignup() {
  const studentId = document.getElementById("authStudentId").value
  const password = document.getElementById("authPassword").value
  const name = document.getElementById("authName").value

  if (!/^\d{8}$/.test(studentId)) {
    showNotification("Student ID must be exactly 8 digits")
    return
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]")

  if (users.find((u) => u.studentId === studentId)) {
    showNotification("Student ID already registered. Please login.")
    return
  }

  const newUser = { studentId, password, name, interests: [] }
  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  localStorage.setItem("currentUser", JSON.stringify(newUser))

  document.getElementById("authModal").style.display = "none"
  updateAuthUI()
  showNotification("Account created successfully!")
}

function logout() {
  localStorage.removeItem("currentUser")
  showNotification("Logged out successfully")
  window.location.href = "index.html"
}

function handleLogout() {
  logout()
}

window.handleLogout = handleLogout
window.showAuthModal = showAuthModal

function showNotification(message) {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")
  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

function setupEventFilters() {
  const filterTabs = document.querySelectorAll(".filter-tab")

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      const type = tab.dataset.type
      renderMyEvents(type)
    })
  })
}

function renderMyEvents(type) {
  const myEventsGrid = document.getElementById("myEventsGrid")
  const registeredEvents = JSON.parse(localStorage.getItem("registeredEvents") || "[]")
  const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  let eventsToShow = []

  if (type === "registered") {
    const allEvents = window.eventsData ? [...window.eventsData, ...createdEvents] : createdEvents
    eventsToShow = allEvents.filter((event) => registeredEvents.includes(event.id))
  } else if (type === "created") {
    eventsToShow = createdEvents
  } else if (type === "past") {
    const today = new Date()
    const allEvents = window.eventsData ? [...window.eventsData, ...createdEvents] : createdEvents
    eventsToShow = allEvents.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate < today && registeredEvents.includes(event.id)
    })
  }

  if (eventsToShow.length === 0) {
    myEventsGrid.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No events found.</p>'
    return
  }

  myEventsGrid.innerHTML = eventsToShow
    .map(
      (event) => `
        <div class="event-card ${type === "created" ? "created-event-card" : ""}">
            ${
              type === "created"
                ? `
              <div class="event-actions">
                <button class="btn-icon" onclick="editEvent(${event.id})" title="Edit Event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="deleteEvent(${event.id})" title="Delete Event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            `
                : ""
            }
            <a href="event-details.html?id=${event.id}" class="event-card-link">
                ${event.poster ? `<div class="event-poster"><img src="${event.poster}" alt="${event.title}"></div>` : ""}
                <div class="event-content">
                    <div class="event-badge">${event.category}</div>
                    <h3>${event.title}</h3>
                    <div class="event-meta">
                        <span>${formatDate(event.date)}</span>
                        <span>${event.time}</span>
                        <span>${event.location}</span>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="event-footer">
                        <span>${event.registered || 0}/${event.capacity} registered</span>
                        ${type === "created" ? "<span>Your Event</span>" : "<span>Registered</span>"}
                    </div>
                </div>
            </a>
        </div>
    `,
    )
    .join("")
}

window.editEvent = (eventId) => {
  const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
  const event = createdEvents.find((e) => e.id === eventId)

  if (event) {
    // Store event data for editing
    localStorage.setItem("editingEvent", JSON.stringify(event))
    window.location.href = "create-event.html?edit=" + eventId
  }
}

window.deleteEvent = (eventId) => {
  if (confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
    const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
    const updatedEvents = createdEvents.filter((e) => e.id !== eventId)
    localStorage.setItem("createdEvents", JSON.stringify(updatedEvents))

    showNotification("Event deleted successfully")
    renderMyEvents("created")
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { month: "short", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

if (!window.eventsData) {
  window.eventsData = [
    {
      id: 1,
      title: "AI & Machine Learning Workshop",
      category: "Academic",
      date: "2024-02-15",
      time: "14:00",
      location: "Engineering Building, Room 301",
      organizer: "CS Department",
      capacity: 50,
      registered: 35,
      description:
        "Learn the fundamentals of AI and machine learning with hands-on projects and real-world applications.",
    },
    {
      id: 2,
      title: "Spring Festival 2024",
      category: "Cultural",
      date: "2024-03-20",
      time: "18:00",
      location: "Main Campus Plaza",
      organizer: "Student Council",
      capacity: 500,
      registered: 342,
      description: "Celebrate spring with music, food, and cultural performances from around the world.",
    },
    {
      id: 3,
      title: "Basketball Tournament Finals",
      category: "Sports",
      date: "2024-02-25",
      time: "16:00",
      location: "Sports Complex",
      organizer: "Athletics Department",
      capacity: 200,
      registered: 187,
      description: "Dance the night away with the latest K-Pop hits and learn new choreography.",
    },
    {
      id: 4,
      title: "Career Fair 2024",
      category: "Academic",
      date: "2024-03-10",
      time: "10:00",
      location: "Student Center Hall",
      organizer: "Career Services",
      capacity: 300,
      registered: 156,
      description: "Meet recruiters from top companies and explore internship and full-time opportunities.",
    },
    {
      id: 5,
      title: "K-Pop Dance Night",
      category: "Social",
      date: "2024-02-18",
      time: "19:00",
      location: "Student Lounge",
      organizer: "Korean Cultural Club",
      capacity: 80,
      registered: 72,
      description: "Cheer for your favorite team in the championship match of the intramural basketball tournament.",
    },
    {
      id: 6,
      title: "Photography Exhibition",
      category: "Cultural",
      date: "2024-03-05",
      time: "15:00",
      location: "Art Gallery",
      organizer: "Photography Club",
      capacity: 100,
      registered: 45,
      description: "View stunning photographs captured by talented student photographers.",
    },
  ]
}