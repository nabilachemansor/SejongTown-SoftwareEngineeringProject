// const events = [
//   {
//     id: 1,
//     title: "AI & Machine Learning Workshop",
//     category: "Academic",
//     date: "2024-02-15",
//     time: "14:00",
//     location: "Engineering Building, Room 301",
//     organizer: "CS Department",
//     capacity: 50,
//     registered: 35,
//     description:
//       "Learn the fundamentals of AI and machine learning with hands-on projects and real-world applications.",
//   },
//   {
//     id: 2,
//     title: "Spring Festival 2024",
//     category: "Cultural",
//     date: "2024-03-20",
//     time: "18:00",
//     location: "Main Campus Plaza",
//     organizer: "Student Council",
//     capacity: 500,
//     registered: 342,
//     description: "Celebrate spring with music, food, and cultural performances from around the world.",
//   },
//   {
//     id: 3,
//     title: "Basketball Tournament Finals",
//     category: "Sports",
//     date: "2024-02-25",
//     time: "16:00",
//     location: "Sports Complex",
//     organizer: "Athletics Department",
//     capacity: 200,
//     registered: 187,
//     description: "Cheer for your favorite team in the championship match of the intramural basketball tournament.",
//   },
//   {
//     id: 4,
//     title: "Career Fair 2024",
//     category: "Academic",
//     date: "2024-03-10",
//     time: "10:00",
//     location: "Student Center Hall",
//     organizer: "Career Services",
//     capacity: 300,
//     registered: 156,
//     description: "Meet recruiters from top companies and explore internship and full-time opportunities.",
//   },
//   {
//     id: 5,
//     title: "K-Pop Dance Night",
//     category: "Social",
//     date: "2024-02-18",
//     time: "19:00",
//     location: "Student Lounge",
//     organizer: "Korean Cultural Club",
//     capacity: 80,
//     registered: 72,
//     description: "Dance the night away with the latest K-Pop hits and learn new choreography.",
//   },
//   {
//     id: 6,
//     title: "Photography Exhibition",
//     category: "Cultural",
//     date: "2024-03-05",
//     time: "15:00",
//     location: "Art Gallery",
//     organizer: "Photography Club",
//     capacity: 100,
//     registered: 45,
//     description: "View stunning photographs captured by talented student photographers.",
//   },
// ]

let currentCategory = "all"

function checkAuth() {
  const raw = localStorage.getItem("currentUser")
  if (!raw || raw === "undefined" || raw === "null") {
    // clean up invalid stored value
    try { localStorage.removeItem("currentUser") } catch (e) { }
    return null
  }

  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error("Invalid JSON in localStorage.currentUser:", raw)
    try { localStorage.removeItem("currentUser") } catch (e) { }
    return null
  }
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

// LOAD EVENTS FROM BACKEND
async function loadEventsFromDB() {
  try {
    const res = await fetch("http://localhost:5000/api/events");
    if (!res.ok) throw new Error("Failed to load events");
    const dbEvents = await res.json();

    return dbEvents.map(e => ({
      id: e.event_id,
      title: e.title,
      description: e.description,
      category: e.category,
      date: e.event_date,
      time: e.event_time,
      location: e.location,
      capacity: e.capacity,
      slotsLeft: e.slots_left,
      registrationStatus: e.registration_status,
      poster: e.poster_path ? `http://localhost:5000/${e.poster_path.replace(/\\/g, "/")}` : null,
      organizerId: e.organizer_id,
      createdAt: e.created_at
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

// SETUP SEARCH FUNCTIONALITY
async function setupSearch() {
  const searchInput = document.getElementById("searchInput")
  const dbEvents = await loadEventsFromDB();
  const eventsGrid = document.getElementById("eventsGrid")

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase()

      const filteredEvents = dbEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm),
      )

      if (filteredEvents.length === 0) {
        // Display "No events found"
        eventsGrid.innerHTML =
          '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No events found.</p>'
      } else {
        // Display filtered events
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
                          <span>${event.capacity - event.slotsLeft}/${event.capacity} registered</span>
                          <span>${event.slotsLeft} spots left</span>
                      </div>
                  </div>
              </a>
            `,
          )
          .join("")
      }
    })
  } else {
    // If searchInput does not exist, show "No events found"
    eventsGrid.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No events found.</p>'
  }
}


// SETUP FILTER BUTTONS (BY CATEGORY)
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

async function renderEvents() {
  const eventsGrid = document.getElementById("eventsGrid")
  const dbEvents = await loadEventsFromDB();
  // Filter all events from DB based on current category
  const filteredDbEvents = currentCategory === "all" ? dbEvents : dbEvents.filter((event) => event.category === currentCategory);

  if (filteredDbEvents.length === 0) {
    eventsGrid.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No events found.</p>';
    return;
  }

  eventsGrid.innerHTML = filteredDbEvents
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
                    <span>${event.capacity - event.slotsLeft}/${event.capacity} registered</span>
                    <span>${event.slotsLeft} spots left</span>
                </div>
            </div>
        </a>
    `,
    )
    .join("")
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
  
//bila tmbah
async function queryAI(message) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null")
  const payload = {
    message: message,
    student_id: currentUser ? currentUser.student_id : null
  }
  try {
    const res = await fetch("http://localhost:5050/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      console.error("AI service error", res.status);
      return { reply: "Sorry, AI service is unavailable right now." }
    }
    return await res.json();
  } catch (err) {
    console.error("Network error to AI service", err)
    return { reply: "Could not reach AI service." }
  }
}

function addMessage(text, sender) {
    const msg = document.createElement("div")
    msg.className = `message ${sender}`
    msg.innerHTML = `<div class="message-content">${text}</div>`
    chatbotMessages.appendChild(msg)
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight
  }

// wire to UI Bila tmbah
if (chatbotSend && chatbotInput) {
  const sendMessage = async () => {
    const message = chatbotInput.value.trim()
    if (!message) return

    addMessage(message, "user");
    chatbotInput.value = "";

    addMessage("Thinking...", "bot"); // temporary indicator
    const response = await queryAI(message)
    // remove the "Thinking..." (last bot message) if present
    const botMsgs = document.querySelectorAll("#chatbotMessages .message.bot");
    if (botMsgs.length) {
      const last = botMsgs[botMsgs.length - 1]
      if (last && last.textContent.includes("Thinking")) last.remove()
    }

    // default response text
    const replyText = response.reply || "Sorry, I couldn't answer that."
    addMessage(replyText, "bot");

    // if response.events exists, render quick suggestions 9show rec events)
 if (Array.isArray(response.events) && response.events.length > 0) {
        const suggestions = response.events.slice(0, 9).map(e => `
          <div class="chat-event">
            <a href="/frontend/event-details.html?id=${e.event_id}">${e.title}</a>
            <div class="small">${new Date(e.event_date).toLocaleDateString('en-CA')}</div>
          </div>
        `).join("")

        addMessage("Suggested events:<br>" + suggestions, "bot")
      }
    }

  chatbotSend.addEventListener("click", sendMessage)
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage()
  })
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

// window.eventsData = events