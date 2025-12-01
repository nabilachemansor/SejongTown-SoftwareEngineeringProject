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
  const switchBtn = document.getElementById("authSwitchBtn")
  const authForm = document.getElementById("authForm")
  const birthDateGroup = document.getElementById("authBirthDateGroup")
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
        birthDateGroup.style.display = "none"
        switchText.innerHTML =
          'Don\'t have an account? <button type="button" id="authSwitchBtn" class="link-btn">Sign up</button>'
      }
       else {
        modalTitle.textContent = "Sign Up for SejongTown"
        submitBtn.textContent = "Sign Up"
        birthDateGroup.style.display = "block"
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
      const birthDate = document.getElementById("authBirthDate").value
      const password = document.getElementById("authPassword").value

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
            student_id: userObj.student_id || userObj.studentId || studentId
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
            birthdate: birthDate,
            password: password
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
            birthDate: userObj.birthdate || birthDate || ""
          }
          localStorage.setItem("currentUser", JSON.stringify(normalized))
        }
        modal.classList.remove("active")
        updateAuthUI()
        window.showNotification(`Welcome to SejongTown, ${result.user.name}!`)
        authForm.reset()
      }
    })
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

// SHOW REGISTERED EVENTS FROM BACKEND
async function loadRegisteredEvents(student_id) {
  const res = await fetch(`http://localhost:5000/api/attendance/${student_id}/attendances`);
  if (!res.ok) return [];
  const data = await res.json();
  return data; // should be array of events the user registered
}

// SHOW CREATED EVENTS FROM BACKEND
async function loadCreatedEvents() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const student_id = currentUser.student_id;
  console.log("Student ID:", currentUser); // DEBUG

  if (!currentUser || !currentUser.student_id) return [];

  try {
    const res = await fetch(`http://localhost:5000/api/events/created/${student_id}`);
    if (!res.ok) throw new Error("Failed to fetch created events");

    const events = await res.json();
    return events;
  } catch (err) {
    console.error("Error fetching created events:", err);
    return [];
  }
}

// DELETE EVENT FROM BACKEND
async function deleteEvent(event_id) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    const res = await fetch(`http://localhost:5000/api/events/${event_id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Failed to delete event");

    alert("Event deleted successfully");

    // Refresh UI
    renderMyEvents("created");
  } catch (err) {
    console.error("Delete error:", err);
    alert("Error deleting event");
  }
}

// EDIT EVENT - REDIRECT TO CREATE EVENT PAGE WITH EVENT ID
async function editEvent(event_id) {
  window.location.href = `create-event.html?edit=${event_id}`;
}

// RENDER MY EVENTS
async function renderMyEvents(type) {
  const myEventsGrid = document.getElementById("myEventsGrid")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  if (!currentUser) {
    myEventsGrid.innerHTML = '<p>Please log in to see your events.</p>';
    return;
  }

  let eventsToShow = []

  // Get today's date for filtering for past/upcoming events
  const today = new Date();

  if (type === "registered") {
    const registeredEvents = await loadRegisteredEvents(currentUser.student_id);
    eventsToShow = registeredEvents.filter(e => new Date(e.event_date) >= today);
  } else if (type === "created") {
    const createdEvents = await loadCreatedEvents();
    eventsToShow = createdEvents;
  } else if (type === "past") {
    const registeredEvents = await loadRegisteredEvents(currentUser.student_id);
    eventsToShow = registeredEvents.filter(e => new Date(e.event_date) < today);
  }

  console.log("Events to show:", eventsToShow); // DEBUG

  if (eventsToShow.length === 0) {
    myEventsGrid.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No events found.</p>'
    return
  }

  myEventsGrid.innerHTML = eventsToShow
    .map((event) => {
      const poster = (event.poster_path || event.poster || "").replace(/\\/g, "/");

      return `
        <div class="event-card ${type === "created" ? "created-event-card" : ""}">
            ${type === "created" ? `
              <div class="event-actions">
                <button class="btn-icon" onclick="editEvent(${event.event_id})" title="Edit Event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="btn-icon btn-icon-danger" onclick="deleteEvent(${event.event_id})" title="Delete Event">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            `
          : ""
        }
            <a href="event-details.html?id=${event.event_id || event.id}" class="event-card-link">
            ${poster ? `<div class="event-poster"><img src="http://localhost:5000/${poster}" alt="${event.title}"></div>` : ""}
                <div class="event-content">
                    <div class="event-badge">${event.category}</div>
                    <h3>${event.title}</h3>
                    <div class="event-meta">
                        <span>${formatDate(event.event_date || event.date)}</span>
                        <span>${event.event_time || event.time}</span>
                        <span>${event.location}</span>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="event-footer">
                        <span>${(event.capacity - event.slots_left) || 0}/${event.capacity} registered</span>
                        ${type === "created" ? "<span>Your Event</span>" : "<span>Registered</span>"}
                    </div>
                </div>
            </a>
        </div>
    `;
    })
    .join("")
}

window.showNotification = (message) => {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const options = { month: "short", day: "numeric", year: "numeric" }
  return date.toLocaleDateString("en-US", options)
}