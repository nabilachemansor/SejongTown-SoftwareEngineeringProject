document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI()
  setupAuthModal()
  loadEventDetails()
  setupRSVP()
})

function checkAuth() {
  const user = localStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

function requireAuth(callback) {
  const user = checkAuth()
  if (!user) {
    showAuthModal()
    return false
  }
  if (callback) callback(user)
  return true
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

function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search)
  const eventId = Number.parseInt(urlParams.get("id"))

  const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
  const allEvents = window.eventsData ? [...window.eventsData, ...createdEvents] : createdEvents
  const event = allEvents.find((e) => e.id === eventId)

  if (!event) {
    document.getElementById("eventDetailContainer").innerHTML = "<p>Event not found.</p>"
    return
  }

  const eventDetailHeader = document.querySelector(".event-detail-header")
  if (event.poster && eventDetailHeader) {
    const posterElement = document.createElement("div")
    posterElement.className = "event-detail-poster"
    posterElement.innerHTML = `<img src="${event.poster}" alt="${event.title}">`
    eventDetailHeader.insertBefore(posterElement, eventDetailHeader.firstChild)
  }

  document.getElementById("eventBadge").textContent = event.category
  document.getElementById("eventBadge").className = "event-badge"
  document.getElementById("eventTitle").textContent = event.title
  document.getElementById("eventDate").textContent = formatDate(event.date)
  document.getElementById("eventTime").textContent = event.time
  document.getElementById("eventLocation").textContent = event.location
  document.getElementById("eventDescription").textContent = event.description
  document.getElementById("eventOrganizer").textContent = event.organizer
  document.getElementById("eventCapacity").textContent = `${event.registered}/${event.capacity} registered`
  document.getElementById("eventRegistration").textContent = "Open"

  const spotsLeft = event.capacity - event.registered
  document.getElementById("spotsLeft").textContent = `${spotsLeft} spots remaining`

  const rsvpBtn = document.getElementById("rsvpBtn")
  const registeredEvents = JSON.parse(localStorage.getItem("registeredEvents") || "[]")
  const isRegistered = registeredEvents.includes(eventId)

  if (isRegistered) {
    rsvpBtn.textContent = "Cancel Registration"
    rsvpBtn.classList.add("btn-secondary")
    rsvpBtn.classList.remove("btn-primary")
    document.getElementById("checkinSection").style.display = "block"
  }
}

function setupRSVP() {
  const rsvpBtn = document.getElementById("rsvpBtn")

  if (rsvpBtn) {
    rsvpBtn.addEventListener("click", () => {
      if (!requireAuth()) {
        return
      }

      const urlParams = new URLSearchParams(window.location.search)
      const eventId = Number.parseInt(urlParams.get("id"))
      const registeredEvents = JSON.parse(localStorage.getItem("registeredEvents") || "[]")
      const isRegistered = registeredEvents.includes(eventId)

      if (isRegistered) {
        const updatedEvents = registeredEvents.filter((id) => id !== eventId)
        localStorage.setItem("registeredEvents", JSON.stringify(updatedEvents))
        window.showNotification("Registration cancelled successfully!")
        rsvpBtn.textContent = "Register for Event"
        rsvpBtn.classList.remove("btn-secondary")
        rsvpBtn.classList.add("btn-primary")
        document.getElementById("checkinSection").style.display = "none"
      } else {
        registeredEvents.push(eventId)
        localStorage.setItem("registeredEvents", JSON.stringify(registeredEvents))
        window.showNotification("Successfully registered for event!")
        rsvpBtn.textContent = "Cancel Registration"
        rsvpBtn.classList.add("btn-secondary")
        rsvpBtn.classList.remove("btn-primary")
        document.getElementById("checkinSection").style.display = "block"
      }
    })
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { month: "long", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", options)
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
      description: "Cheer for your favorite team in the championship match of the intramural basketball tournament.",
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
      description: "Dance the night away with the latest K-Pop hits and learn new choreography.",
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