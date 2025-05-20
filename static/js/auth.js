// auth.js - Handles authentication, user registration, and session management

// Check authentication status and redirect if needed
function checkAuthStatus() {
  // Get current user from localStorage
  const user = getCurrentUser();

  // Get current page path
  const currentPage = window.location.pathname;

  // Public pages that don't require authentication
  const publicPages = ["/", "/login", "/signup", "/role-selection"];

  // Check if authentication is required for current page
  const authRequired = !publicPages.includes(currentPage);

  if (authRequired && !user) {
    // Redirect to login page if auth required but not logged in
    window.location.href = "/role-selection";
    return;
  }

  if (user) {
    // If logged in, update navbar to show logged in state
    updateNavbarForLoggedInUser(user);

    // Redirect based on role if on login/signup/role-selection pages
    if (
      currentPage === "/login" ||
      currentPage === "/signup" ||
      currentPage === "/role-selection" ||
      currentPage === "/"
    ) {
      if (user.role === "patient") {
        window.location.href = "/user-dashboard";
      } else if (user.role === "therapist") {
        window.location.href = "/patient-details";
      }
    }

    // Redirect therapists away from home page
    if (currentPage === "/home" && user.role === "therapist") {
      window.location.href = "/patient-details";
    }

    // Redirect users to the correct communication page
    if (currentPage === "/communication" && user.role === "therapist") {
      window.location.href = "/therapist-communication";
    }

    if (currentPage === "/therapist-communication" && user.role === "patient") {
      window.location.href = "/communication";
    }

    // Check if user is accessing the correct dashboard
    if (
      (currentPage === "/user-dashboard" ||
        currentPage === "/my-exercises" ||
        currentPage === "/user-game") &&
      user.role !== "patient"
    ) {
      window.location.href = "/patient-details";
    }

    if (
      (currentPage === "/patient-details" ||
        currentPage === "/patient-details") &&
      user.role !== "therapist"
    ) {
      window.location.href = "/home";
    }
  }
}

// Update navbar for logged in user
function updateNavbarForLoggedInUser(user) {
  const navbarMenu = document.querySelector(".navbar-menu");
  if (!navbarMenu) return;

  // Clear existing menu items
  navbarMenu.innerHTML = "";

  // Add home link
  // const homeLink = document.createElement('li');
  // homeLink.innerHTML = `<a href="/home">Home</a>`;
  // navbarMenu.appendChild(homeLink);

  // Add dashboard link based on role
  const dashboardLink = document.createElement("li");
  dashboardLink.innerHTML = `<a href="${
    user.role === "patient" ? "/user-dashboard" : "/patient-details"
  }">Dashboard</a>`;
  navbarMenu.appendChild(dashboardLink);

  // Add exercises link for patients
  if (user.role === "patient") {
    const exercisesLink = document.createElement("li");
    exercisesLink.innerHTML = `<a href="/my-exercises">My Exercises</a>`;
    navbarMenu.appendChild(exercisesLink);
  }

  // Add patient details link for therapists
  if (user.role === "therapist") {
    const patientDetailsLink = document.createElement("li");
    patientDetailsLink.innerHTML = `<a href="/patient-details">Patient Management</a>`;
    navbarMenu.appendChild(patientDetailsLink);
  }

  // Add communication link based on role
  // const communicationLink = document.createElement('li');
  // if (user.role === 'patient') {
  //     communicationLink.innerHTML = `<a href="/communication">Navigation</a>`;
  // } else {
  //     communicationLink.innerHTML = `<a href="/therapist-communication">Patient Communications</a>`;
  // }
  // navbarMenu.appendChild(communicationLink);

  // // Add profile link
  // const profileLink = document.createElement('li');
  // profileLink.innerHTML = `<a href="/profile">Profile</a>`;
  // navbarMenu.appendChild(profileLink);

  // Add logout button
  const logoutItem = document.createElement("li");
  logoutItem.innerHTML = `<a href="#" class="logout-btn">Logout</a>`;
  navbarMenu.appendChild(logoutItem);

  // Add event listener for logout
  logoutItem.querySelector(".logout-btn").addEventListener("click", logout);
}

// Handle login form submission
function login(event) {
  if (event) event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!email || !password) {
    showError("Please enter both email and password");
    return;
  }

  // Get all users from localStorage
  const users = getAllUsers();

  // Find user with matching email and password
  const user = users.find(
    (u) => u.email === email && u.password === password && u.role === role
  );

  if (!user) {
    showError("Invalid email, password, or role");
    return;
  }

  // Save current user ID to localStorage
  localStorage.setItem("currentUserId", user.id);

  // Redirect to appropriate page
  if (user.role === "patient") {
    window.location.href = "/user-dashboard"; // Redirect to home page first
  } else if (user.role === "therapist") {
    window.location.href = "/patient-details";
  }
}

// Handle signup form submission
function signup(event) {
  if (event) event.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const role = document.getElementById("role").value;

  // Validate input
  if (!name || !email || !password || !confirmPassword) {
    showError("All fields are required");
    return;
  }

  if (password !== confirmPassword) {
    showError("Passwords do not match");
    return;
  }

  // Get all users from localStorage
  const users = getAllUsers();

  // Check if email already exists
  if (users.some((user) => user.email === email)) {
    showError("Email already registered");
    return;
  }

  // Create new user
  const newUser = {
    id: Date.now(), // Use timestamp as a simple ID
    name,
    email,
    password,
    role,
  };

  // Add new user to users array
  users.push(newUser);

  // Save updated users array to localStorage
  localStorage.setItem("users", JSON.stringify(users));

  // Set as current user
  localStorage.setItem("currentUserId", newUser.id);

  // Redirect to appropriate page
  if (role === "patient") {
    window.location.href = "/user-dashboard"; // Redirect to home page first
  } else if (role === "therapist") {
    window.location.href = "/patient-details";
  }
}

// Handle logout
function logout(event) {
  if (event) event.preventDefault();

  // Remove current user from localStorage
  localStorage.removeItem("currentUserId");

  // Redirect to role selection page
  window.location.href = "/role-selection";
}

// Get current logged in user
function getCurrentUser() {
  const currentUserId = localStorage.getItem("currentUserId");
  if (!currentUserId) return null;

  // Get all users
  const users = getAllUsers();

  // Find user with matching ID
  return users.find((user) => user.id.toString() === currentUserId.toString());
}

// Save user data
function saveUser(user) {
  // Get all users
  const users = getAllUsers();

  // Find index of user to update
  const index = users.findIndex((u) => u.id === user.id);

  if (index !== -1) {
    // Update user
    users[index] = user;

    // Save updated users array
    localStorage.setItem("users", JSON.stringify(users));
  }
}

// Helper to get all users from localStorage
function getAllUsers() {
  const usersJson = localStorage.getItem("users");
  return usersJson ? JSON.parse(usersJson) : [];
}

// Show error message
function showError(message) {
  const errorMsg = document.createElement("div");
  errorMsg.className = "alert alert-danger";
  errorMsg.textContent = message;

  // Find a form to append the error to
  const form = document.querySelector("form");
  if (form) {
    form.prepend(errorMsg);

    // Remove error after 3 seconds
    setTimeout(() => {
      errorMsg.remove();
    }, 3000);
  }
}

// Initialize auth forms when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize login form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", login);
  }

  // Initialize signup form
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", signup);
  }
});
