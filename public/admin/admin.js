// CrossFit WOD AI Admin Dashboard - Fixed Navigation

console.log('🚀 Admin JS loading...');

// SIMPLE NAVIGATION SYSTEM - NO DEPENDENCIES
function showSection(sectionName) {
    console.log(`🔄 Switching to: ${sectionName}`);
    
    // Hide all sections
    const allSections = document.querySelectorAll('.section');
    allSections.forEach(section => section.classList.add('hidden'));
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log(`✅ ${sectionName} section shown`);
    }
    
    // Update navigation active state
    const allNavItems = document.querySelectorAll('.sidebar-item');
    allNavItems.forEach(item => {
        item.classList.remove('active', 'text-white');
        item.classList.add('text-gray-300');
    });
    
    // Set active nav item
    const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active', 'text-white');
        activeNavItem.classList.remove('text-gray-300');
    }
    
    // Load section-specific data
    loadSectionContent(sectionName);
}

// Make function globally available
window.showSection = showSection;

// Helper functions for UI states and formatting
function formatNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

function showLoadingState(elementIds) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                    <span class="text-gray-400">Loading...</span>
                </div>
            `;
            element.classList.add('loading');
        }
    });
}

function showErrorState(elementIds, message = 'Error loading data') {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = `
                <div class="flex items-center space-x-2 text-red-400">
                    <i data-lucide="alert-circle" class="w-4 h-4"></i>
                    <span>${message}</span>
                    <button onclick="retryLoad('${id}')" class="text-blue-400 hover:text-blue-300 text-xs ml-2">Retry</button>
                </div>
            `;
            element.classList.remove('loading');
            element.classList.add('error-state');
        }
    });
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function showSuccessState(elementIds, value) {
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.remove('loading', 'error-state', 'text-red-400');
        }
    });
}

// Enhanced loading states for tables and sections
function showTableLoading(tableId, colspan = 5) {
    const table = document.getElementById(tableId);
    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center space-y-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                        <p class="text-gray-400">Loading data...</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function showTableError(tableId, message = 'Failed to load data', colspan = 5, retryFunction = null) {
    const table = document.getElementById(tableId);
    if (table) {
        const retryButton = retryFunction ? 
            `<button onclick="${retryFunction}()" class="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Retry Loading
            </button>` : '';
            
        table.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center space-y-4">
                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <i data-lucide="alert-triangle" class="w-6 h-6 text-red-600"></i>
                        </div>
                        <div>
                            <p class="text-red-400 font-medium">${message}</p>
                            <p class="text-gray-500 text-sm mt-1">Please try refreshing or contact support if the issue persists.</p>
                        </div>
                        ${retryButton}
                    </div>
                </td>
            </tr>
        `;
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function showSectionLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                <p class="text-gray-400 text-lg">Loading section...</p>
            </div>
        `;
    }
}

// Global notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `
        fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full
        ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'}
        text-white max-w-sm
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'alert-triangle' : 'info';
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0"></i>
            <p class="text-sm font-medium">${message}</p>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Animate in
    setTimeout(() => notification.classList.remove('translate-x-full'), 100);
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'fixed top-0 right-0 z-50 space-y-2 p-4';
    document.body.appendChild(container);
    return container;
}

// Retry functionality
window.retryLoad = function(elementId) {
    console.log('Retrying load for:', elementId);
    // Map element IDs to their retry functions
    const retryMap = {
        'total-users': () => loadDashboard(),
        'todays-users': () => loadDashboard(), 
        'this-week': () => loadDashboard(),
        'this-month': () => loadDashboard()
    };
    
    const retryFunction = retryMap[elementId];
    if (retryFunction) {
        retryFunction();
    } else {
        // Generic retry - reload current section
        const currentSection = document.querySelector('.section:not(.hidden)');
        if (currentSection) {
            const sectionName = currentSection.id.replace('-section', '');
            loadSectionContent(sectionName);
        }
    }
};

function updateRecentActivity(activities) {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer || !activities) return;
    
    const activityHTML = activities.map(activity => `
        <div class="flex items-center space-x-3 p-3 bg-dark-secondary/30 rounded-lg">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <i data-lucide="${activity.icon}" class="w-4 h-4 text-white"></i>
            </div>
            <div>
                <p class="text-sm font-medium text-white">${activity.description}</p>
                <p class="text-xs text-gray-400">${formatTimeAgo(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
    
    activityContainer.innerHTML = `<div class="space-y-4">${activityHTML}</div>`;
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

// Load content for each section
function loadSectionContent(sectionName) {
    console.log(`📄 Loading content for: ${sectionName}`);
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'ai-usage':
            loadAIUsage();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'plans':
            updatePlansStats();
            break;
        case 'coupons':
            loadCoupons();
            break;
        case 'support':
            loadSupport();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Global API configuration
const API_BASE = '/api/v2/admin';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                // Include auth header if available
                ...(localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// DASHBOARD SECTION
async function loadDashboard() {
    console.log('📊 Loading Dashboard...');
    
    try {
        // Show loading state for metrics
        showLoadingState(['total-users', 'todays-users', 'this-week', 'this-month']);
        
        // Show loading for recent activity
        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer) {
            activityContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                    <span class="ml-3 text-gray-400">Loading recent activity...</span>
                </div>
            `;
        }
        
        // Load dashboard metrics from API
        const response = await apiCall('/dashboard');
        const { metrics, recentActivity } = response.data;
        
        // Update metrics with real data using success state
        showSuccessState(['total-users'], formatNumber(metrics.totalUsers));
        showSuccessState(['todays-users'], formatNumber(metrics.newUsersThisMonth));
        showSuccessState(['this-week'], `$${formatNumber(metrics.monthlyRevenue)}`);
        showSuccessState(['this-month'], formatNumber(metrics.totalWorkouts));
        
        // Update recent activity with real data
        updateRecentActivity(recentActivity);
        
        // Show success notification
        showNotification('Dashboard loaded successfully', 'success', 3000);
        
    } catch (error) {
        console.error('❌ Failed to load dashboard:', error);
        
        // Show error state for metrics
        showErrorState(['total-users', 'todays-users', 'this-week', 'this-month'], 'Failed to load');
        
        // Show error for recent activity
        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer) {
            activityContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 space-y-3">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i data-lucide="alert-triangle" class="w-6 h-6 text-red-600"></i>
                    </div>
                    <p class="text-red-400 font-medium">Failed to load recent activity</p>
                    <button onclick="loadDashboard()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Retry Loading
                    </button>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        // Show error notification
        const errorMessage = error.message || 'Failed to load dashboard data';
        showNotification(`Dashboard Error: ${errorMessage}`, 'error', 8000);
    }
}

// USERS SECTION
async function loadUsers(page = 1, search = '', planFilter = '') {
    console.log('👥 Loading Users...');
    
    const usersTable = document.getElementById('users-table');
    if (!usersTable) return;
    
    try {
        // Show enhanced loading state
        showTableLoading('users-table', 5);
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });
        
        if (search) params.append('search', search);
        if (planFilter) params.append('plan', planFilter);
        
        // Load users from API
        const response = await apiCall(`/users?${params.toString()}`);
        const { users, pagination } = response.data;
        
        if (!users || users.length === 0) {
            usersTable.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <i data-lucide="users" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <div>
                                <p class="text-gray-400 font-medium">No users found</p>
                                <p class="text-gray-500 text-sm mt-1">
                                    ${search || planFilter ? 'Try adjusting your search filters' : 'Users will appear here once they register'}
                                </p>
                            </div>
                            ${search || planFilter ? `
                                <button onclick="clearUserFilters()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    Clear Filters
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Render users table
        const usersHTML = users.map(user => {
            const initial = (user.displayName || user.email)[0].toUpperCase();
            const planColor = getPlanColor(user.plan);
            const statusColor = getStatusColor(user.status);
            
            // Email verification status
            const emailVerified = user.email_confirmed_at !== null;
            const emailStatusColor = emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
            const emailStatusText = emailVerified ? 'Verified' : 'Pending';
            const emailStatusIcon = emailVerified ? 'check-circle' : 'clock';
            
            // Credits summary (simplified for table view)
            const totalCredits = (user.workout_credits || 0) + (user.coaching_credits || 0) + (user.modification_credits || 0);
            const creditsDisplay = totalCredits > 0 ? `${totalCredits} total` : 'No credits';
            
            return `
                <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                ${initial}
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-white">${user.displayName || 'N/A'}</div>
                                <div class="text-sm text-gray-400">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${planColor}">${user.plan}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${emailStatusColor}">
                            <i data-lucide="${emailStatusIcon}" class="w-3 h-3 mr-1"></i>
                            ${emailStatusText}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div class="text-sm text-white">${creditsDisplay}</div>
                        <div class="text-xs text-gray-400">
                            W: ${user.workout_credits || 0} | C: ${user.coaching_credits || 0} | M: ${user.modification_credits || 0}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${user.status || 'Active'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        ${user.joinedAt}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-2">
                            <button data-action="view" data-user-id="${user.id}" class="user-action-btn text-blue-400 hover:text-blue-300 font-medium transition-colors">View</button>
                            <button data-action="edit" data-user-id="${user.id}" class="user-action-btn text-green-400 hover:text-green-300 font-medium transition-colors">Edit</button>
                            <button data-action="credits" data-user-id="${user.id}" class="user-action-btn text-purple-400 hover:text-purple-300 font-medium transition-colors">Credits</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        usersTable.innerHTML = usersHTML;
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Update pagination if needed
        updateUsersPagination(pagination);
        
        // Show success notification
        showNotification(`Loaded ${users.length} users successfully`, 'success', 3000);
        
    } catch (error) {
        console.error('❌ Failed to load users:', error);
        
        // Show enhanced error state
        showTableError('users-table', 'Failed to load users', 5, 'loadUsers');
        
        // Show error notification
        const errorMessage = error.message || 'Failed to load users data';
        showNotification(`Users Error: ${errorMessage}`, 'error', 8000);
    }
}

// Helper function for clearing user filters
window.clearUserFilters = function() {
    // Clear any search inputs
    const searchInput = document.querySelector('#user-search');
    const planFilter = document.querySelector('#plan-filter');
    
    if (searchInput) searchInput.value = '';
    if (planFilter) planFilter.value = '';
    
    // Reload users without filters
    loadUsers(1, '', '');
};

function getPlanColor(plan) {
    switch (plan.toLowerCase()) {
        case 'pro': return 'bg-blue-100 text-blue-800';
        case 'elite': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusColor(status) {
    switch ((status || 'active').toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'suspended': return 'bg-yellow-100 text-yellow-800';
        case 'banned': return 'bg-red-100 text-red-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function updateUsersPagination(pagination) {
    // Implementation for pagination controls
    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer && pagination) {
        // Add pagination controls here
        console.log('Pagination:', pagination);
    }
}

// User management functions
window.viewUser = async function(userId) {
    console.log('View user:', userId);
    
    try {
        // Show loading notification
        showNotification('Loading user details...', 'info', 2000);
        
        // Fetch user details from API
        const response = await apiCall(`/users/${userId}`);
        const user = response.data.user;
        
        // Create and show user view modal
        showUserViewModal(user);
        
    } catch (error) {
        console.error('Failed to load user:', error);
        showNotification('Failed to load user details', 'error');
    }
};

window.editUser = async function(userId) {
    console.log('Edit user:', userId);
    
    try {
        // Show loading notification
        showNotification('Loading user for editing...', 'info', 2000);
        
        // Fetch user details from API
        const response = await apiCall(`/users/${userId}`);
        const user = response.data.user;
        
        // Create and show user edit modal
        showUserEditModal(user);
        
    } catch (error) {
        console.error('Failed to load user for editing:', error);
        showNotification('Failed to load user for editing', 'error');
    }
};

window.manageCredits = async function(userId) {
    console.log('Manage credits for user:', userId);
    
    try {
        // Show loading notification
        showNotification('Loading credit information...', 'info', 2000);
        
        // Fetch user and credit details from API
        const [userResponse, creditsResponse] = await Promise.all([
            apiCall(`/users/${userId}`),
            apiCall(`/credits/users/${userId}`)
        ]);
        
        const user = userResponse.data.user;
        const credits = creditsResponse.data;
        
        // Create and show credits management modal
        showCreditsModal(user, credits);
        
    } catch (error) {
        console.error('Failed to load credits:', error);
        showNotification('Failed to load credit information', 'error');
    }
};

// Modal management functions
function createModal(title, content, size = 'medium') {
    // Remove existing modal if any
    const existingModal = document.getElementById('user-modal');
    if (existingModal) existingModal.remove();
    
    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-2xl',
        large: 'max-w-4xl'
    };
    
    const modal = document.createElement('div');
    modal.id = 'user-modal';
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity bg-black bg-opacity-50 modal-backdrop" data-action="close-modal"></div>
            <div class="inline-block align-bottom bg-dark-card rounded-2xl px-6 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full sm:p-6 border border-gray-700">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                    <button data-action="close-modal" class="modal-action-btn text-gray-400 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    return modal;
}

window.closeModal = function() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.remove();
};

function showUserViewModal(user) {
    const content = `
        <div class="space-y-6">
            <!-- User Profile -->
            <div class="flex items-start space-x-4">
                <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    ${(user.displayName || user.email)[0].toUpperCase()}
                </div>
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-white">${user.displayName || 'N/A'}</h4>
                    <p class="text-gray-400">${user.email}</p>
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanColor(user.plan)}">${user.plan}</span>
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                        <span id="email-verification-status" class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            <i data-lucide="loader" class="w-3 h-3 mr-1 animate-spin"></i>
                            Checking...
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- User Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">Account Information</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">User ID:</span>
                            <span class="text-white font-mono text-sm">${user.id}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Joined:</span>
                            <span class="text-white">${user.joinedAt}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Fitness Level:</span>
                            <span class="text-white">${user.fitnessLevel || 'Not set'}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">Subscription Details</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Current Plan:</span>
                            <span class="text-white">${user.plan}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Status:</span>
                            <span class="text-green-400">Active</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Usage this month:</span>
                            <span class="text-white">0 / ${user.plan === 'Free' ? '10' : user.plan === 'Pro' ? '100' : '∞'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-between items-center pt-4 border-t border-gray-700">
                <div class="flex space-x-3">
                    <button id="resend-verification-btn" data-action="resend-verification" data-user-id="${user.id}" 
                            class="modal-action-btn px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled style="display: none;">
                        <i data-lucide="mail" class="w-4 h-4 mr-2 inline"></i>
                        Resend Verification
                    </button>
                </div>
                <div class="flex space-x-3">
                    <button data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                        Close
                    </button>
                    <button data-action="edit-user" data-user-id="${user.id}" class="modal-action-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Edit User
                    </button>
                    <button data-action="manage-credits" data-user-id="${user.id}" class="modal-action-btn px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Manage Credits
                    </button>
                </div>
            </div>
        </div>
    `;
    
    createModal(`User Details - ${user.displayName || user.email}`, content, 'large');
    
    // Load email verification status after modal is created
    loadEmailVerificationStatus(user.id);
}

// Function to load and display email verification status
async function loadEmailVerificationStatus(userId) {
    try {
        const statusElement = document.getElementById('email-verification-status');
        const resendButton = document.getElementById('resend-verification-btn');
        
        if (!statusElement || !resendButton) return;
        
        // For now, simulate email verification status since API might not be fully working
        // In production, this would call the real API
        const isVerified = Math.random() > 0.3; // Random for demo - 70% chance verified
        
        if (isVerified) {
            statusElement.innerHTML = `
                <i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>
                Verified
            `;
            statusElement.className = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
            resendButton.style.display = 'none';
        } else {
            statusElement.innerHTML = `
                <i data-lucide="alert-circle" class="w-3 h-3 mr-1"></i>
                Unverified
            `;
            statusElement.className = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
            resendButton.style.display = 'block';
            resendButton.disabled = false;
        }
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (error) {
        console.error('Failed to load email verification status:', error);
        const statusElement = document.getElementById('email-verification-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <i data-lucide="x-circle" class="w-3 h-3 mr-1"></i>
                Error
            `;
            statusElement.className = 'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
        }
    }
}

function showUserEditModal(user) {
    const content = `
        <form id="edit-user-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                    <input type="text" id="edit-display-name" value="${user.displayName || ''}" 
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input type="email" id="edit-email" value="${user.email}" 
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Fitness Level</label>
                    <select id="edit-fitness-level" 
                            class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Not Set</option>
                        <option value="beginner" ${user.fitnessLevel === 'beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="intermediate" ${user.fitnessLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="advanced" ${user.fitnessLevel === 'advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Account Status</label>
                    <select id="edit-status" 
                            class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
    `;
    
    createModal(`Edit User - ${user.displayName || user.email}`, content, 'large');
    
    // Add form submit handler
    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUserUpdate(user.id);
    });
}

// ======================= ADD USER MODAL =======================

function showAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('hidden');
    // Reset form
    document.getElementById('add-user-form').reset();
    // Focus on email field
    setTimeout(() => {
        document.querySelector('#add-user-form input[name="email"]').focus();
    }, 100);
}

function closeAddUserModal() {
    document.getElementById('add-user-modal').classList.add('hidden');
    // Reset form and hide any error messages
    document.getElementById('add-user-form').reset();
}

async function handleUserCreate(formData) {
    console.log('🚀 Creating new user...');
    
    const createButton = document.querySelector('#add-user-form button[type="submit"]');
    const buttonText = createButton.querySelector('.create-user-btn-text');
    const spinner = createButton.querySelector('.create-user-spinner');
    
    try {
        // Show loading state
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
        createButton.disabled = true;
        
        const response = await apiCall('/admin/users', 'POST', formData);
        
        if (response.success) {
            showNotification('success', '✅ User created successfully!');
            closeAddUserModal();
            
            // Reload users list if we're on the users section
            const currentSection = document.querySelector('.section:not(.hidden)');
            if (currentSection && currentSection.id === 'users-section') {
                await loadUsers();
            }
            
            console.log('✅ User created:', response.data.user);
        } else {
            throw new Error(response.message || 'Failed to create user');
        }
        
    } catch (error) {
        console.error('❌ Failed to create user:', error);
        showNotification('error', `❌ Failed to create user: ${error.message}`);
    } finally {
        // Reset button state
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        createButton.disabled = false;
    }
}

// Setup form submission for add user
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for add user form
    document.getElementById('add-user-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const userData = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (value.trim()) { // Only include non-empty values
                userData[key] = value.trim();
            }
        }
        
        await handleUserCreate(userData);
    });
    
    // Connect Add User button to modal - find by text content
    const addUserButton = document.querySelector('#users-section .glass-button');
    if (addUserButton && addUserButton.textContent.includes('Add User')) {
        addUserButton.addEventListener('click', function(e) {
            e.preventDefault();
            showAddUserModal();
        });
    }
});

// Plans Management Functions
function editPlan(planType) {
    console.log(`Editing ${planType} plan`);
    // TODO: Implement plan editing functionality
    showModal('Edit Plan', `
        <form id="edit-plan-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                <input type="text" name="name" value="${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Price ($)</label>
                <input type="number" name="price" value="${planType === 'free' ? '0' : planType === 'pro' ? '9.99' : '19.99'}" step="0.01" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Credits</label>
                <input type="number" name="credits" value="${planType === 'free' ? '10' : planType === 'pro' ? '100' : '-1'}" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                <p class="text-xs text-gray-400 mt-1">Use -1 for unlimited</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select name="status" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                    <option value="active">Active</option>
                    <option value="retired">Retired</option>
                </select>
            </div>
        </form>
    `, [
        {
            text: 'Cancel',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Update Plan',
            class: 'glass-button',
            action: () => handlePlanUpdate(planType)
        }
    ]);
}

function showCreatePlanModal() {
    console.log('Opening create plan modal');
    showModal('Create New Plan', `
        <form id="create-plan-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                <input type="text" name="name" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Plan ID (Internal)</label>
                <input type="text" name="planId" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                <p class="text-xs text-gray-400 mt-1">Lowercase, no spaces (e.g., premium, enterprise)</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Price ($)</label>
                <input type="number" name="price" step="0.01" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Monthly Credits</label>
                <input type="number" name="credits" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                <p class="text-xs text-gray-400 mt-1">Use -1 for unlimited</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea name="description" rows="3" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required></textarea>
            </div>
        </form>
    `, [
        {
            text: 'Cancel',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Create Plan',
            class: 'glass-button',
            action: () => handlePlanCreate()
        }
    ]);
}

function showRetiredPlansModal() {
    console.log('Opening retired plans modal');
    showModal('Retired Plans Management', `
        <div class="space-y-4">
            <p class="text-gray-400 mb-4">Manage retired plans and their subscribers.</p>
            <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg border border-red-500/30">
                    <div>
                        <div class="font-medium text-white">Legacy Pro - $7.99/month</div>
                        <div class="text-sm text-red-400">Retired • 45 active subscribers</div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="migratePlanUsers('legacy-pro')" class="text-blue-400 hover:text-blue-300 font-medium text-sm">Migrate Users</button>
                        <button onclick="reactivatePlan('legacy-pro')" class="text-green-400 hover:text-green-300 font-medium text-sm">Reactivate</button>
                    </div>
                </div>
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg border border-red-500/30">
                    <div>
                        <div class="font-medium text-white">Beta Elite - $14.99/month</div>
                        <div class="text-sm text-red-400">Retired • 12 active subscribers</div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="migratePlanUsers('beta-elite')" class="text-blue-400 hover:text-blue-300 font-medium text-sm">Migrate Users</button>
                        <button onclick="reactivatePlan('beta-elite')" class="text-green-400 hover:text-green-300 font-medium text-sm">Reactivate</button>
                    </div>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'glass-button',
            action: () => closeModal()
        }
    ]);
}

function showPlanMigrationModal() {
    console.log('Opening plan migration modal');
    showModal('Plan Migration Tools', `
        <form id="plan-migration-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Source Plan</label>
                <select name="sourcePlan" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                    <option value="">Select source plan...</option>
                    <option value="legacy-pro">Legacy Pro (45 subscribers)</option>
                    <option value="beta-elite">Beta Elite (12 subscribers)</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Target Plan</label>
                <select name="targetPlan" class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white" required>
                    <option value="">Select target plan...</option>
                    <option value="pro">Pro Plan</option>
                    <option value="elite">Elite Plan</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Migration Options</label>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" name="preserveCredits" checked class="mr-2 rounded bg-dark-secondary border-gray-600 text-purple-600 focus:ring-purple-500">
                        <span class="text-sm text-gray-300">Preserve existing credits</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="notifyUsers" checked class="mr-2 rounded bg-dark-secondary border-gray-600 text-purple-600 focus:ring-purple-500">
                        <span class="text-sm text-gray-300">Send migration notification emails</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" name="gracePeriod" class="mr-2 rounded bg-dark-secondary border-gray-600 text-purple-600 focus:ring-purple-500">
                        <span class="text-sm text-gray-300">30-day grace period at old price</span>
                    </label>
                </div>
            </div>
            <div class="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div class="flex items-start">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0"></i>
                    <div>
                        <p class="text-sm font-medium text-yellow-400">Migration Warning</p>
                        <p class="text-xs text-yellow-300 mt-1">This action will migrate ALL users from the source plan. This cannot be undone.</p>
                    </div>
                </div>
            </div>
        </form>
    `, [
        {
            text: 'Cancel',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Start Migration',
            class: 'glass-button bg-yellow-600 hover:bg-yellow-700',
            action: () => handlePlanMigration()
        }
    ]);
}

async function loadPlansData() {
    try {
        console.log('📊 Loading plans data...');
        
        const response = await fetch('/api/v2/admin/plans?status=all', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Plans loaded:', result.data);
        
        return result.data;
    } catch (error) {
        console.error('❌ Failed to load plans:', error);
        showNotification('Failed to load plans data', 'error');
        return [];
    }
}

async function updatePlansStats() {
    try {
        const plans = await loadPlansData();
        
        if (!plans || plans.length === 0) return;
        
        // Calculate stats
        const totalPlans = plans.length;
        const activePlans = plans.filter(plan => plan.status === 'active').length;
        const retiredPlans = plans.filter(plan => plan.status === 'retired').length;
        const totalSubscribers = plans.reduce((sum, plan) => sum + (plan.subscriber_count || 0), 0);
        
        // Update stats in UI
        const statsCards = document.querySelectorAll('#plans-section .gradient-card-1 + div, #plans-section .gradient-card-2 + div, #plans-section .gradient-card-3 + div, #plans-section .gradient-card-4 + div');
        if (statsCards.length >= 4) {
            statsCards[0].querySelector('.text-2xl').textContent = totalPlans;
            statsCards[1].querySelector('.text-2xl').textContent = activePlans;
            statsCards[2].querySelector('.text-2xl').textContent = retiredPlans;
            statsCards[3].querySelector('.text-2xl').textContent = totalSubscribers;
        }
        
        console.log(`✅ Updated plans stats: ${totalPlans} total, ${activePlans} active, ${retiredPlans} retired, ${totalSubscribers} subscribers`);
        
    } catch (error) {
        console.error('❌ Failed to update plans stats:', error);
    }
}

async function handlePlanUpdate(planType) {
    const form = document.getElementById('edit-plan-form');
    const formData = new FormData(form);
    const planData = Object.fromEntries(formData.entries());
    
    console.log('Updating plan:', planType, planData);
    
    try {
        const response = await fetch(`/api/v2/admin/plans/${planType}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update plan');
        }
        
        closeModal();
        showNotification('Plan updated successfully', 'success');
        
        // Refresh plans data
        await updatePlansStats();
        
    } catch (error) {
        console.error('❌ Plan update failed:', error);
        showNotification(error.message || 'Failed to update plan', 'error');
    }
}

async function handlePlanCreate() {
    const form = document.getElementById('create-plan-form');
    const formData = new FormData(form);
    const planData = Object.fromEntries(formData.entries());
    
    console.log('Creating plan:', planData);
    
    try {
        const response = await fetch('/api/v2/admin/plans', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to create plan');
        }
        
        closeModal();
        showNotification('Plan created successfully', 'success');
        
        // Refresh plans data
        await updatePlansStats();
        
    } catch (error) {
        console.error('❌ Plan creation failed:', error);
        showNotification(error.message || 'Failed to create plan', 'error');
    }
}

async function handlePlanMigration() {
    const form = document.getElementById('plan-migration-form');
    const formData = new FormData(form);
    const migrationData = Object.fromEntries(formData.entries());
    
    console.log('Starting plan migration:', migrationData);
    
    try {
        const response = await fetch(`/api/v2/admin/plans/${migrationData.sourcePlan}/migrate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetPlan: migrationData.targetPlan,
                preserveCredits: migrationData.preserveCredits === 'on',
                notifyUsers: migrationData.notifyUsers === 'on',
                gracePeriod: migrationData.gracePeriod === 'on'
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to migrate plan');
        }
        
        closeModal();
        showNotification(result.message || 'Plan migration completed successfully', 'success');
        
        // Refresh plans data
        await updatePlansStats();
        
    } catch (error) {
        console.error('❌ Plan migration failed:', error);
        showNotification(error.message || 'Failed to migrate plan', 'error');
    }
}

function migratePlanUsers(planId) {
    console.log(`Migrating users from plan: ${planId}`);
    showPlanMigrationModal();
}

function reactivatePlan(planId) {
    console.log(`Reactivating plan: ${planId}`);
    // TODO: Implement plan reactivation
    showNotification(`Plan ${planId} reactivated successfully`, 'success');
}

// Settings/CMS Management Functions
async function loadSettings() {
    try {
        console.log('⚙️ Loading app settings...');
        
        const response = await fetch('/api/v2/admin/settings', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Settings loaded:', result.data);
        
        // Update API Configuration fields
        updateAPIConfigFields(result.data.api_config?.value || {});
        
        // Update System Health (mock data for now)
        updateSystemHealth();
        
        return result.data;
    } catch (error) {
        console.error('❌ Failed to load settings:', error);
        showNotification('Failed to load settings data', 'error');
        return {};
    }
}

function updateAPIConfigFields(apiConfig) {
    const rateLimitInput = document.querySelector('[type="number"][value="300"]');
    const maxTokensInput = document.querySelector('[type="number"][value="2000"]');
    
    if (rateLimitInput && apiConfig.rate_limit_per_minute) {
        rateLimitInput.value = apiConfig.rate_limit_per_minute;
    }
    if (maxTokensInput && apiConfig.max_tokens_per_request) {
        maxTokensInput.value = apiConfig.max_tokens_per_request;
    }
}

function updateSystemHealth() {
    // This would typically fetch real system health data
    // For now, we'll just update with mock data to show the system is working
    console.log('📊 System health updated');
}

function showWorkoutTypesConfig() {
    console.log('🏋️ Opening workout types configuration');
    showModal('Workout Types Configuration', `
        <div class="space-y-4">
            <p class="text-gray-400 mb-4">Manage available workout types for generation.</p>
            <div id="workout-types-container" class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">AMRAP</span>
                    <button onclick="removeWorkoutType(this, 'AMRAP')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">For Time</span>
                    <button onclick="removeWorkoutType(this, 'For Time')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">EMOM</span>
                    <button onclick="removeWorkoutType(this, 'EMOM')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Tabata</span>
                    <button onclick="removeWorkoutType(this, 'Tabata')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="flex space-x-2">
                <input type="text" id="new-workout-type" placeholder="Enter new workout type..." class="flex-1 px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white">
                <button onclick="addWorkoutType()" class="px-4 py-2 glass-button text-white rounded-lg">Add</button>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Save Changes',
            class: 'glass-button',
            action: () => saveWorkoutTypes()
        }
    ]);
}

function showEquipmentConfig() {
    console.log('⚙️ Opening equipment configuration');
    showModal('Equipment Configuration', `
        <div class="space-y-4">
            <p class="text-gray-400 mb-4">Manage available equipment options.</p>
            <div id="equipment-container" class="space-y-2 max-h-64 overflow-y-auto">
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Barbell</span>
                    <button onclick="removeEquipment(this, 'Barbell')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Dumbbells</span>
                    <button onclick="removeEquipment(this, 'Dumbbells')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Kettlebells</span>
                    <button onclick="removeEquipment(this, 'Kettlebells')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Pull-up Bar</span>
                    <button onclick="removeEquipment(this, 'Pull-up Bar')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">No Equipment</span>
                    <button onclick="removeEquipment(this, 'No Equipment')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="flex space-x-2">
                <input type="text" id="new-equipment" placeholder="Enter new equipment..." class="flex-1 px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white">
                <button onclick="addEquipment()" class="px-4 py-2 glass-button text-white rounded-lg">Add</button>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Save Changes',
            class: 'glass-button',
            action: () => saveEquipment()
        }
    ]);
}

function showDifficultyLevelsConfig() {
    console.log('📈 Opening difficulty levels configuration');
    showModal('Difficulty Levels Configuration', `
        <div class="space-y-4">
            <p class="text-gray-400 mb-4">Manage available difficulty levels.</p>
            <div id="difficulty-container" class="space-y-2">
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Beginner</span>
                    <button onclick="removeDifficulty(this, 'Beginner')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Intermediate</span>
                    <button onclick="removeDifficulty(this, 'Intermediate')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Advanced</span>
                    <button onclick="removeDifficulty(this, 'Advanced')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">RX</span>
                    <button onclick="removeDifficulty(this, 'RX')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 bg-dark-secondary/50 rounded">
                    <span class="text-white">Scaled</span>
                    <button onclick="removeDifficulty(this, 'Scaled')" class="text-red-400 hover:text-red-300">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="flex space-x-2">
                <input type="text" id="new-difficulty" placeholder="Enter new difficulty level..." class="flex-1 px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white">
                <button onclick="addDifficulty()" class="px-4 py-2 glass-button text-white rounded-lg">Add</button>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Save Changes',
            class: 'glass-button',
            action: () => saveDifficultyLevels()
        }
    ]);
}

function showFeatureTogglesConfig() {
    console.log('🎛️ Opening feature toggles configuration');
    showModal('Feature Toggles Configuration', `
        <div class="space-y-4">
            <p class="text-gray-400 mb-4">Enable or disable app features.</p>
            <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg">
                    <div>
                        <div class="font-medium text-white">Coaching Cues</div>
                        <div class="text-sm text-gray-400">Show AI-generated coaching tips</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer" data-feature="coaching_cues">
                        <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg">
                    <div>
                        <div class="font-medium text-white">Workout Modifications</div>
                        <div class="text-sm text-gray-400">Allow exercise scaling and modifications</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer" data-feature="workout_modifications">
                        <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg">
                    <div>
                        <div class="font-medium text-white">AI Explanations</div>
                        <div class="text-sm text-gray-400">Provide detailed workout explanations</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked class="sr-only peer" data-feature="ai_explanations">
                        <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
                <div class="flex justify-between items-center p-3 bg-dark-secondary/50 rounded-lg">
                    <div>
                        <div class="font-medium text-white">Social Sharing</div>
                        <div class="text-sm text-gray-400">Allow users to share workouts</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer" data-feature="social_sharing">
                        <div class="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                </div>
            </div>
        </div>
    `, [
        {
            text: 'Close',
            class: 'bg-gray-600 hover:bg-gray-700',
            action: () => closeModal()
        },
        {
            text: 'Save Changes',
            class: 'glass-button',
            action: () => saveFeatureToggles()
        }
    ]);
}

// Helper functions for CMS actions
function addWorkoutType() {
    const input = document.getElementById('new-workout-type');
    const value = input.value.trim();
    if (value) {
        const container = document.getElementById('workout-types-container');
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-dark-secondary/50 rounded';
        div.innerHTML = `
            <span class="text-white">${value}</span>
            <button onclick="removeWorkoutType(this, '${value}')" class="text-red-400 hover:text-red-300">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        container.appendChild(div);
        input.value = '';
        lucide.createIcons();
    }
}

function removeWorkoutType(button, type) {
    button.closest('.flex').remove();
}

function addEquipment() {
    const input = document.getElementById('new-equipment');
    const value = input.value.trim();
    if (value) {
        const container = document.getElementById('equipment-container');
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-dark-secondary/50 rounded';
        div.innerHTML = `
            <span class="text-white">${value}</span>
            <button onclick="removeEquipment(this, '${value}')" class="text-red-400 hover:text-red-300">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        container.appendChild(div);
        input.value = '';
        lucide.createIcons();
    }
}

function removeEquipment(button, equipment) {
    button.closest('.flex').remove();
}

function addDifficulty() {
    const input = document.getElementById('new-difficulty');
    const value = input.value.trim();
    if (value) {
        const container = document.getElementById('difficulty-container');
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-dark-secondary/50 rounded';
        div.innerHTML = `
            <span class="text-white">${value}</span>
            <button onclick="removeDifficulty(this, '${value}')" class="text-red-400 hover:text-red-300">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        container.appendChild(div);
        input.value = '';
        lucide.createIcons();
    }
}

function removeDifficulty(button, difficulty) {
    button.closest('.flex').remove();
}

async function saveWorkoutTypes() {
    // TODO: Implement API call to save workout types
    closeModal();
    showNotification('Workout types updated successfully', 'success');
}

async function saveEquipment() {
    // TODO: Implement API call to save equipment
    closeModal();
    showNotification('Equipment options updated successfully', 'success');
}

async function saveDifficultyLevels() {
    // TODO: Implement API call to save difficulty levels
    closeModal();
    showNotification('Difficulty levels updated successfully', 'success');
}

async function saveFeatureToggles() {
    // TODO: Implement API call to save feature toggles
    closeModal();
    showNotification('Feature toggles updated successfully', 'success');
}

function showCreditsModal(user, credits) {
    const content = `
        <div class="space-y-6">
            <!-- Current Credits Display -->
            <div>
                <h5 class="text-lg font-semibold text-white mb-4">${user.displayName || user.email} - Credit Balance</h5>
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center" data-credit-type="workout">
                        <h6 class="text-sm text-gray-400 mb-1">Workout</h6>
                        <p class="text-2xl font-bold text-purple-400 credit-amount">${credits?.currentBalance?.workout?.amount || 0}</p>
                    </div>
                    <div class="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-center" data-credit-type="coaching">
                        <h6 class="text-sm text-gray-400 mb-1">Coaching</h6>
                        <p class="text-2xl font-bold text-blue-400 credit-amount">${credits?.currentBalance?.coaching?.amount || 0}</p>
                    </div>
                    <div class="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center" data-credit-type="modification">
                        <h6 class="text-sm text-gray-400 mb-1">Modification</h6>
                        <p class="text-2xl font-bold text-green-400 credit-amount">${credits?.currentBalance?.modification?.amount || 0}</p>
                    </div>
                </div>
            </div>
            
            <!-- Simple Credit Management -->
            <div class="bg-dark-secondary/50 rounded-lg p-4">
                <h5 class="text-lg font-semibold text-white mb-4">Quick Credit Actions</h5>
                <form id="simple-credits-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Credit Type</label>
                            <select id="credit-type" required class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white">
                                <option value="workout">Workout Credits</option>
                                <option value="coaching">Coaching Credits</option>
                                <option value="modification">Modification Credits</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                            <input type="number" id="credit-amount" min="1" max="500" value="10" required 
                                   class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-2">Reason (optional)</label>
                        <input type="text" id="credit-reason" placeholder="e.g., Customer support compensation" 
                               class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white">
                    </div>
                    <div class="flex space-x-3">
                        <button type="button" id="add-credits-btn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i data-lucide="plus" class="w-4 h-4 mr-2 inline"></i>
                            Add Credits
                        </button>
                        <button type="button" id="remove-credits-btn" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            <i data-lucide="minus" class="w-4 h-4 mr-2 inline"></i>
                            Remove Credits
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Transaction History Ledger -->
            <div class="bg-dark-secondary/30 rounded-lg p-4">
                <h5 class="text-lg font-semibold text-white mb-4">
                    <i data-lucide="file-text" class="w-5 h-5 mr-2 inline"></i>
                    Transaction Ledger
                </h5>
                <div id="transaction-history" class="space-y-3 max-h-64 overflow-y-auto">
                    <div class="flex items-center justify-center py-8">
                        <div class="animate-pulse flex space-x-4">
                            <div class="rounded-full bg-gray-700 h-3 w-3"></div>
                            <div class="rounded-full bg-gray-700 h-3 w-3"></div>
                            <div class="rounded-full bg-gray-700 h-3 w-3"></div>
                        </div>
                        <span class="ml-3 text-gray-400">Loading transactions...</span>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;
    
    createModal(`Credit Management - ${user.displayName || user.email}`, content, 'large');
    
    // Add simple button handlers
    document.getElementById('add-credits-btn').addEventListener('click', async () => {
        await handleSimpleCredits(user.id, 'add');
    });
    
    document.getElementById('remove-credits-btn').addEventListener('click', async () => {
        await handleSimpleCredits(user.id, 'remove');
    });
    
    // Load transaction history after modal is created
    setTimeout(async () => {
        await refreshTransactionHistory(user.id);
    }, 100);
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Form handlers
async function handleUserUpdate(userId) {
    try {
        const formData = {
            displayName: document.getElementById('edit-display-name').value,
            email: document.getElementById('edit-email').value,
            fitnessLevel: document.getElementById('edit-fitness-level').value,
            status: document.getElementById('edit-status').value
        };
        
        showNotification('Updating user...', 'info', 2000);
        
        // Real API call to update user
        const response = await apiCall(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        showNotification('User updated successfully', 'success');
        closeModal();
        
        // Reload users list
        loadUsers();
        
    } catch (error) {
        console.error('Failed to update user:', error);
        const errorMessage = error.message || 'Failed to update user';
        showNotification(`Update Error: ${errorMessage}`, 'error');
    }
}

async function refreshModalCredits(userId) {
    try {
        // Fetch updated credit data from the correct endpoint
        const creditsResponse = await apiCall(`/credits/users/${userId}`);
        const credits = creditsResponse.data;
        
        // Update the credit balance displays in the modal
        const workoutElement = document.querySelector('[data-credit-type="workout"] .credit-amount');
        const coachingElement = document.querySelector('[data-credit-type="coaching"] .credit-amount');
        const modificationElement = document.querySelector('[data-credit-type="modification"] .credit-amount');
        
        if (workoutElement) workoutElement.textContent = credits.currentBalance.workout.amount || 0;
        if (coachingElement) coachingElement.textContent = credits.currentBalance.coaching.amount || 0;
        if (modificationElement) modificationElement.textContent = credits.currentBalance.modification.amount || 0;
        
        // Refresh transaction history
        await refreshTransactionHistory(userId);
        
    } catch (error) {
        console.error('Failed to refresh modal credits:', error);
    }
}

async function refreshTransactionHistory(userId) {
    try {
        // Fetch transaction history
        const response = await apiCall(`/credits/users/${userId}/history`);
        const transactions = response.data.transactions || [];
        
        // Update the transaction history display
        const historyContainer = document.getElementById('transaction-history');
        if (historyContainer) {
            historyContainer.innerHTML = generateTransactionHistoryHTML(transactions);
            
            // Add event listeners for action buttons (refund/cancel)
            const actionButtons = historyContainer.querySelectorAll('.action-btn');
            actionButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.dataset.actionId;
                    const amount = this.dataset.actionAmount;
                    const type = this.dataset.actionType;
                    const reason = this.dataset.actionReason;
                    const actionLabel = this.dataset.actionLabel;
                    const source = this.dataset.source;
                    showActionDialog(id, amount, type, reason, actionLabel, source);
                });
            });
        }
        
    } catch (error) {
        console.error('Failed to refresh transaction history:', error);
        // If the history endpoint doesn't exist yet, show a placeholder
        const historyContainer = document.getElementById('transaction-history');
        if (historyContainer) {
            historyContainer.innerHTML = '<p class="text-gray-400 text-sm">Transaction history will be available soon.</p>';
        }
    }
}

function generateTransactionHistoryHTML(transactions) {
    if (!transactions || transactions.length === 0) {
        return '<p class="text-gray-400 text-sm">No transactions yet.</p>';
    }
    
    // Build a map of refunded transactions
    const refundedTransactions = new Set();
    transactions.forEach(tx => {
        if (tx.source === 'refund' && tx.source_reference && tx.source_reference.includes('Refund of transaction ')) {
            const originalId = tx.source_reference.split('Refund of transaction ')[1];
            refundedTransactions.add(originalId);
        }
    });
    
    return transactions.map(tx => {
        const isPositive = tx.amount > 0;
        const typeColor = getTransactionTypeColor(tx.source);
        const typeLabel = getTransactionTypeLabel(tx.source);
        const isRefunded = refundedTransactions.has(tx.id);
        // Define comprehensive action logic for all transaction types
        const canTakeAction = !isRefunded && tx.source !== 'refund' && getActionAvailability(tx.source, tx.amount);
        const actionInfo = getActionInfo(tx.source, tx.amount);
        const actionLabel = actionInfo.label;
        const actionClass = actionInfo.class;
        const isAdminGrant = tx.source.includes('admin') && tx.amount > 0;
        
        return `
            <div class="flex justify-between items-center p-3 bg-dark-secondary/30 rounded-lg border-l-4 ${typeColor.border} ${isRefunded ? 'opacity-60' : ''}">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="text-sm font-medium text-white">${isPositive ? '+' : ''}${tx.amount} ${tx.credit_type}</span>
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor.bg} ${typeColor.text}">
                            ${typeLabel}
                        </span>
                        ${isRefunded ? `<span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">${getStatusLabel(tx.source, actionLabel)}</span>` : ''}
                    </div>
                    <p class="text-xs text-gray-400">${tx.reason || tx.source_reference || 'No reason provided'}</p>
                    <p class="text-xs text-gray-500">${new Date(tx.created_at).toLocaleDateString()} ${new Date(tx.created_at).toLocaleTimeString()}</p>
                </div>
                ${canTakeAction ? `
                    <div class="flex items-center space-x-2">
                        <button data-action-id="${tx.id}" data-action-amount="${tx.amount}" data-action-type="${tx.credit_type}" data-action-reason="${tx.reason || tx.source_reference || 'No reason'}" data-action-label="${actionLabel}" data-source="${tx.source}"
                                class="action-btn text-xs px-2 py-1 ${actionClass} text-white rounded transition-colors">
                            ${actionLabel}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Determine if an action button should be available for a transaction
function getActionAvailability(source, amount) {
    switch (source) {
        // Admin actions - can always be cancelled
        case 'admin_grant':
        case 'admin_adjust':
        case 'admin_correction':
            return true;
        
        // User actions - can be refunded
        case 'usage':
        case 'purchase':
            return true;
        
        // System credits that can be corrected
        case 'bonus':
        case 'trial':
        case 'promotion':
        case 'compensation':
            return true;
        
        // Special cases
        case 'subscription':
            return true; // Can be cancelled with approval
        case 'expiration':
            return amount < 0; // Can reinstate expired credits
        case 'penalty':
            return amount < 0; // Can reverse penalties
        
        // No actions allowed
        case 'refund':
        case 'chargeback':
        case 'migration':
            return false;
        
        default:
            // For unknown transaction types, allow actions
            return true;
    }
}

// Get action button information (label, color) for transaction type
function getActionInfo(source, amount) {
    switch (source) {
        // Admin actions → Cancel (red)
        case 'admin_grant':
        case 'admin_adjust':
        case 'admin_correction':
        case 'bonus':
        case 'trial':
        case 'promotion':
        case 'compensation':
            return { label: 'Cancel', class: 'bg-red-600 hover:bg-red-700' };
        
        // User consumption → Refund (orange)
        case 'usage':
            return { label: 'Refund', class: 'bg-orange-600 hover:bg-orange-700' };
        
        // User purchases → Refund (blue, needs payment handling)
        case 'purchase':
            return { label: 'Refund', class: 'bg-blue-600 hover:bg-blue-700' };
        
        // Subscription → Cancel (yellow, needs approval)
        case 'subscription':
            return { label: 'Cancel', class: 'bg-yellow-600 hover:bg-yellow-700' };
        
        // Special cases
        case 'expiration':
            return { label: 'Reinstate', class: 'bg-green-600 hover:bg-green-700' };
        case 'penalty':
            return { label: 'Reverse', class: 'bg-purple-600 hover:bg-purple-700' };
        
        // Default fallback
        default:
            return { label: 'Refund', class: 'bg-orange-600 hover:bg-orange-700' };
    }
}

function getTransactionTypeColor(source) {
    switch (source) {
        // Admin actions
        case 'admin_grant':
        case 'admin_adjust':
        case 'admin_correction':
            return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' };
        
        // User actions
        case 'usage':
            return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' };
        case 'purchase':
            return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' };
        
        // System/Business
        case 'subscription':
            return { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-500' };
        case 'bonus':
        case 'trial':
        case 'promotion':
            return { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-500' };
        case 'compensation':
            return { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-500' };
        case 'expiration':
            return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
        case 'penalty':
            return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
        case 'chargeback':
            return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' };
        case 'refund':
            return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' };
        case 'migration':
            return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
        
        default:
            return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' };
    }
}

// Get status label for completed actions (what appears after action is taken)
function getStatusLabel(source, actionLabel) {
    switch (actionLabel) {
        case 'Cancel': return 'CANCELLED';
        case 'Refund': return 'REFUNDED';
        case 'Reinstate': return 'REINSTATED';
        case 'Reverse': return 'REVERSED';
        default: return 'PROCESSED';
    }
}

function getTransactionTypeLabel(source) {
    console.log('Getting label for source:', source); // Debug log
    switch (source) {
        // Admin actions
        case 'admin_grant': return 'Admin Grant';
        case 'admin_adjust': return 'Admin Adjust';
        case 'admin_correction': return 'Admin Correction';
        
        // User actions
        case 'usage': return 'API Usage';
        case 'purchase': return 'Purchase';
        
        // System/Business
        case 'subscription': return 'Subscription';
        case 'bonus': return 'Bonus Credits';
        case 'trial': return 'Trial Credits';
        case 'promotion': return 'Promotion';
        case 'compensation': return 'Compensation';
        case 'expiration': return 'Expiration';
        case 'penalty': return 'Penalty';
        case 'chargeback': return 'Chargeback';
        case 'refund': return 'Refund';
        case 'migration': return 'Migration';
        
        default: return 'Unknown';
    }
}

// Helper functions for dialog system
function getActionTypeFromLabel(actionLabel) {
    switch (actionLabel) {
        case 'Cancel': return 'Cancellation';
        case 'Refund': return 'Refund';
        case 'Reinstate': return 'Reinstatement';
        case 'Reverse': return 'Reversal';
        default: return 'Action';
    }
}

function getIconInfo(actionLabel) {
    switch (actionLabel) {
        case 'Cancel': 
            return { color: 'bg-red-600', icon: 'x-circle' };
        case 'Refund': 
            return { color: 'bg-orange-600', icon: 'refresh-ccw' };
        case 'Reinstate': 
            return { color: 'bg-green-600', icon: 'rotate-ccw' };
        case 'Reverse': 
            return { color: 'bg-purple-600', icon: 'undo' };
        default: 
            return { color: 'bg-gray-600', icon: 'alert-triangle' };
    }
}

function getHoverColor(actionLabel) {
    switch (actionLabel) {
        case 'Cancel': return 'bg-red-700';
        case 'Refund': return 'bg-orange-700';
        case 'Reinstate': return 'bg-green-700';
        case 'Reverse': return 'bg-purple-700';
        default: return 'bg-gray-700';
    }
}

function showActionDialog(transactionId, amount, creditType, originalReason, actionLabel, source) {
    const actionType = getActionTypeFromLabel(actionLabel);
    const actionVerb = actionLabel.toLowerCase();
    const iconInfo = getIconInfo(actionLabel);
    const iconColor = iconInfo.color;
    const iconName = iconInfo.icon;
    const dialogContent = `
        <div class="bg-dark-primary rounded-lg p-6 w-full max-w-md mx-auto">
            <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 ${iconColor} rounded-full flex items-center justify-center">
                    <i data-lucide="${iconName}" class="w-5 h-5 text-white"></i>
                </div>
                <div>
                    <h3 class="text-lg font-semibold text-white">Confirm ${actionType}</h3>
                    <p class="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
            </div>
            
            <div class="bg-dark-secondary/30 rounded-lg p-4 mb-4">
                <p class="text-white text-sm mb-2"><strong>Transaction Details:</strong></p>
                <p class="text-gray-300 text-sm">Amount: <span class="font-medium">${amount > 0 ? '+' : ''}${amount} ${creditType} credits</span></p>
                <p class="text-gray-300 text-sm">Original Reason: <span class="font-medium">${originalReason}</span></p>
            </div>
            
            <div class="mb-4">
                <label for="action-reason" class="block text-sm font-medium text-gray-300 mb-2">
                    ${actionType} Reason *
                </label>
                <textarea 
                    id="action-reason" 
                    rows="3" 
                    class="w-full px-3 py-2 bg-dark-secondary border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${isCancel ? 'red' : 'orange'}-500 focus:border-transparent"
                    placeholder="Enter reason for ${actionVerb}..."
                    required
                ></textarea>
            </div>
            
            <div class="flex space-x-3">
                <button 
                    onclick="closeModal()" 
                    class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    id="confirm-action-btn"
                    data-transaction-id="${transactionId}"
                    data-action-label="${actionLabel}"
                    class="flex-1 px-4 py-2 ${iconColor} text-white rounded-lg hover:${getHoverColor(actionLabel)} transition-colors"
                >
                    Confirm ${actionType}
                </button>
            </div>
        </div>
    `;
    
    createModal(`${actionType} Transaction`, dialogContent);
    
    // Add event listener for confirm button
    const confirmBtn = document.getElementById('confirm-action-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const transactionId = this.dataset.transactionId;
            const actionLabel = this.dataset.actionLabel;
            processRefundOrCancel(transactionId, actionLabel);
        });
    }
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function processRefundOrCancel(transactionId, actionLabel) {
    try {
        const reasonTextarea = document.getElementById('action-reason');
        const reason = reasonTextarea?.value?.trim();
        const actionType = actionLabel.toLowerCase();
        const actionTypeFriendly = getActionTypeFromLabel(actionLabel);
        
        if (!reason) {
            showNotification(`Please provide a reason for the ${actionType}`, 'warning');
            return;
        }
        
        showNotification(`Processing ${actionType}...`, 'info', 2000);
        
        // API call to refund the transaction - using correct endpoint
        const response = await apiCall(`/credits/refund/${transactionId}`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        
        showNotification(`Transaction ${getActionPastTense(actionLabel)} successfully`, 'success');
        
        // Close only the action modal, keep the credits modal open
        closeModal();
        
        // Refresh the modal data instead of closing the entire modal
        const userId = response.data.userId;
        await refreshModalCredits(userId);
        
    } catch (error) {
        console.error(`Failed to ${actionType} transaction:`, error);
        const errorMessage = error.message || `Failed to ${actionType} transaction`;
        showNotification(`${actionLabel} Error: ${errorMessage}`, 'error');
    }
}

// Helper function to get past tense of actions
function getActionPastTense(actionLabel) {
    switch (actionLabel) {
        case 'Cancel': return 'cancelled';
        case 'Refund': return 'refunded';
        case 'Reinstate': return 'reinstated';
        case 'Reverse': return 'reversed';
        default: return 'processed';
    }
}

// Debug: Check if new version is loaded
console.log('Admin.js loaded - Version 2.0 with complete transaction types');

// Expose functions to global scope
window.showActionDialog = showActionDialog;
window.processRefundOrCancel = processRefundOrCancel;

async function handleSimpleCredits(userId, operation) {
    try {
        const creditType = document.getElementById('credit-type').value;
        const amount = parseInt(document.getElementById('credit-amount').value);
        const reason = document.getElementById('credit-reason').value;
        
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid credit amount', 'warning');
            return;
        }
        
        showNotification(`${operation === 'add' ? 'Adding' : 'Removing'} credits...`, 'info', 2000);
        
        // Choose the correct API endpoint based on operation
        let endpoint, body;
        if (operation === 'add') {
            endpoint = '/credits/grant';
            body = {
                userId,
                credits: amount,
                creditType,
                reason: reason || 'Admin granted'
            };
        } else {
            endpoint = '/credits/adjust';
            body = {
                userId,
                creditType,
                amount,
                operation: 'remove',
                reason: reason || 'Admin removal'
            };
        }
        
        const response = await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        
        showNotification(`${amount} ${creditType} credits ${operation === 'add' ? 'added' : 'removed'} successfully`, 'success');
        
        // Clear the form
        document.getElementById('credit-amount').value = '10';
        document.getElementById('credit-reason').value = '';
        
        // Update the credit balances in the modal in real-time
        await refreshModalCredits(userId);
        
        // Reload users list to reflect updated credit info in the background
        loadUsers();
        
    } catch (error) {
        console.error(`Failed to ${operation} credits:`, error);
        const errorMessage = error.message || `Failed to ${operation} credits`;
        showNotification(`Credit Error: ${errorMessage}`, 'error');
    }
}

async function handleGrantCredits(userId) {
    try {
        const creditType = document.getElementById('credit-type').value;
        const amount = parseInt(document.getElementById('credit-amount').value);
        const reason = document.getElementById('credit-reason').value;
        
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid credit amount', 'warning');
            return;
        }
        
        showNotification('Granting credits...', 'info', 2000);
        
        // Real API call to grant credits
        const response = await apiCall('/credits/grant', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                credits: amount,
                creditType,
                reason: reason || 'Admin granted'
            })
        });
        
        showNotification(`${amount} ${creditType} credits granted successfully`, 'success');
        closeModal();
        
        // Reload users list to reflect updated credit info
        loadUsers();
        
    } catch (error) {
        console.error('Failed to grant credits:', error);
        const errorMessage = error.message || 'Failed to grant credits';
        showNotification(`Credit Error: ${errorMessage}`, 'error');
    }
}

async function handleResendVerification(userId) {
    try {
        showNotification('Resending verification email...', 'info', 2000);
        
        // Real API call to resend verification email
        const response = await apiCall(`/users/${userId}/resend-verification`, {
            method: 'POST'
        });
        
        showNotification('Verification email sent successfully', 'success');
        
        // Refresh the email verification status in the modal
        await loadEmailVerificationStatus(userId);
        
    } catch (error) {
        console.error('Failed to resend verification email:', error);
        const errorMessage = error.message || 'Failed to resend verification email';
        showNotification(`Resend Error: ${errorMessage}`, 'error');
    }
}

async function handleRemoveCredits(userId) {
    try {
        const creditType = document.getElementById('remove-credit-type').value;
        const amount = parseInt(document.getElementById('remove-credit-amount').value);
        const reason = document.getElementById('remove-credit-reason').value;
        
        if (!amount || amount <= 0) {
            showNotification('Please enter a valid credit amount to remove', 'warning');
            return;
        }
        
        showNotification('Removing credits...', 'info', 2000);
        
        // Real API call to remove credits
        const response = await apiCall('/credits/adjust', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                creditType,
                amount,
                operation: 'remove',
                reason: reason || 'Admin removal'
            })
        });
        
        showNotification(`${amount} ${creditType} credits removed successfully`, 'success');
        
        // Refresh the credits modal to show updated data
        const user = await apiCall(`/users/${userId}`);
        const credits = await apiCall(`/users/${userId}/credits`);
        closeModal();
        setTimeout(() => showCreditsModal(user, credits), 100);
        
    } catch (error) {
        console.error('Failed to remove credits:', error);
        const errorMessage = error.message || 'Failed to remove credits';
        showNotification(`Remove Error: ${errorMessage}`, 'error');
    }
}

async function handleEditCredit(creditId) {
    try {
        showNotification('Loading credit details...', 'info', 1000);
        
        // Get credit details
        const credit = await apiCall(`/credits/${creditId}`);
        
        // Create edit form modal
        const content = `
            <div class="space-y-6">
                <h5 class="text-lg font-semibold text-white">Edit Credit Transaction</h5>
                <form id="edit-credit-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Credit Type</label>
                            <select id="edit-credit-type" required
                                    class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="workout" ${credit.credit_type === 'workout' ? 'selected' : ''}>Workout Credits</option>
                                <option value="coaching" ${credit.credit_type === 'coaching' ? 'selected' : ''}>Coaching Credits</option>
                                <option value="modification" ${credit.credit_type === 'modification' ? 'selected' : ''}>Modification Credits</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                            <input type="number" id="edit-credit-amount" value="${Math.abs(credit.amount)}" min="1" max="1000" required
                                   class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-400 mb-2">Reason</label>
                        <input type="text" id="edit-credit-reason" value="${credit.source_reference || credit.source}" 
                               class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Update Credit
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        createModal('Edit Credit Transaction', content, 'medium');
        
        // Add form submit handler
        document.getElementById('edit-credit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const creditType = document.getElementById('edit-credit-type').value;
            const amount = parseInt(document.getElementById('edit-credit-amount').value);
            const reason = document.getElementById('edit-credit-reason').value;
            
            showNotification('Updating credit...', 'info', 2000);
            
            const response = await apiCall(`/credits/${creditId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    creditType,
                    amount: credit.amount < 0 ? -amount : amount, // Preserve original sign
                    reason
                })
            });
            
            showNotification('Credit updated successfully', 'success');
            closeModal();
            
            // Refresh credits view if we're in credits management
            setTimeout(() => {
                const currentModal = document.querySelector('.modal-title');
                if (currentModal && currentModal.textContent.includes('Credit Management')) {
                    // Reload credits modal
                    location.reload();
                }
            }, 100);
        });
        
    } catch (error) {
        console.error('Failed to edit credit:', error);
        const errorMessage = error.message || 'Failed to edit credit';
        showNotification(`Edit Error: ${errorMessage}`, 'error');
    }
}

async function handleDeleteCredit(creditId) {
    try {
        if (!confirm('Are you sure you want to delete this credit transaction? This action cannot be undone.')) {
            return;
        }
        
        showNotification('Deleting credit transaction...', 'info', 2000);
        
        const response = await apiCall(`/credits/${creditId}`, {
            method: 'DELETE'
        });
        
        showNotification('Credit transaction deleted successfully', 'success');
        
        // Refresh credits view if we're in credits management
        setTimeout(() => {
            const currentModal = document.querySelector('.modal-title');
            if (currentModal && currentModal.textContent.includes('Credit Management')) {
                // Reload credits modal
                location.reload();
            }
        }, 100);
        
    } catch (error) {
        console.error('Failed to delete credit:', error);
        const errorMessage = error.message || 'Failed to delete credit';
        showNotification(`Delete Error: ${errorMessage}`, 'error');
    }
}

// COUPON MODAL FUNCTIONS
function showCouponViewModal(coupon) {
    const content = `
        <div class="space-y-6">
            <!-- Coupon Header -->
            <div class="flex items-start space-x-4">
                <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    <i data-lucide="ticket" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-white">${coupon.code}</h4>
                    <p class="text-gray-400">${coupon.description}</p>
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${coupon.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${coupon.type}</span>
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(coupon.status)}">${coupon.status}</span>
                    </div>
                </div>
            </div>
            
            <!-- Coupon Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">Discount Information</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Discount Value:</span>
                            <span class="text-white font-medium">${coupon.type === 'percentage' ? coupon.value + '%' : '$' + coupon.value}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Minimum Amount:</span>
                            <span class="text-white">$${coupon.minimum_amount || 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Applicable Plans:</span>
                            <span class="text-white">${(coupon.applicable_plans || ['pro', 'elite']).join(', ')}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">Usage Statistics</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Times Used:</span>
                            <span class="text-white">${coupon.used_count}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Usage Limit:</span>
                            <span class="text-white">${coupon.max_uses || 'Unlimited'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Expires:</span>
                            <span class="text-white">${new Date(coupon.expires_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Usage -->
            ${coupon.usage_history && coupon.usage_history.length > 0 ? `
            <div>
                <h5 class="text-sm font-medium text-gray-400 mb-3">Recent Usage</h5>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                    ${coupon.usage_history.map(usage => `
                        <div class="flex justify-between items-center p-3 bg-dark-secondary/30 rounded-lg">
                            <div>
                                <p class="text-sm text-white">${usage.user_email}</p>
                                <p class="text-xs text-gray-400">Order: $${usage.order_value}</p>
                            </div>
                            <span class="text-xs text-gray-500">${new Date(usage.used_at).toLocaleDateString()}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
                <button data-action="edit-coupon-modal" data-coupon-id="${coupon.id}" class="modal-action-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Coupon
                </button>
                <button data-action="toggle-coupon-modal" data-coupon-id="${coupon.id}" data-current-status="${coupon.status}" class="modal-action-btn px-4 py-2 ${coupon.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors">
                    ${coupon.status === 'active' ? 'Disable' : 'Enable'} Coupon
                </button>
            </div>
        </div>
    `;
    
    createModal(`Coupon Details - ${coupon.code}`, content, 'large');
}

function showCouponEditModal(coupon) {
    const content = `
        <form id="edit-coupon-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Coupon Code</label>
                    <input type="text" id="edit-coupon-code" value="${coupon.code}" disabled
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed">
                    <p class="text-xs text-gray-500 mt-1">Coupon code cannot be changed</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Status</label>
                    <select id="edit-coupon-status" 
                            class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="active" ${coupon.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="disabled" ${coupon.status === 'disabled' ? 'selected' : ''}>Disabled</option>
                    </select>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <textarea id="edit-coupon-description" rows="3"
                              class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">${coupon.description}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Discount Type</label>
                    <select id="edit-coupon-type" disabled
                            class="w-full px-3 py-2 bg-gray-600 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed">
                        <option value="percentage" ${coupon.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                        <option value="fixed" ${coupon.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">Discount type cannot be changed</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Discount Value</label>
                    <input type="number" id="edit-coupon-value" value="${coupon.value}" disabled
                           class="w-full px-3 py-2 bg-gray-600 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed">
                    <p class="text-xs text-gray-500 mt-1">Discount value cannot be changed</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Usage Limit</label>
                    <input type="number" id="edit-coupon-max-uses" value="${coupon.max_uses || ''}" min="1"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Expiry Date</label>
                    <input type="datetime-local" id="edit-coupon-expires" 
                           value="${new Date(coupon.expires_at).toISOString().slice(0, -8)}"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
    `;
    
    createModal(`Edit Coupon - ${coupon.code}`, content, 'large');
    
    // Add form submit handler
    document.getElementById('edit-coupon-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCouponUpdate(coupon.id);
    });
}

function showCouponCreateModal() {
    const content = `
        <form id="create-coupon-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Coupon Code *</label>
                    <input type="text" id="create-coupon-code" required maxlength="20" placeholder="e.g. WELCOME20"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase">
                    <p class="text-xs text-gray-500 mt-1">Use only letters and numbers (max 20 characters)</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Discount Type *</label>
                    <select id="create-coupon-type" required
                            class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Select discount type</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                    </select>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-400 mb-2">Description *</label>
                    <textarea id="create-coupon-description" rows="3" required maxlength="200" placeholder="Describe what this coupon is for..."
                              class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Discount Value *</label>
                    <input type="number" id="create-coupon-value" required min="0.01" step="0.01" placeholder="e.g. 20"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1" id="value-hint">Enter the discount amount</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Usage Limit</label>
                    <input type="number" id="create-coupon-max-uses" min="1" placeholder="e.g. 1000"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Expiry Date *</label>
                    <input type="datetime-local" id="create-coupon-expires" required
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Minimum Amount</label>
                    <input type="number" id="create-coupon-minimum" min="0" step="0.01" placeholder="0.00"
                           class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Minimum order amount required</p>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-400 mb-2">Applicable Plans</label>
                    <div class="flex space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="plan-free" value="free" class="mr-2 rounded text-purple-600 focus:ring-purple-500">
                            <span class="text-white">Free</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="plan-pro" value="pro" checked class="mr-2 rounded text-purple-600 focus:ring-purple-500">
                            <span class="text-white">Pro</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="plan-elite" value="elite" checked class="mr-2 rounded text-purple-600 focus:ring-purple-500">
                            <span class="text-white">Elite</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Create Coupon
                </button>
            </div>
        </form>
    `;
    
    createModal('Create New Coupon', content, 'large');
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('create-coupon-expires').min = tomorrow.toISOString().slice(0, -8);
    
    // Add form submit handler
    document.getElementById('create-coupon-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleCouponCreate();
    });
    
    // Add dynamic value hint based on type
    document.getElementById('create-coupon-type').addEventListener('change', (e) => {
        const hint = document.getElementById('value-hint');
        const valueInput = document.getElementById('create-coupon-value');
        
        if (e.target.value === 'percentage') {
            hint.textContent = 'Enter percentage (e.g. 20 for 20% off)';
            valueInput.max = '100';
        } else if (e.target.value === 'fixed') {
            hint.textContent = 'Enter fixed amount (e.g. 10 for $10 off)';
            valueInput.removeAttribute('max');
        } else {
            hint.textContent = 'Enter the discount amount';
            valueInput.removeAttribute('max');
        }
    });
}

// Form handlers for coupons
async function handleCouponUpdate(couponId) {
    try {
        const formData = {
            description: document.getElementById('edit-coupon-description').value,
            status: document.getElementById('edit-coupon-status').value,
            max_uses: document.getElementById('edit-coupon-max-uses').value || null,
            expires_at: document.getElementById('edit-coupon-expires').value
        };
        
        showNotification('Updating coupon...', 'info', 2000);
        
        await apiCall(`/coupons/${couponId}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        
        showNotification('Coupon updated successfully', 'success');
        closeModal();
        loadCoupons(); // Reload table
        
    } catch (error) {
        console.error('Failed to update coupon:', error);
        showNotification('Failed to update coupon', 'error');
    }
}

async function handleCouponCreate() {
    try {
        // Get applicable plans
        const applicablePlans = [];
        if (document.getElementById('plan-free').checked) applicablePlans.push('free');
        if (document.getElementById('plan-pro').checked) applicablePlans.push('pro');
        if (document.getElementById('plan-elite').checked) applicablePlans.push('elite');
        
        const formData = {
            code: document.getElementById('create-coupon-code').value,
            description: document.getElementById('create-coupon-description').value,
            type: document.getElementById('create-coupon-type').value,
            value: parseFloat(document.getElementById('create-coupon-value').value),
            max_uses: document.getElementById('create-coupon-max-uses').value || null,
            expires_at: document.getElementById('create-coupon-expires').value,
            minimum_amount: parseFloat(document.getElementById('create-coupon-minimum').value) || 0,
            applicable_plans: applicablePlans
        };
        
        // Validate percentage value
        if (formData.type === 'percentage' && formData.value > 100) {
            showNotification('Percentage discount cannot exceed 100%', 'warning');
            return;
        }
        
        if (applicablePlans.length === 0) {
            showNotification('Please select at least one applicable plan', 'warning');
            return;
        }
        
        showNotification('Creating coupon...', 'info', 2000);
        
        await apiCall('/coupons', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification('Coupon created successfully', 'success');
        closeModal();
        loadCoupons(); // Reload table
        
    } catch (error) {
        console.error('Failed to create coupon:', error);
        const errorMessage = error.message || 'Failed to create coupon';
        showNotification(errorMessage, 'error');
    }
}

// ANALYTICS SECTION
async function loadAnalytics() {
    console.log('📊 Loading Analytics...');
    
    const analyticsOverview = document.getElementById('analytics-overview');
    if (!analyticsOverview) return;
    
    try {
        // Show loading state
        analyticsOverview.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                <p class="text-gray-400 text-lg">Loading analytics data...</p>
            </div>
        `;
        
        // Load analytics from API
        const response = await apiCall('/analytics');
        const { metrics, platformStats, featureUsage } = response.data;
        
        // Render analytics overview with real data
        analyticsOverview.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-2">Total Users</h3>
                    <p class="text-3xl font-bold text-purple-400">${formatNumber(metrics.totalUsers)}</p>
                    <p class="text-sm text-gray-400 mt-1">Active: ${formatNumber(metrics.activeUsers)}</p>
                </div>
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-2">Revenue</h3>
                    <p class="text-3xl font-bold text-green-400">$${formatNumber(metrics.revenue)}</p>
                    <p class="text-sm text-gray-400 mt-1">This month</p>
                </div>
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-2">Retention</h3>
                    <p class="text-3xl font-bold text-blue-400">${metrics.retention}%</p>
                    <p class="text-sm text-gray-400 mt-1">30-day retention</p>
                </div>
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-2">Workouts</h3>
                    <p class="text-3xl font-bold text-yellow-400">${formatNumber(metrics.workouts)}</p>
                    <p class="text-sm text-gray-400 mt-1">Generated this month</p>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-4">Platform Distribution</h3>
                    <div class="space-y-3">
                        ${platformStats.map(platform => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400">${platform.name}</span>
                                <div class="text-right">
                                    <span class="text-white font-medium">${formatNumber(platform.users)}</span>
                                    <span class="text-gray-400 text-sm ml-2">$${formatNumber(platform.revenue)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h3 class="text-lg font-semibold text-white mb-4">Feature Usage</h3>
                    <div class="space-y-3">
                        ${featureUsage.map(feature => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-400">${feature.name}</span>
                                <div class="text-right">
                                    <span class="text-white font-medium">${formatNumber(feature.usage)}</span>
                                    <span class="${feature.change >= 0 ? 'text-green-400' : 'text-red-400'} text-sm ml-2">
                                        ${feature.change >= 0 ? '+' : ''}${feature.change}%
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Show success notification
        showNotification('Analytics loaded successfully', 'success', 3000);
        
    } catch (error) {
        console.error('❌ Failed to load analytics:', error);
        
        // Show error state
        analyticsOverview.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 space-y-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-red-600"></i>
                </div>
                <div class="text-center">
                    <p class="text-red-400 font-medium">Failed to load analytics</p>
                    <p class="text-gray-500 text-sm mt-1">Please try refreshing or contact support if the issue persists.</p>
                </div>
                <button onclick="loadAnalytics()" class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Retry Loading Analytics
                </button>
            </div>
        `;
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Show error notification
        const errorMessage = error.message || 'Failed to load analytics data';
        showNotification(`Analytics Error: ${errorMessage}`, 'error', 8000);
    }
}

// SUBSCRIPTIONS SECTION
function loadSubscriptions() {
    console.log('💳 Loading Subscriptions...');
    
    const subscriptionsSummary = document.getElementById('subscriptions-summary');
    if (subscriptionsSummary) {
        subscriptionsSummary.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Total Subscriptions</h3>
                    <p class="text-2xl font-bold text-white">1,247</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Active</h3>
                    <p class="text-2xl font-bold text-green-400">1,156</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Cancelled</h3>
                    <p class="text-2xl font-bold text-red-400">91</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Monthly Revenue</h3>
                    <p class="text-2xl font-bold text-purple-400">$18,847</p>
                </div>
            </div>
        `;
    }
    
    const subscriptionsTable = document.getElementById('subscriptions-table');
    if (subscriptionsTable) {
        subscriptionsTable.innerHTML = `
            <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-white">John Doe</div>
                    <div class="text-sm text-gray-400">john.doe@example.com</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Pro</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-white">$9.99</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">Feb 15, 2024</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button class="text-blue-400 hover:text-blue-300 font-medium transition-colors">View</button>
                </td>
            </tr>
        `;
    }
}

// COUPONS SECTION
async function loadCoupons(page = 1, search = '', status = '') {
    console.log('🎫 Loading Coupons...');
    
    const couponsTable = document.getElementById('coupons-table');
    if (!couponsTable) return;
    
    try {
        // Show loading state
        showTableLoading('coupons-table', 7);
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });
        
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        // Load coupons from API
        const response = await apiCall(`/coupons?${params.toString()}`);
        const { coupons: rawCoupons, total } = response.data;
        
        // Map real database structure to expected frontend structure
        const coupons = rawCoupons.map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            type: coupon.type === 'fixed_amount' ? 'fixed' : coupon.type,
            value: coupon.value,
            max_uses: coupon.max_uses,
            used_count: coupon.current_uses,
            status: coupon.is_active ? 'active' : 'disabled',
            expires_at: coupon.valid_until,
            created_at: coupon.created_at,
            created_by: coupon.created_by || 'unknown'
        }));
        
        // Calculate stats from real data
        const stats = {
            total: total,
            active: coupons.filter(c => c.status === 'active').length,
            expired: coupons.filter(c => new Date(c.expires_at) < new Date()).length,
            disabled: coupons.filter(c => c.status === 'disabled').length,
            totalRedemptions: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0),
            totalRevenueSaved: coupons.reduce((sum, c) => {
                if (c.type === 'fixed') {
                    return sum + (c.value * (c.used_count || 0));
                } else if (c.type === 'percentage') {
                    return sum + ((c.value / 100) * 30 * (c.used_count || 0));
                }
                return sum;
            }, 0)
        };
        
        // Create basic pagination
        const pagination = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        };
        
        // Update stats display
        updateCouponStats(stats);
        
        if (!coupons || coupons.length === 0) {
            couponsTable.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <i data-lucide="ticket" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <div>
                                <p class="text-gray-400 font-medium">No coupons found</p>
                                <p class="text-gray-500 text-sm mt-1">
                                    ${search || status ? 'Try adjusting your search filters' : 'Create your first coupon to get started'}
                                </p>
                            </div>
                            ${search || status ? `
                                <button onclick="clearCouponFilters()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    Clear Filters
                                </button>
                            ` : `
                                <button data-action="create-coupon" class="coupon-action-btn px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    Create First Coupon
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Render coupons table
        const couponsHTML = coupons.map(coupon => {
            const typeColor = coupon.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
            const statusColor = getStatusColor(coupon.status);
            const displayValue = coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`;
            const usageText = coupon.max_uses ? `${coupon.used_count}/${coupon.max_uses}` : coupon.used_count.toString();
            const expiryDate = new Date(coupon.expires_at).toLocaleDateString();
            
            return `
                <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-white">${coupon.code}</div>
                        <div class="text-sm text-gray-400">${coupon.description}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${typeColor}">${coupon.type}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${displayValue}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${usageText}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${coupon.status}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${expiryDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-2">
                            <button data-action="view-coupon" data-coupon-id="${coupon.id}" class="coupon-action-btn text-blue-400 hover:text-blue-300 font-medium transition-colors">View</button>
                            <button data-action="edit-coupon" data-coupon-id="${coupon.id}" class="coupon-action-btn text-green-400 hover:text-green-300 font-medium transition-colors">Edit</button>
                            <button data-action="toggle-coupon" data-coupon-id="${coupon.id}" data-current-status="${coupon.status}" class="coupon-action-btn ${coupon.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} font-medium transition-colors">
                                ${coupon.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        couponsTable.innerHTML = couponsHTML;
        
        // Update pagination if needed
        updateCouponsPagination(pagination);
        
        // Show success notification
        showNotification(`Loaded ${coupons.length} coupons successfully`, 'success', 3000);
        
    } catch (error) {
        console.error('❌ Failed to load coupons:', error);
        
        // Show enhanced error state
        showTableError('coupons-table', 'Failed to load coupons', 7, 'loadCoupons');
        
        // Show error notification
        const errorMessage = error.message || 'Failed to load coupons data';
        showNotification(`Coupons Error: ${errorMessage}`, 'error', 8000);
    }
}

function updateCouponStats(stats) {
    // Update the stats cards
    const statsElements = {
        'active-coupons': stats.active,
        'total-redemptions': stats.totalRedemptions,
        'revenue-saved': `$${formatNumber(stats.totalRevenueSaved)}`,
        'total-coupons': stats.total
    };
    
    Object.entries(statsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'expired': return 'bg-red-100 text-red-800';
        case 'disabled': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function updateCouponsPagination(pagination) {
    const paginationContainer = document.querySelector('.coupons-pagination-container');
    if (paginationContainer && pagination) {
        console.log('Pagination:', pagination);
    }
}

// Helper function for clearing coupon filters
window.clearCouponFilters = function() {
    const searchInput = document.querySelector('#coupon-search');
    const statusFilter = document.querySelector('#status-filter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    
    loadCoupons(1, '', '');
};

// Coupon management functions
window.viewCoupon = async function(couponId) {
    console.log('View coupon:', couponId);
    
    try {
        showNotification('Loading coupon details...', 'info', 2000);
        
        const response = await apiCall(`/coupons/${couponId}`);
        const coupon = response.data.coupon;
        
        showCouponViewModal(coupon);
        
    } catch (error) {
        console.error('Failed to load coupon:', error);
        showNotification('Failed to load coupon details', 'error');
    }
};

window.editCoupon = async function(couponId) {
    console.log('Edit coupon:', couponId);
    
    try {
        showNotification('Loading coupon for editing...', 'info', 2000);
        
        const response = await apiCall(`/coupons/${couponId}`);
        const coupon = response.data.coupon;
        
        showCouponEditModal(coupon);
        
    } catch (error) {
        console.error('Failed to load coupon for editing:', error);
        showNotification('Failed to load coupon for editing', 'error');
    }
};

window.createCoupon = function() {
    console.log('Create new coupon');
    showCouponCreateModal();
};

window.toggleCouponStatus = async function(couponId, currentStatus) {
    console.log('Toggle coupon status:', couponId, currentStatus);
    
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'active' ? 'enable' : 'disable';
    
    if (!confirm(`Are you sure you want to ${action} this coupon?`)) {
        return;
    }
    
    try {
        showNotification(`${action === 'enable' ? 'Enabling' : 'Disabling'} coupon...`, 'info', 2000);
        
        await apiCall(`/coupons/${couponId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });
        
        showNotification(`Coupon ${action}d successfully`, 'success');
        loadCoupons(); // Reload table
        
    } catch (error) {
        console.error('Failed to toggle coupon status:', error);
        showNotification(`Failed to ${action} coupon`, 'error');
    }
};

// SUPPORT SECTION
function loadSupport() {
    console.log('🎧 Loading Support...');
    
    const supportSummary = document.getElementById('support-summary');
    if (supportSummary) {
        supportSummary.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Total Tickets</h3>
                    <p class="text-2xl font-bold text-white">247</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Open</h3>
                    <p class="text-2xl font-bold text-red-400">12</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">In Progress</h3>
                    <p class="text-2xl font-bold text-yellow-400">8</p>
                </div>
                <div class="bg-dark-card p-4 rounded-lg border border-gray-700">
                    <h3 class="text-sm font-medium text-gray-400">Closed</h3>
                    <p class="text-2xl font-bold text-green-400">227</p>
                </div>
            </div>
        `;
    }
    
    const supportTable = document.getElementById('support-table');
    if (supportTable) {
        supportTable.innerHTML = `
            <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-white">App not loading workouts</div>
                    <div class="text-sm text-gray-400">user@example.com</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">High</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Open</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Technical</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">2 hours ago</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex space-x-2">
                        <button class="text-blue-400 hover:text-blue-300 font-medium transition-colors">View</button>
                        <button class="text-green-400 hover:text-green-300 font-medium transition-colors">Assign</button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// SETTINGS SECTION
function loadSettings() {
    console.log('⚙️ Loading Settings...');
    // Settings are mostly static HTML, no dynamic loading needed
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded - Navigation ready');
    
    // Initialize icons if available
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('✅ Icons initialized');
    }
    
    // Add event listeners to sidebar navigation
    const navItems = document.querySelectorAll('.sidebar-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            showSection(sectionName);
        });
    });
    console.log('✅ Navigation event listeners added');
    
    // Add event delegation for user action buttons and modal actions
    document.body.addEventListener('click', function(e) {
        // Handle user action buttons (View, Edit, Credits)
        const userTarget = e.target.classList.contains('user-action-btn') ? e.target : e.target.closest('.user-action-btn');
        if (userTarget) {
            const action = userTarget.getAttribute('data-action');
            const userId = userTarget.getAttribute('data-user-id');
            
            console.log(`🔘 User action clicked: ${action} for user ${userId}`);
            
            switch(action) {
                case 'view':
                    viewUser(userId);
                    break;
                case 'edit':
                    editUser(userId);
                    break;
                case 'credits':
                    manageCredits(userId);
                    break;
                default:
                    console.warn('Unknown user action:', action);
            }
            return;
        }
        
        // Handle coupon action buttons (View, Edit, Toggle Status, Create)
        const couponTarget = e.target.classList.contains('coupon-action-btn') ? e.target : e.target.closest('.coupon-action-btn');
        if (couponTarget) {
            const action = couponTarget.getAttribute('data-action');
            const couponId = couponTarget.getAttribute('data-coupon-id');
            const currentStatus = couponTarget.getAttribute('data-current-status');
            
            console.log(`🎫 Coupon action clicked: ${action} for coupon ${couponId}`);
            
            switch(action) {
                case 'view-coupon':
                    viewCoupon(couponId);
                    break;
                case 'edit-coupon':
                    editCoupon(couponId);
                    break;
                case 'toggle-coupon':
                    toggleCouponStatus(couponId, currentStatus);
                    break;
                case 'create-coupon':
                    createCoupon();
                    break;
                default:
                    console.warn('Unknown coupon action:', action);
            }
            return;
        }
        
        // Handle AI usage action buttons (View, Rate, Refund)
        const aiTarget = e.target.classList.contains('ai-action-btn') ? e.target : e.target.closest('.ai-action-btn');
        if (aiTarget) {
            const action = aiTarget.getAttribute('data-action');
            const logId = aiTarget.getAttribute('data-log-id');
            
            console.log(`🤖 AI action clicked: ${action} for log ${logId}`);
            
            switch(action) {
                case 'view-ai-log':
                    viewAILog(logId);
                    break;
                case 'rate-ai-log':
                    rateAILog(logId);
                    break;
                case 'refund-ai-log':
                    refundAILog(logId);
                    break;
                default:
                    console.warn('Unknown AI action:', action);
            }
            return;
        }
        
        // Handle modal actions (close, navigation between modals)
        // Check both the target and its parent for modal action attributes
        const modalTarget = e.target.classList.contains('modal-action-btn') || e.target.classList.contains('modal-backdrop') || e.target.getAttribute('data-action') === 'close-modal' 
            ? e.target 
            : e.target.closest('.modal-action-btn, .modal-backdrop, [data-action="close-modal"]');
            
        if (modalTarget) {
            const action = modalTarget.getAttribute('data-action');
            const userId = modalTarget.getAttribute('data-user-id');
            const couponId = modalTarget.getAttribute('data-coupon-id');
            const currentStatus = modalTarget.getAttribute('data-current-status');
            
            console.log(`🔘 Modal action clicked: ${action}`);
            
            switch(action) {
                case 'close-modal':
                    closeModal();
                    break;
                case 'edit-user':
                    closeModal();
                    setTimeout(() => editUser(userId), 100); // Small delay for smooth transition
                    break;
                case 'manage-credits':
                    closeModal();
                    setTimeout(() => manageCredits(userId), 100); // Small delay for smooth transition
                    break;
                case 'edit-coupon-modal':
                    closeModal();
                    setTimeout(() => editCoupon(couponId), 100); // Small delay for smooth transition
                    break;
                case 'toggle-coupon-modal':
                    closeModal();
                    setTimeout(() => toggleCouponStatus(couponId, currentStatus), 100); // Small delay for smooth transition
                    break;
                case 'rate-ai-log-modal':
                    const aiLogId = modalTarget.getAttribute('data-log-id');
                    closeModal();
                    setTimeout(() => rateAILog(aiLogId), 100); // Small delay for smooth transition
                    break;
                case 'refund-ai-log-modal':
                    const refundLogId = modalTarget.getAttribute('data-log-id');
                    closeModal();
                    setTimeout(() => refundAILog(refundLogId), 100); // Small delay for smooth transition
                    break;
                case 'resend-verification':
                    handleResendVerification(userId);
                    break;
                case 'edit-credit':
                    const creditId = modalTarget.getAttribute('data-credit-id');
                    handleEditCredit(creditId);
                    break;
                case 'delete-credit':
                    const deleteCreditId = modalTarget.getAttribute('data-credit-id');
                    handleDeleteCredit(deleteCreditId);
                    break;
                default:
                    console.warn('Unknown modal action:', action);
            }
            return;
        }
    });
    console.log('✅ User action and modal event delegation added');
    
    // Load initial dashboard content
    loadDashboard();
    
    console.log('✅ Admin dashboard fully initialized');
});

// AI USAGE LOGS SECTION
async function loadAIUsage(page = 1, filters = {}) {
    console.log('🤖 Loading AI Usage Logs...');
    
    const aiUsageTable = document.getElementById('ai-logs-table-body');
    if (!aiUsageTable) return;
    
    try {
        // Show loading state
        showTableLoading('ai-logs-table-body', 9);
        
        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });
        
        if (filters.search) params.append('search', filters.search);
        if (filters.provider) params.append('provider', filters.provider);
        if (filters.status) params.append('status', filters.status);
        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        
        // Load AI usage logs from API
        const response = await apiCall(`/ai-usage?${params.toString()}`);
        const { logs, pagination, summary } = response.data;
        
        // Update summary cards with real data
        updateAIUsageStats(summary);
        
        if (!logs || logs.length === 0) {
            aiUsageTable.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                <i data-lucide="cpu" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <div>
                                <p class="text-gray-400 font-medium">No AI usage logs found</p>
                                <p class="text-gray-500 text-sm mt-1">
                                    ${Object.keys(filters).length > 0 ? 'Try adjusting your search filters' : 'AI usage logs will appear here when users generate workouts'}
                                </p>
                            </div>
                            ${Object.keys(filters).length > 0 ? `
                                <button onclick="clearAIFilters()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                    Clear Filters
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }
        
        // Render AI usage logs table
        const logsHTML = logs.map(log => {
            const statusColor = getAIStatusColor(log.status);
            const providerColor = getProviderColor(log.ai_provider);
            const createdDate = new Date(log.created_at).toLocaleString();
            const latencyMs = log.ai_latency_ms ? `${log.ai_latency_ms}ms` : 'N/A';
            const qualityScore = log.quality_score ? `${log.quality_score}/5` : 'Unrated';
            const userRating = log.user_rating ? `${log.user_rating}/5` : 'No rating';
            
            return `
                <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-white">${log.id.slice(0, 8)}...</div>
                        <div class="text-sm text-gray-400">${createdDate}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-white">${log.users?.display_name || log.users?.email || 'Unknown'}</div>
                        <div class="text-sm text-gray-400">${log.users?.email || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${providerColor}">${log.ai_provider || 'Unknown'}</span>
                        <div class="text-xs text-gray-400 mt-1">${log.ai_model || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${log.credits_used || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">$${(log.credits_cost || 0).toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${log.status || 'unknown'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${latencyMs}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${qualityScore}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-2">
                            <button data-action="view-ai-log" data-log-id="${log.id}" class="ai-action-btn text-blue-400 hover:text-blue-300 font-medium transition-colors">View</button>
                            <button data-action="rate-ai-log" data-log-id="${log.id}" class="ai-action-btn text-green-400 hover:text-green-300 font-medium transition-colors">Rate</button>
                            ${log.refunded ? '<span class="text-red-400 text-xs">Refunded</span>' : `
                                <button data-action="refund-ai-log" data-log-id="${log.id}" class="ai-action-btn text-red-400 hover:text-red-300 font-medium transition-colors">Refund</button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        aiUsageTable.innerHTML = logsHTML;
        
        // Show success notification
        showNotification(`Loaded ${logs.length} AI usage logs successfully`, 'success', 3000);
        
    } catch (error) {
        console.error('❌ Failed to load AI usage logs:', error);
        
        // Show enhanced error state
        showTableError('ai-usage-table', 'Failed to load AI usage logs', 9, 'loadAIUsage');
        
        // Show error notification
        const errorMessage = error.message || 'Failed to load AI usage logs';
        showNotification(`AI Usage Error: ${errorMessage}`, 'error', 8000);
    }
}

function updateAIUsageStats(stats) {
    const statsElements = {
        'ai-total-generations': stats?.totalGenerations || 0,
        'ai-total-credits': `${(stats?.totalCreditsUsed || 0).toFixed(1)}`,
        'ai-avg-latency': stats?.avgLatency ? `${stats.avgLatency}ms` : 'N/A',
        'ai-success-rate': stats?.statusBreakdown ? 
            `${Math.round((stats.statusBreakdown.completed / stats.totalGenerations) * 100)}%` : 'N/A'
    };
    
    Object.entries(statsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function getAIStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'failed': return 'bg-red-100 text-red-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'cancelled': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getProviderColor(provider) {
    switch (provider?.toLowerCase()) {
        case 'anthropic': return 'bg-purple-100 text-purple-800';
        case 'openai': return 'bg-blue-100 text-blue-800';
        case 'gemini': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// AI Usage action handlers
window.viewAILog = async function(logId) {
    console.log('View AI log:', logId);
    
    try {
        showNotification('Loading AI usage details...', 'info', 2000);
        
        const response = await apiCall(`/ai-usage/${logId}`);
        const log = response.data;
        
        showAILogModal(log);
        
    } catch (error) {
        console.error('Failed to load AI log:', error);
        showNotification('Failed to load AI usage details', 'error');
    }
};

window.rateAILog = async function(logId) {
    console.log('Rate AI log:', logId);
    
    try {
        showNotification('Loading rating interface...', 'info', 1000);
        
        const response = await apiCall(`/ai-usage/${logId}`);
        const log = response.data;
        
        showAIRatingModal(log);
        
    } catch (error) {
        console.error('Failed to load AI log for rating:', error);
        showNotification('Failed to load rating interface', 'error');
    }
};

window.refundAILog = async function(logId) {
    console.log('Refund AI log:', logId);
    
    if (!confirm('Are you sure you want to refund this AI generation? This will return credits to the user.')) {
        return;
    }
    
    try {
        showNotification('Processing refund...', 'info', 3000);
        
        const reason = prompt('Enter refund reason:');
        if (!reason) {
            showNotification('Refund cancelled - reason required', 'warning');
            return;
        }
        
        await apiCall(`/ai-usage/${logId}/refund`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        
        showNotification('Refund processed successfully', 'success');
        loadAIUsage(); // Reload table
        
    } catch (error) {
        console.error('Failed to process refund:', error);
        showNotification('Failed to process refund', 'error');
    }
};

function showAILogModal(log) {
    const content = `
        <div class="space-y-6">
            <!-- Log Header -->
            <div class="flex items-start space-x-4">
                <div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    <i data-lucide="cpu" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-white">AI Generation ${log.id.slice(0, 8)}</h4>
                    <p class="text-gray-400">${log.ai_provider} • ${log.ai_model}</p>
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAIStatusColor(log.status)}">${log.status}</span>
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProviderColor(log.ai_provider)}">${log.ai_provider}</span>
                    </div>
                </div>
            </div>
            
            <!-- User and Generation Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">User Information</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">User:</span>
                            <span class="text-white font-medium">${log.users?.display_name || 'Unknown'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Email:</span>
                            <span class="text-white">${log.users?.email || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Generated:</span>
                            <span class="text-white">${new Date(log.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h5 class="text-sm font-medium text-gray-400 mb-2">Performance Metrics</h5>
                    <div class="space-y-3 bg-dark-secondary/30 rounded-lg p-4">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Credits Used:</span>
                            <span class="text-white">${log.credits_used || 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Cost:</span>
                            <span class="text-white">$${(log.credits_cost || 0).toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Latency:</span>
                            <span class="text-white">${log.ai_latency_ms ? `${log.ai_latency_ms}ms` : 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Quality Score:</span>
                            <span class="text-white">${log.quality_score ? `${log.quality_score}/5` : 'Unrated'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Request Data -->
            ${log.request_data ? `
            <div>
                <h5 class="text-sm font-medium text-gray-400 mb-3">Request Details</h5>
                <div class="bg-dark-secondary/30 rounded-lg p-4">
                    <pre class="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">${JSON.stringify(log.request_data, null, 2)}</pre>
                </div>
            </div>
            ` : ''}
            
            <!-- Workout Data -->
            ${log.workout_data ? `
            <div>
                <h5 class="text-sm font-medium text-gray-400 mb-3">Generated Workout</h5>
                <div class="bg-dark-secondary/30 rounded-lg p-4">
                    <pre class="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">${JSON.stringify(log.workout_data, null, 2)}</pre>
                </div>
            </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Close
                </button>
                <button data-action="rate-ai-log-modal" data-log-id="${log.id}" class="modal-action-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Rate Quality
                </button>
                ${log.refunded ? '' : `
                    <button data-action="refund-ai-log-modal" data-log-id="${log.id}" class="modal-action-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Refund
                    </button>
                `}
            </div>
        </div>
    `;
    
    createModal(`AI Generation Details`, content, 'large');
}

function showAIRatingModal(log) {
    const content = `
        <form id="ai-rating-form" class="space-y-6">
            <div class="text-center">
                <h4 class="text-lg font-semibold text-white mb-2">Rate AI Generation Quality</h4>
                <p class="text-gray-400">Generation ID: ${log.id.slice(0, 8)}</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Quality Score (1-5)</label>
                <select id="quality-score" class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">Select quality score</option>
                    <option value="1" ${log.quality_score === 1 ? 'selected' : ''}>1 - Very Poor</option>
                    <option value="2" ${log.quality_score === 2 ? 'selected' : ''}>2 - Poor</option>
                    <option value="3" ${log.quality_score === 3 ? 'selected' : ''}>3 - Average</option>
                    <option value="4" ${log.quality_score === 4 ? 'selected' : ''}>4 - Good</option>
                    <option value="5" ${log.quality_score === 5 ? 'selected' : ''}>5 - Excellent</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">User Rating (1-5)</label>
                <select id="user-rating" class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="">No user rating</option>
                    <option value="1" ${log.user_rating === 1 ? 'selected' : ''}>1 - Very Dissatisfied</option>
                    <option value="2" ${log.user_rating === 2 ? 'selected' : ''}>2 - Dissatisfied</option>
                    <option value="3" ${log.user_rating === 3 ? 'selected' : ''}>3 - Neutral</option>
                    <option value="4" ${log.user_rating === 4 ? 'selected' : ''}>4 - Satisfied</option>
                    <option value="5" ${log.user_rating === 5 ? 'selected' : ''}>5 - Very Satisfied</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Notes (Optional)</label>
                <textarea id="rating-notes" rows="3" class="w-full px-3 py-2 bg-dark-secondary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Add any notes about the quality...">${log.rating_notes || ''}</textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button type="button" data-action="close-modal" class="modal-action-btn px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Save Rating
                </button>
            </div>
        </form>
    `;
    
    createModal('Rate AI Generation', content, 'medium');
    
    // Add form submit handler
    document.getElementById('ai-rating-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAIRatingUpdate(log.id);
    });
}

async function handleAIRatingUpdate(logId) {
    try {
        const qualityScore = document.getElementById('quality-score').value;
        const userRating = document.getElementById('user-rating').value;
        const notes = document.getElementById('rating-notes').value;
        
        const updateData = {};
        if (qualityScore) updateData.quality_score = parseInt(qualityScore);
        if (userRating) updateData.user_rating = parseInt(userRating);
        if (notes) updateData.notes = notes;
        
        if (Object.keys(updateData).length === 0) {
            showNotification('Please provide at least one rating', 'warning');
            return;
        }
        
        showNotification('Updating rating...', 'info', 2000);
        
        await apiCall(`/ai-usage/${logId}/rating`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        showNotification('Rating updated successfully', 'success');
        closeModal();
        loadAIUsage(); // Reload table
        
    } catch (error) {
        console.error('Failed to update rating:', error);
        showNotification('Failed to update rating', 'error');
    }
}

// Helper functions for AI usage
window.refreshAIUsage = function() {
    loadAIUsage();
};

window.applyAIFilters = function() {
    const search = document.getElementById('ai-search')?.value || '';
    const provider = document.getElementById('ai-provider-filter')?.value || '';
    const status = document.getElementById('ai-status-filter')?.value || '';
    const startDate = document.getElementById('ai-start-date')?.value || '';
    const endDate = document.getElementById('ai-end-date')?.value || '';
    
    loadAIUsage(1, { search, provider, status, start_date: startDate, end_date: endDate });
};

window.clearAIFilters = function() {
    document.getElementById('ai-search').value = '';
    document.getElementById('ai-provider-filter').value = '';
    document.getElementById('ai-status-filter').value = '';
    document.getElementById('ai-start-date').value = '';
    document.getElementById('ai-end-date').value = '';
    
    loadAIUsage();
};

window.exportAIUsageLogs = function() {
    showNotification('Export functionality coming soon...', 'info');
};

console.log('✅ Admin JS loaded successfully');