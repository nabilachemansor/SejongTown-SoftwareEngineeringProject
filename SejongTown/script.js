const events = [
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

let currentCategory = "all"

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
  const profileLinkContainer = document.getElementById("profileLinkContainer")

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

  if (profileLinkContainer) {
    if (user) {
      profileLinkContainer.innerHTML = `<a href="profile.html" class="auth-required">Profile</a>`
    } else {
      profileLinkContainer.innerHTML = ""
    }
  }
}

function handleLogout() {
  localStorage.removeItem("currentUser")
  updateAuthUI()
  window.showNotification("Logged out successfully!")

  // Redirect to home if on protected page
  const currentPage = window.location.pathname
  if (currentPage.includes("my-events") || currentPage.includes("create-event") || currentPage.includes("profile")) {
    window.location.href = "index.html"
  }
}

window.handleLogout = handleLogout
window.showAuthModal = showAuthModal

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI()
  setupAuthModal()
  setupProtectedLinks()
  renderEvents()
  setupFilters()
  setupSearch()
  setupChatbot()
})

function setupProtectedLinks() {
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a.auth-required")
    if (target) {
      const user = checkAuth()
      if (!user) {
        e.preventDefault()
        showAuthModal()
      }
    }
  })
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

      // Re-attach event listener to new button
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

function renderEvents() {
  const eventsGrid = document.getElementById("eventsGrid")
  const filteredEvents =
    currentCategory === "all" ? events : events.filter((event) => event.category === currentCategory)

  const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
  const allEvents = [...filteredEvents, ...createdEvents]

  eventsGrid.innerHTML = allEvents
    .map(
      (event) => `
        <a href="event-details.html?id=${event.id}" class="event-card">
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
                    <span>${event.registered}/${event.capacity} registered</span>
                    <span>${event.capacity - event.registered} spots left</span>
                </div>
            </div>
        </a>
    `,
    )
    .join("")
}

function setupFilters() {
  const filterTabs = document.querySelectorAll(".filter-tab")

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      currentCategory = tab.dataset.category
      renderEvents()
    })
  })
}

function setupSearch() {
  const searchInput = document.getElementById("searchInput")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()
      const createdEvents = JSON.parse(localStorage.getItem("createdEvents") || "[]")
      const allBaseEvents =
        currentCategory === "all" ? events : events.filter((event) => event.category === currentCategory)
      const allEvents = [...allBaseEvents, ...createdEvents]

      const filteredEvents = allEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) || event.description.toLowerCase().includes(searchTerm),
      )

      const eventsGrid = document.getElementById("eventsGrid")
      eventsGrid.innerHTML = filteredEvents
        .map(
          (event) => `
                <a href="event-details.html?id=${event.id}" class="event-card">
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
                            <span>${event.registered}/${event.capacity} registered</span>
                            <span>${event.capacity - event.registered} spots left</span>
                        </div>
                    </div>
                </a>
            `,
        )
        .join("")
    })
  }
}

function setupChatbot() {
  const chatbotToggle = document.getElementById("chatbotToggle")
  const chatbotContainer = document.getElementById("chatbotContainer")
  const chatbotClose = document.getElementById("chatbotClose")
  const chatbotInput = document.getElementById("chatbotInput")
  const chatbotSend = document.getElementById("chatbotSend")
  const chatbotMessages = document.getElementById("chatbotMessages")

  if (chatbotToggle) {
    chatbotToggle.addEventListener("click", () => {
      chatbotContainer.classList.add("active")
      chatbotToggle.style.display = "none"
    })
  }

  if (chatbotClose) {
    chatbotClose.addEventListener("click", () => {
      chatbotContainer.classList.remove("active")
      chatbotToggle.style.display = "flex"
    })
  }

  if (chatbotSend && chatbotInput) {
    const sendMessage = () => {
      const message = chatbotInput.value.trim()
      if (message) {
        addMessage(message, "user")
        chatbotInput.value = ""

        setTimeout(() => {
          const response = generateBotResponse(message)
          addMessage(response, "bot")
        }, 500)
      }
    }

    chatbotSend.addEventListener("click", sendMessage)
    chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage()
    })
  }

  function addMessage(text, sender) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}`
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`
    chatbotMessages.appendChild(messageDiv)
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight
  }

  function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("event") || lowerMessage.includes("what") || lowerMessage.includes("recommend")) {
      const upcomingEvents = events.slice(0, 3)
      return `I recommend these upcoming events: ${upcomingEvents.map((e) => e.title).join(", ")}. Would you like more details about any of them?`
    } else if (lowerMessage.includes("rsvp") || lowerMessage.includes("register")) {
      return 'To RSVP for an event, simply click on the event card and press the "Register for Event" button. You can manage all your registrations in the "My Events" section.'
    } else if (lowerMessage.includes("cancel") || lowerMessage.includes("unregister")) {
      return 'To cancel your registration, go to "My Events" and click on the event you want to cancel. You\'ll find the cancel option there.'
    } else if (lowerMessage.includes("create")) {
      return 'You can create your own event by clicking on "Create Event" in the navigation menu. Fill out the form with event details and it will be reviewed before going live!'
    } else if (lowerMessage.includes("check-in") || lowerMessage.includes("qr")) {
      return "After registering for an event, you'll receive a QR code in the event details page. Simply show this code at the event entrance for quick check-in!"
    } else {
      return "I can help you find events, RSVP, check-in, and create your own events. What would you like to know more about?"
    }
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { month: "short", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

window.showNotification = (message) => {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

window.eventsData = events