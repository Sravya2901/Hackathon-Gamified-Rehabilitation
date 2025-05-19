// main.js - Core functionality for the gamified rehabilitation platform

document.addEventListener('DOMContentLoaded', function() {
    // Navigation toggle for mobile
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
        });
    }
    
    // Check authentication status
    checkAuthStatus();
    
    // Handle logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Handle page-specific initialization
    initPageSpecificFunctions();
});

// Initialize functions specific to the current page
function initPageSpecificFunctions() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('user-dashboard')) {
        initUserDashboard();
    } else if (currentPage.includes('doctor-dashboard')) {
        initDoctorDashboard();
    } else if (currentPage.includes('doctor-patient')) {
        initDoctorPatientView();
    } else if (currentPage.includes('user-game')) {
        initGame();
    } else if (currentPage.includes('profile')) {
        initProfile();
    }
}

// User Dashboard Initialization
function initUserDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update welcome message
    const welcomeMsg = document.querySelector('.dashboard-welcome');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Hi, ${user.name}!`;
    }
    
    // Load user stats and render charts
    loadUserStats();
}

// Doctor Dashboard Initialization
function initDoctorDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update welcome message
    const welcomeMsg = document.querySelector('.dashboard-welcome');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome, Dr. ${user.name}`;
    }
    
    // Load patient list
    loadPatientList();
}

// Doctor Patient View Initialization
function initDoctorPatientView() {
    // Get patient ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('id');
    
    if (patientId) {
        loadPatientDetails(patientId);
    } else {
        // Redirect to doctor dashboard if no patient ID
        window.location.href = '/doctor-dashboard';
    }
}

// Profile Page Initialization
function initProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Fill profile form with user data
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');
    
    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;
    if (roleInput) roleInput.value = user.role;
    
    // Handle profile update form submission
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
}

// Load user stats and create dashboard charts
function loadUserStats() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Get stored sessions or create empty array if none
    let sessions = JSON.parse(localStorage.getItem('user_sessions_' + user.id)) || [];
    
    // If no sessions, create some initial data for new users
    if (sessions.length === 0) {
        // We'll handle empty state in the UI instead of creating mock data
        document.getElementById('score-chart').innerHTML = 
            '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No session data yet. Play your first game!</p></div>';
        document.getElementById('reaction-chart').innerHTML = 
            '<div class="empty-state"><i class="fas fa-clock"></i><p>No reaction time data available.</p></div>';
        document.getElementById('streak-chart').innerHTML = 
            '<div class="empty-state"><i class="fas fa-calendar-check"></i><p>Start your streak by playing today!</p></div>';
            
        // Update stat counters
        document.querySelector('.total-sessions').textContent = '0';
        document.querySelector('.avg-score').textContent = '0';
        document.querySelector('.current-streak').textContent = '0';
        
        return;
    }
    
    // Create charts with real session data
    createScoreChart(sessions);
    createReactionTimeChart(sessions);
    createStreakChart(sessions);
    
    // Update stat counters
    document.querySelector('.total-sessions').textContent = sessions.length;
    
    // Calculate average score
    const totalScore = sessions.reduce((sum, session) => sum + session.score, 0);
    const avgScore = Math.round(totalScore / sessions.length);
    document.querySelector('.avg-score').textContent = avgScore;
    
    // Calculate current streak
    let streak = calculateStreak(sessions);
    document.querySelector('.current-streak').textContent = streak;
}

// Load patient list for doctor dashboard
function loadPatientList() {
    // In a real app, this would fetch from server
    // For now, we'll check if there are any patients in localStorage
    
    const patientList = document.querySelector('.patient-list');
    if (!patientList) return;
    
    // Clear patient list
    patientList.innerHTML = '';
    
    // Get all users
    const users = getAllUsers().filter(user => user.role === 'user');
    
    if (users.length === 0) {
        patientList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-injured"></i>
                <p>No patients registered yet.</p>
            </div>
        `;
        return;
    }
    
    // Create patient cards
    users.forEach(patient => {
        const sessions = JSON.parse(localStorage.getItem('user_sessions_' + patient.id)) || [];
        const lastSessionDate = sessions.length > 0 ? 
            new Date(sessions[sessions.length - 1].date).toLocaleDateString() : 
            'No sessions yet';
        
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-card';
        patientCard.innerHTML = `
            <div class="patient-avatar">
                ${patient.name.charAt(0)}
            </div>
            <div class="patient-info">
                <h3 class="patient-name">${patient.name}</h3>
                <div class="patient-status">
                    <i class="far fa-calendar-alt"></i>
                    Last session: ${lastSessionDate}
                </div>
            </div>
            <div class="patient-mini-chart">
                <canvas id="mini-chart-${patient.id}"></canvas>
            </div>
            <div class="patient-actions">
                <a href="/doctor-patient?id=${patient.id}" class="btn btn-primary">View Details</a>
            </div>
        `;
        
        patientList.appendChild(patientCard);
        
        // Create mini chart for patient
        if (sessions.length > 0) {
            createMiniChart('mini-chart-' + patient.id, sessions);
        }
    });
}

// Load patient details for doctor-patient view
function loadPatientDetails(patientId) {
    const patients = getAllUsers().filter(user => user.role === 'user');
    const patient = patients.find(p => p.id.toString() === patientId);
    
    if (!patient) {
        // Patient not found, redirect back to dashboard
        window.location.href = '/doctor-dashboard';
        return;
    }
    
    // Update patient name
    const patientName = document.querySelector('.patient-name');
    if (patientName) {
        patientName.textContent = patient.name;
    }
    
    // Get patient sessions
    const sessions = JSON.parse(localStorage.getItem('user_sessions_' + patient.id)) || [];
    
    if (sessions.length === 0) {
        // No sessions, show empty state
        document.querySelector('.charts-container').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>No session data available for this patient.</p>
            </div>
        `;
        return;
    }
    
    // Create detailed charts
    createScoreChart(sessions, 'patient-score-chart');
    createReactionTimeChart(sessions, 'patient-reaction-chart');
    createLivesLostChart(sessions, 'patient-lives-chart');
    
    // Update patient stats
    document.querySelector('.total-sessions').textContent = sessions.length;
    
    // Calculate average score
    const totalScore = sessions.reduce((sum, session) => sum + session.score, 0);
    const avgScore = Math.round(totalScore / sessions.length);
    document.querySelector('.avg-score').textContent = avgScore;
    
    // Calculate current streak
    let streak = calculateStreak(sessions);
    document.querySelector('.current-streak').textContent = streak;
    
    // Handle notes form submission
    const notesForm = document.querySelector('.notes-form');
    if (notesForm) {
        // Load saved notes
        const notes = localStorage.getItem('patient_notes_' + patient.id) || '';
        document.getElementById('patient-notes').value = notes;
        
        notesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const notes = document.getElementById('patient-notes').value;
            localStorage.setItem('patient_notes_' + patient.id, notes);
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'alert alert-success';
            successMsg.textContent = 'Notes saved successfully!';
            notesForm.appendChild(successMsg);
            
            // Remove message after 3 seconds
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        });
    }
}

// Update user profile
function updateProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    if (!name || !email) {
        showError('Name and email are required');
        return;
    }
    
    // Update user info
    user.name = name;
    user.email = email;
    
    // Update password if provided
    if (currentPassword && newPassword) {
        // In a real app, verify current password
        // For this demo, we'll just update the password
        user.password = newPassword;
    }
    
    // Save updated user
    saveUser(user);
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'alert alert-success';
    successMsg.textContent = 'Profile updated successfully!';
    document.querySelector('.profile-form').appendChild(successMsg);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        successMsg.remove();
    }, 3000);
}

// Helper function to calculate streak from sessions
function calculateStreak(sessions) {
    if (sessions.length === 0) return 0;
    
    // Sort sessions by date
    sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if most recent session is from today
    const lastSessionDate = new Date(sessions[0].date);
    lastSessionDate.setHours(0, 0, 0, 0);
    
    if (lastSessionDate.getTime() !== today.getTime()) {
        // Last session is not from today, streak broken
        return 0;
    }
    
    // Count consecutive days
    let streak = 1;
    let currentDate = today;
    
    for (let i = 1; i < sessions.length; i++) {
        // Move to previous day
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() - 1);
        
        // Get this session's date (without time)
        const sessionDate = new Date(sessions[i].date);
        sessionDate.setHours(0, 0, 0, 0);
        
        // If there's a session on the previous day, increase streak
        if (sessionDate.getTime() === currentDate.getTime()) {
            streak++;
        } else {
            // Streak broken
            break;
        }
    }
    
    return streak;
}

// Show error message
function showError(message) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'alert alert-danger';
    errorMsg.textContent = message;
    
    // Find a form to append the error to
    const form = document.querySelector('form');
    if (form) {
        form.prepend(errorMsg);
        
        // Remove error after 3 seconds
        setTimeout(() => {
            errorMsg.remove();
        }, 3000);
    }
}

// Helper to get all users from localStorage
function getAllUsers() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
}
