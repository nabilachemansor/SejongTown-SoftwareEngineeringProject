document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI()
  setupAuthModal()
  loadEventDetails()
  setupRSVP()
})

function checkAuth() {
  const raw = localStorage.getItem("currentUser")
  if (!raw || raw === "undefined" || raw === "null") {
    try { localStorage.removeItem("currentUser") } catch (e) {}
    return null
  }
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error("Invalid JSON in localStorage.currentUser:", raw)
    try { localStorage.removeItem("currentUser") } catch (e) {}
    return null
  }
}

// Get registration key for current user
function getRegistrationKey() {
  const user = checkAuth()
  return user && user.student_id ? `registeredEvents_${user.student_id}` : null
}

// Get registered events for current user
function getUserRegisteredEvents() {
  const key = getRegistrationKey()
  if (!key) return []
  return JSON.parse(localStorage.getItem(key) || "[]")
}

// Save registered events for current user
function setUserRegisteredEvents(events) {
  const key = getRegistrationKey()
  if (key) {
    localStorage.setItem(key, JSON.stringify(events))
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

async function loadEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const event_id = urlParams.get("id");

  try {
    const res = await fetch(`http://localhost:5000/api/events/${event_id}`);
    if (!res.ok) throw new Error("Event not found");

    const event = await res.json();

    // Poster
    const eventDetailHeader = document.querySelector(".event-detail-header");

    document.querySelectorAll(".event-detail-poster").forEach(el => el.remove());

    if (event.poster_path && eventDetailHeader) {
      // Create poster element in html between event-detail-header div
      const posterElement = document.createElement("div");
      posterElement.className = "event-detail-poster";
      posterElement.innerHTML = `<img src="http://localhost:5000/${event.poster_path.replace(/\\/g, "/")}" alt="${event.title}">`;
      eventDetailHeader.insertBefore(posterElement, eventDetailHeader.firstChild);
    }

    document.getElementById("eventBadge").textContent = event.category;
    document.getElementById("eventBadge").className = "event-badge";
    document.getElementById("eventTitle").textContent = event.title;
    // Prevent timezone shift
    const localDate = new Date(event.event_date);
    document.getElementById("eventDate").textContent = localDate.toISOString().split("T")[0];
    document.getElementById("eventTime").textContent = event.event_time;
    document.getElementById("eventLocation").textContent = event.location;
    document.getElementById("eventDescription").textContent = event.description;
    document.getElementById("eventOrganizer").textContent = event.organizer_name;
    document.getElementById("eventCapacity").textContent = `${event.capacity - event.slots_left}/${event.capacity} registered`;
    document.getElementById("eventRegistration").textContent = event.registration_status;

    const spotsLeft = event.slots_left;
    document.getElementById("spotsLeft").textContent = `${spotsLeft} spots remaining`;

    // ===== Check if user is registered =====
    const currentUser = checkAuth()
    const registeredEvents = getUserRegisteredEvents()
    const isRegistered = registeredEvents.includes(Number(event_id))

    const rsvpBtn = document.getElementById("rsvpBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const checkinSection = document.getElementById("checkinSection");

    if (isRegistered) {
      // Show QR code instead of button
      rsvpBtn.style.display = "none";
      checkinSection.style.display = "block";
      cancelBtn.style.display = "block";
    } else {
      // Show register button
      rsvpBtn.style.display = "block";
      rsvpBtn.textContent = "Register for Event";
      cancelBtn.style.display = "none";
      rsvpBtn.classList.remove("btn-secondary");
      rsvpBtn.classList.add("btn-primary");
      checkinSection.style.display = "none";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("eventDetailContainer").innerHTML = "<p>Event not found.</p>";
  }
}

// IMAGE MODAL FOR POSTER TO SHOW FULL IMAGE
document.addEventListener("click", function (e) {
  // Check if the clicked element is the poster image, if yes show the full image of poster
  if (e.target.closest(".event-detail-poster img")) {
    const imgSrc = e.target.src;

    // Create modal
    const modal = document.createElement("div");
    modal.className = "image-modal";
    modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <img src="${imgSrc}" alt="Full Event Poster">
        </div>
        `;
    document.body.appendChild(modal);

    // Close modal on click
    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("close") || e.target === modal) {
        modal.remove();
      }
    });

  }
});

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// RSVP
async function registerForEvent(event_id) {
  const res = await fetch(`http://localhost:5000/api/events/${event_id}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: currentUser.student_id })
  });
  return res.json();
}

// CANCEL RSVP
async function cancelRegistration(event_id) {
  const res = await fetch(`http://localhost:5000/api/events/${event_id}/register`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: currentUser.student_id })
  });
  return res.json();
}

// SETUP RSVP BUTTON
function setupRSVP() {
  const rsvpBtn = document.getElementById("rsvpBtn")
  const urlParams = new URLSearchParams(window.location.search);
  const event_id = Number(urlParams.get("id"));

  // SETUP RSVP BUTTON
  rsvpBtn.addEventListener("click", async () => {
    if (!requireAuth()) return;

    const registeredEvents = getUserRegisteredEvents();
    const isRegistered = registeredEvents.includes(event_id);

    if (isRegistered) {
      await cancelRegistration(event_id);
      window.showNotification("Registration cancelled");
      setUserRegisteredEvents(registeredEvents.filter(id => id !== event_id));
    } else {
      await registerForEvent(event_id);
      window.showNotification("Successfully registered!");
      registeredEvents.push(event_id);
      setUserRegisteredEvents(registeredEvents);
    }

    // Re-render event details (QR code logic is inside loadEventDetails)
    await loadEventDetails();
  });

  // SETUP CANCEL BUTTON
  cancelBtn.addEventListener("click", async () => {
    await cancelRegistration(event_id);
    window.showNotification("Registration cancelled");

    const registeredEvents = getUserRegisteredEvents();
    setUserRegisteredEvents(registeredEvents.filter(id => id !== event_id));

    // Re-render event details to refresh UI
    await loadEventDetails();
  });
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

window.showNotification = (message) => {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}