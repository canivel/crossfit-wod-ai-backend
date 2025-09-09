// CrossFit WOD AI Admin Dashboard JavaScript

// API Base URL
const API_BASE = '/api/v2/admin';

// Global state
let currentSection = 'dashboard';
let dashboardData = null;
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Load initial data
    await loadDashboardData();
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('🚀 Admin dashboard initialized');
});

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(link => {
        link.classList.remove('active');
        link.classList.add('text-gray-300');
        link.classList.remove('text-white');
    });
    
    // Find and activate current section link
    const currentLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (currentLink) {
        currentLink.classList.add('active');
        currentLink.classList.add('text-white');
        currentLink.classList.remove('text-gray-300');
    }
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'users':
            loadUsersData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'subscriptions':
            loadSubscriptionsData();
            break;
        case 'coupons':
            loadCouponsData();
            break;
        case 'support':
            loadSupportData();
            break;
    }
}

// API functions
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'API call failed');
        }
        
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        showError(`Failed to load data: ${error.message}`);
        throw error;
    } finally {
        showLoading(false);
    }
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        dashboardData = await apiCall('/dashboard');
        updateDashboardMetrics();
        updateRecentActivity();
        updateChartData();
    } catch (error) {
        // Use mock data if API fails
        dashboardData = getMockDashboardData();
        updateDashboardMetrics();
        updateRecentActivity();
        updateChartData();
    }
}

function getMockDashboardData() {
    return {
        metrics: {
            totalUsers: 1247,
            newUsersThisMonth: 156,
            userGrowth: 12.5,
            monthlyRevenue: 12847.50,
            activeSubscriptions: 892,
            totalWorkouts: 2847,
            workoutsThisMonth: 423
        },
        recentActivity: [
            {
                type: 'user_signup',
                description: 'New user registered: john.doe@example.com',
                timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                icon: 'user-plus'
            },
            {
                type: 'workout_generated',
                description: 'Workout generated: AMRAP',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                icon: 'dumbbell'
            },
            {
                type: 'subscription',
                description: 'User upgraded to Pro plan',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                icon: 'credit-card'
            }
        ],
        chartData: {
            userGrowth: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [45, 89, 134, 156, 189, 247]
            },
            revenue: {
                labels: ['Free', 'Pro', 'Elite'],
                data: [355, 312, 88]
            }
        }
    };
}

function updateDashboardMetrics() {
    if (!dashboardData) return;
    
    const metrics = dashboardData.metrics;
    
    // Update metric cards
    document.getElementById('total-users').textContent = formatNumber(metrics.totalUsers);
    document.getElementById('monthly-revenue').textContent = formatCurrency(metrics.monthlyRevenue);
    document.getElementById('active-subs').textContent = formatNumber(metrics.activeSubscriptions);
    document.getElementById('workouts-generated').textContent = formatNumber(metrics.totalWorkouts);
}

function updateRecentActivity() {
    if (!dashboardData) return;
    
    const container = document.getElementById('recent-activity');
    container.innerHTML = '';
    
    dashboardData.recentActivity.forEach(activity => {
        const activityElement = createActivityElement(activity);
        container.appendChild(activityElement);
    });
}

function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-4 p-3 bg-gray-50 rounded-lg';
    
    const iconColor = getActivityIconColor(activity.type);
    const timeAgo = formatTimeAgo(activity.timestamp);
    
    div.innerHTML = `
        <div class="w-10 h-10 ${iconColor} rounded-full flex items-center justify-center">
            <i data-lucide="${activity.icon}" class="w-5 h-5 ${getActivityTextColor(activity.type)}"></i>
        </div>
        <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">${activity.description}</p>
            <p class="text-xs text-gray-500">${timeAgo}</p>
        </div>
    `;
    
    return div;
}

// Users data loading
async function loadUsersData() {
    try {
        const users = await apiCall('/users');
        updateUsersTable(users.users);
    } catch (error) {
        // Use mock data
        const mockUsers = [
            {
                id: '1',
                email: 'john.doe@example.com',
                displayName: 'John Doe',
                plan: 'Pro',
                status: 'active',
                joinedAt: '2025-01-15'
            },
            {
                id: '2',
                email: 'sarah.smith@example.com',
                displayName: 'Sarah Smith',
                plan: 'Free',
                status: 'active',
                joinedAt: '2025-02-01'
            }
        ];
        updateUsersTable(mockUsers);
    }
}

function updateUsersTable(users) {
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        ${user.displayName?.charAt(0) || 'U'}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.displayName || 'N/A'}</div>
                        <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanBadgeClass(user.plan)}">
                    ${user.plan}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(user.status)}">
                    ${user.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(user.joinedAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                    <button class="text-red-600 hover:text-red-900 font-medium">Suspend</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Chart initialization
function initializeCharts() {
    // Set Chart.js default colors for dark theme
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.backgroundColor = 'rgba(255, 255, 255, 0.1)';

    // User Growth Chart
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx) {
        charts.userGrowth = new Chart(userGrowthCtx, {
            type: 'bar',
            data: {
                labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Active Users',
                    data: [50, 40, 300, 320, 500, 350, 200, 230, 500],
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                elements: {
                    bar: {
                        borderRadius: 4
                    }
                }
            }
        });
    }
    
    // Revenue Chart (Sales overview)
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        charts.revenue = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [
                    {
                        label: 'Sales',
                        data: [50, 30, 90, 60, 120, 80, 100],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#8b5cf6',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Revenue',
                        data: [30, 60, 80, 45, 100, 55, 90],
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#06b6d4',
                        pointBorderColor: '#06b6d4',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            display: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
}

function updateChartData() {
    if (!dashboardData || !dashboardData.chartData) return;
    
    // Update user growth chart
    if (charts.userGrowth) {
        charts.userGrowth.data.labels = dashboardData.chartData.userGrowth.labels;
        charts.userGrowth.data.datasets[0].data = dashboardData.chartData.userGrowth.data;
        charts.userGrowth.update();
    }
    
    // Update revenue chart
    if (charts.revenue) {
        charts.revenue.data.labels = dashboardData.chartData.revenue.labels;
        charts.revenue.data.datasets[0].data = dashboardData.chartData.revenue.data;
        charts.revenue.update();
    }
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function getPlanBadgeClass(plan) {
    const classes = {
        'Free': 'bg-gray-100 text-gray-800',
        'Pro': 'bg-blue-100 text-blue-800',
        'Elite': 'bg-purple-100 text-purple-800'
    };
    return classes[plan] || 'bg-gray-100 text-gray-800';
}

function getStatusBadgeClass(status) {
    const classes = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-red-100 text-red-800',
        'suspended': 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getActivityIconColor(type) {
    const colors = {
        'user_signup': 'bg-blue-100',
        'workout_generated': 'bg-green-100',
        'subscription': 'bg-purple-100'
    };
    return colors[type] || 'bg-gray-100';
}

function getActivityTextColor(type) {
    const colors = {
        'user_signup': 'text-blue-600',
        'workout_generated': 'text-green-600',
        'subscription': 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function showError(message) {
    // Simple error notification - you could enhance this with a proper toast system
    console.error(message);
    alert(message); // Replace with better notification system
}

function setupEventListeners() {
    // Add any additional event listeners here
    console.log('Event listeners set up');
}

// Placeholder functions for other sections
async function loadAnalyticsData() {
    console.log('Loading analytics data...');
    // Implementation for analytics
}

async function loadSubscriptionsData() {
    console.log('Loading subscriptions data...');
    // Implementation for subscriptions
}

async function loadCouponsData() {
    console.log('Loading coupons data...');
    // Implementation for coupons
}

async function loadSupportData() {
    console.log('Loading support data...');
    // Implementation for support tickets
}