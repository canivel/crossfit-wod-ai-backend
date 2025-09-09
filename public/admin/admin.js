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

// Dashboard data loading - optimized with minimal data
async function loadDashboardData() {
    try {
        // Load only essential metrics first - fast response
        const metricsPromise = apiCall('/dashboard/metrics');
        
        // Load charts data separately to avoid blocking
        setTimeout(() => loadChartData(), 100);
        
        // Load recent activity with limit
        setTimeout(() => loadRecentActivity(), 200);
        
        const metrics = await metricsPromise;
        updateDashboardMetrics(metrics);
        
    } catch (error) {
        // Use lightweight mock data
        const lightweightData = getLightweightMockData();
        updateDashboardMetrics(lightweightData);
        
        // Load other components with delay
        setTimeout(() => loadChartData(), 100);
        setTimeout(() => loadRecentActivity(), 200);
    }
}

// Separate chart loading for better performance
async function loadChartData() {
    try {
        const chartData = await apiCall('/dashboard/charts');
        updateChartData(chartData);
    } catch (error) {
        // Load mock chart data
        const mockCharts = getMockChartData();
        updateChartData(mockCharts);
    }
}

// Load recent activity with pagination
async function loadRecentActivity(page = 1, limit = 5) {
    try {
        const activity = await apiCall(`/dashboard/activity?page=${page}&limit=${limit}`);
        updateRecentActivity(activity.data, page === 1);
    } catch (error) {
        // Load mock activity data
        const mockActivity = getMockActivityData(limit);
        updateRecentActivity(mockActivity, page === 1);
    }
}

// Lightweight mock data for fast initial load
function getLightweightMockData() {
    return {
        metrics: {
            totalUsers: 53000,
            todaysUsers: 2300,
            thisWeekRevenue: 3462,
            thisMonthRevenue: 103430,
            userGrowth: 12.5,
            revenueGrowth: 8.2,
            subscriptionGrowth: -2.1,
            workoutGrowth: 22.4
        }
    };
}

// Mock chart data loaded separately
function getMockChartData() {
    return {
        userGrowth: {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: [50, 40, 300, 320, 500, 350, 200, 230, 500]
        },
        salesOverview: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [
                { name: 'Sales', data: [50, 30, 90, 60, 120, 80, 100] },
                { name: 'Revenue', data: [30, 60, 80, 45, 100, 55, 90] }
            ]
        }
    };
}

// Mock activity data with pagination support
function getMockActivityData(limit = 5) {
    const activities = [
        {
            type: 'user_signup',
            description: 'New user registered',
            user: 'john.doe@example.com',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            icon: 'user-plus'
        },
        {
            type: 'subscription',
            description: 'User upgraded to Pro plan',
            user: 'sarah.smith@example.com', 
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            icon: 'credit-card'
        },
        {
            type: 'workout_generated',
            description: 'Workout generated: AMRAP',
            user: 'mike.jones@example.com',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            icon: 'dumbbell'
        },
        {
            type: 'support_ticket',
            description: 'New support ticket opened',
            user: 'anna.wilson@example.com',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            icon: 'headphones'
        },
        {
            type: 'user_signup',
            description: 'New user registered',
            user: 'david.brown@example.com',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            icon: 'user-plus'
        }
    ];
    
    return activities.slice(0, limit);
}

// Keep original function for backward compatibility
function getMockDashboardData() {
    return {
        metrics: getLightweightMockData().metrics,
        chartData: getMockChartData(),
        recentActivity: getMockActivityData(3)
    };
}

function updateDashboardMetrics(data) {
    const metrics = data?.metrics || data;
    if (!metrics) return;
    
    // Update metric cards with new optimized data structure
    const totalUsersEl = document.getElementById('total-users');
    const todaysUsersEl = document.getElementById('todays-users');
    const thisWeekEl = document.getElementById('this-week');
    const thisMonthEl = document.getElementById('this-month');
    
    if (totalUsersEl) {
        totalUsersEl.textContent = formatCurrency(metrics.totalUsers || 53000);
        totalUsersEl.parentElement.classList.remove('loading');
    }
    
    if (todaysUsersEl) {
        todaysUsersEl.textContent = formatNumber(metrics.todaysUsers || 2300);
        todaysUsersEl.parentElement.classList.remove('loading');
    }
    
    if (thisWeekEl) {
        thisWeekEl.textContent = formatCurrency(metrics.thisWeekRevenue || 3462);
        thisWeekEl.parentElement.classList.remove('loading');
    }
    
    if (thisMonthEl) {
        thisMonthEl.textContent = formatCurrency(metrics.thisMonthRevenue || 103430);
        thisMonthEl.parentElement.classList.remove('loading');
    }
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

// Users data loading with pagination
let usersCurrentPage = 1;
let usersLoading = false;

async function loadUsersData(page = 1, limit = 20, reset = true) {
    if (usersLoading) return;
    
    usersLoading = true;
    if (reset) showUsersLoading();
    
    try {
        const users = await apiCall(`/users?page=${page}&limit=${limit}`);
        updateUsersTable(users.users || [], reset);
        usersCurrentPage = page;
    } catch (error) {
        // Use lightweight mock data
        const mockUsers = getMockUsers(limit, page);
        updateUsersTable(mockUsers, reset);
        usersCurrentPage = page;
    } finally {
        usersLoading = false;
        hideUsersLoading();
    }
}

// Generate mock users for pagination
function getMockUsers(limit = 20, page = 1) {
    const users = [];
    const startIndex = (page - 1) * limit;
    
    for (let i = 0; i < limit; i++) {
        const index = startIndex + i;
        users.push({
            id: `user-${index + 1}`,
            email: `user${index + 1}@example.com`,
            displayName: `User ${index + 1}`,
            plan: ['Free', 'Pro', 'Elite'][index % 3],
            status: 'active',
            joinedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return users;
}

function showUsersLoading() {
    const tbody = document.getElementById('users-table');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center">
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3"></div>
                        <span class="text-gray-400">Loading users...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function hideUsersLoading() {
    // Loading will be replaced by actual data in updateUsersTable
}

function updateUsersTable(users, reset = true) {
    const tbody = document.getElementById('users-table');
    
    if (reset) {
        tbody.innerHTML = '';
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-700/50 transition-colors border-b border-gray-700';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        ${user.displayName?.charAt(0) || 'U'}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-white">${user.displayName || 'N/A'}</div>
                        <div class="text-sm text-gray-400">${user.email}</div>
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                ${new Date(user.joinedAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex space-x-2">
                    <button class="text-blue-400 hover:text-blue-300 font-medium transition-colors">Edit</button>
                    <button class="text-red-400 hover:text-red-300 font-medium transition-colors">Suspend</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add pagination controls if this is the first page
    if (reset) {
        addUsersPagination();
    }
}

function addUsersPagination() {
    const container = document.querySelector('#users-section .bg-dark-card:last-child');
    if (!container) return;
    
    // Remove existing pagination
    const existingPagination = container.querySelector('.pagination-controls');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    // Add new pagination controls
    const paginationHtml = `
        <div class="pagination-controls flex justify-between items-center px-6 py-4 border-t border-gray-700">
            <div class="text-sm text-gray-400">
                Showing ${(usersCurrentPage - 1) * 20 + 1} to ${usersCurrentPage * 20} of 1,247 users
            </div>
            <div class="flex space-x-2">
                <button onclick="loadUsersData(${usersCurrentPage - 1})" 
                        ${usersCurrentPage === 1 ? 'disabled' : ''} 
                        class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <span class="px-3 py-1 text-sm text-gray-400">Page ${usersCurrentPage}</span>
                <button onclick="loadUsersData(${usersCurrentPage + 1})" 
                        class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
                    Next
                </button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', paginationHtml);
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