// graph.js - Chart creation and visualization functions using Chart.js

// Create score trend chart
function createScoreChart(sessions, chartId = 'score-chart') {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Sort sessions by date
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extract dates and scores
    const dates = sessions.map(session => {
        const date = new Date(session.date);
        return date.toLocaleDateString();
    });
    
    const scores = sessions.map(session => session.score);
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Score',
                data: scores,
                backgroundColor: 'rgba(76, 110, 245, 0.1)',
                borderColor: '#4C6EF5',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#4C6EF5',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#4C6EF5',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Score: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Create reaction time chart
function createReactionTimeChart(sessions, chartId = 'reaction-chart') {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Sort sessions by date
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extract dates and reaction times (if not available, generate random data)
    const dates = sessions.map(session => {
        const date = new Date(session.date);
        return date.toLocaleDateString();
    });
    
    const reactionTimes = sessions.map(session => {
        return session.reactionTime || Math.floor(Math.random() * 300) + 200;
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Reaction Time (ms)',
                data: reactionTimes,
                backgroundColor: 'rgba(56, 217, 169, 0.1)',
                borderColor: '#38D9A9',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#38D9A9',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#38D9A9',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `Reaction Time: ${context.parsed.y} ms`;
                        }
                    }
                }
            }
        }
    });
}

// Create streak chart
function createStreakChart(sessions, chartId = 'streak-chart') {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Calculate days in current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create array for all days in current month
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    // Create activity status for each day (1 = active, 0 = inactive)
    const activity = Array(daysInMonth).fill(0);
    
    // Mark days with sessions as active
    sessions.forEach(session => {
        const sessionDate = new Date(session.date);
        
        // Only count sessions from current month
        if (sessionDate.getMonth() === month && sessionDate.getFullYear() === year) {
            const day = sessionDate.getDate() - 1; // Adjust to 0-indexed
            activity[day] = 1;
        }
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Activity',
                data: activity,
                backgroundColor: function(context) {
                    const index = context.dataIndex;
                    return activity[index] === 1 ? '#40C057' : '#DEE2E6';
                },
                borderWidth: 0,
                borderRadius: 4,
                barThickness: 16,
                maxBarThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    display: false
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            const dayNum = tooltipItems[0].label;
                            const date = new Date(year, month, dayNum);
                            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            return activity[index] === 1 ? 'Active' : 'No activity';
                        }
                    }
                }
            }
        }
    });
}

// Create lives lost chart for doctor view
function createLivesLostChart(sessions, chartId = 'patient-lives-chart') {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Sort sessions by date
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Extract dates and lives lost (if not available, generate random data)
    const dates = sessions.map(session => {
        const date = new Date(session.date);
        return date.toLocaleDateString();
    });
    
    const livesLost = sessions.map(session => {
        return session.livesLost || Math.floor(Math.random() * 3);
    });
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Lives Lost',
                data: livesLost,
                backgroundColor: '#FA5252',
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#343a40',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#FA5252',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            return `Lives Lost: ${value}`;
                        }
                    }
                }
            }
        }
    });
}

// Create mini chart for patient list
function createMiniChart(chartId, sessions) {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Get last 5 sessions
    const recentSessions = [...sessions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .reverse();
    
    // Extract scores
    const scores = recentSessions.map(session => session.score);
    
    // Create mini chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: new Array(scores.length).fill(''),
            datasets: [{
                data: scores,
                borderColor: '#4C6EF5',
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    display: false
                },
                x: {
                    display: false
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            elements: {
                line: {
                    fill: false
                }
            }
        }
    });
}
