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

async function setupEventForm() {
  const form = document.getElementById("createEventForm")
  const urlParams = new URLSearchParams(window.location.search)
  const isEditing = urlParams.has("edit")
  const posterLabel = document.querySelector('label[for="eventPoster"]');
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))

  // EDIT CREATED EVENT
  if (isEditing) {
    const event_id = urlParams.get("edit")
    posterLabel.textContent = "Event Poster (leave empty to keep current poster)";
    await loadEventForEditing(event_id)
    document.getElementById("submitBtn").textContent = "Update Event"
  }

  // FORM EDIT & CREATE SUBMISSION HANDLER
  form.addEventListener("submit", (e) => {
    e.preventDefault()

    if (isEditing) {
      updateEvent(urlParams.get("edit"))
      window.location.assign("/frontend/my-events.html");
    } else {
      createEvent()
    }
  })
}

// CREATE EVENT SUBMISSION
async function createEvent() {
  const form = document.getElementById("createEventForm")
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  const formData = new FormData(form)

  formData.append("organizer_id", currentUser.student_id)
  formData.set("capacity", parseInt(formData.get("capacity")) || 0)
  formData.set("slots_left", parseInt(formData.get("capacity")) || 0)

  try {
    const res = await fetch("http://localhost:5000/api/events/create-event", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message)

    alert(data.message)
    window.location.assign("/frontend/my-events.html");
  } catch (err) {
    console.error(err)
    alert("Failed to create event")
  }
}

// EDIT CREATED EVENT
async function loadEventForEditing(event_id) {
  try {
    const res = await fetch(`http://localhost:5000/api/events/${event_id}`);
    if (!res.ok) throw new Error("Failed to load event");

    const event = await res.json();
    // Prevents timezone shift
    const eventDate = new Date(event.event_date);
    const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    document.getElementById("eventTitle").value = event.title;
    document.getElementById("eventDescription").value = event.description;
    document.getElementById("eventCategory").value = event.category;
    document.getElementById("eventDate").value = localDate;
    document.getElementById("eventTime").value = event.event_time;
    document.getElementById("eventLocation").value = event.location;
    document.getElementById("eventCapacity").value = event.capacity;

    // Poster preview
    const posterPreview = document.getElementById("posterPreview");
    const posterImage = document.getElementById("posterImage");
    if (event.poster_path) {
      posterPreview.style.display = "block";
      posterImage.src = `http://localhost:5000/${event.poster_path.replace(/\\/g, "/")}`;
    }

  } catch (err) {
    console.error(err);
    alert("Failed to load event for editing");
  }
}

// EDIT CREATED EVENT SUBMISSION
async function updateEvent(event_id) {
  const formData = new FormData(document.getElementById("createEventForm"));

  const res = await fetch(`http://localhost:5000/api/events/${event_id}`, {
    method: "PUT",
    body: formData
  });

  if (res.ok) {
    alert("Event updated successfully!");
    window.location.assign("/frontend/my-events.html");
  } else {
    alert("Failed to update event");
  }
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

window.showNotification = (message) => {
  const toast = document.getElementById("notificationToast")
  toast.textContent = message
  toast.classList.add("show")

  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}