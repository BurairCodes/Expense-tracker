// Global variables
let currentCurrency = 'USD';
let currentTab = 'expenses';
let currentEditId = null;
let currentEditType = null;

// Currency symbols
const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': '$',
    'AUD': '$'
};

// Category colors for pie chart
const categoryColors = {
    'Food': '#e74c3c',
    'Transportation': '#3498db',
    'Entertainment': '#9b59b6',
    'Shopping': '#e91e63',
    'Bills': '#f39c12',
    'Healthcare': '#27ae60',
    'Education': '#34495e',
    'Travel': '#ff9800',
    'Salary': '#2ecc71',
    'Freelance': '#1abc9c',
    'Investment': '#8e44ad',
    'Other': '#95a5a6'
};

// Data arrays
let expenses = [];
let income = [];
let scheduledCharges = [];

// DOM elements
const elements = {
    currencySelect: document.getElementById('currency-select'),
    totalIncome: document.getElementById('total-income'),
    totalExpenses: document.getElementById('total-expenses'),
    balance: document.getElementById('balance'),
    addIncomeBtn: document.getElementById('add-income-btn'),
    addExpenseBtn: document.getElementById('add-expense-btn'),
    addScheduledBtn: document.getElementById('add-scheduled-btn'),
    searchInput: document.getElementById('search-input'),
    categoryFilter: document.getElementById('category-filter'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModal: document.getElementById('close-modal'),
    itemForm: document.getElementById('item-form'),
    cancelBtn: document.getElementById('cancel-btn'),
    frequencyGroup: document.getElementById('frequency-group')
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadAllData();
});

// Event listeners
function initializeEventListeners() {
    // Currency selector
    elements.currencySelect.addEventListener('change', function() {
        currentCurrency = this.value;
        updateSummary();
        renderCurrentTab();
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Add buttons
    elements.addIncomeBtn.addEventListener('click', () => openModal('income'));
    elements.addExpenseBtn.addEventListener('click', () => openModal('expense'));
    elements.addScheduledBtn.addEventListener('click', () => openModal('scheduled'));

    // Modal controls
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    elements.modal.addEventListener('click', function(e) {
        if (e.target === elements.modal) {
            closeModal();
        }
    });

    // Form submission
    elements.itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });

    // Search and filter
    elements.searchInput.addEventListener('input', renderCurrentTab);
    elements.categoryFilter.addEventListener('change', renderCurrentTab);
}

// API functions
async function loadAllData() {
    try {
        await Promise.all([
            loadExpenses(),
            loadIncome(),
            loadScheduledCharges()
        ]);
        updateSummary();
        updateChart();
        renderCurrentTab();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        if (response.ok) {
            expenses = await response.json();
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function loadIncome() {
    try {
        const response = await fetch('/api/income');
        if (response.ok) {
            income = await response.json();
        }
    } catch (error) {
        console.error('Error loading income:', error);
    }
}

async function loadScheduledCharges() {
    try {
        const response = await fetch('/api/scheduled');
        if (response.ok) {
            scheduledCharges = await response.json();
        }
    } catch (error) {
        console.error('Error loading scheduled charges:', error);
    }
}

// Tab switching
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tab}-section`).classList.add('active');
    
    renderCurrentTab();
}

// Format currency
function formatCurrency(amount) {
    const symbol = currencySymbols[currentCurrency];
    return `${symbol}${amount.toFixed(2)}`;
}

// Update summary
function updateSummary() {
    const totalIncomeAmount = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpensesAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balanceAmount = totalIncomeAmount - totalExpensesAmount;
    
    elements.totalIncome.textContent = formatCurrency(totalIncomeAmount);
    elements.totalExpenses.textContent = formatCurrency(totalExpensesAmount);
    elements.balance.textContent = formatCurrency(balanceAmount);
    
    // Update balance color
    if (balanceAmount >= 0) {
        elements.balance.style.color = '#27ae60';
    } else {
        elements.balance.style.color = '#e74c3c';
    }
}

// Render current tab
function renderCurrentTab() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const categoryFilter = elements.categoryFilter.value;
    
    let data, listElement, emptyElement;
    
    switch(currentTab) {
        case 'expenses':
            data = expenses;
            listElement = document.getElementById('expenses-list');
            emptyElement = document.getElementById('expenses-empty');
            break;
        case 'income':
            data = income;
            listElement = document.getElementById('income-list');
            emptyElement = document.getElementById('income-empty');
            break;
        case 'scheduled':
            data = scheduledCharges;
            listElement = document.getElementById('scheduled-list');
            emptyElement = document.getElementById('scheduled-empty');
            break;
    }
    
    // Filter data
    let filteredData = data.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm) ||
                            (item.description && item.description.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // Render items
    if (filteredData.length === 0) {
        listElement.style.display = 'none';
        emptyElement.style.display = 'block';
    } else {
        listElement.style.display = 'grid';
        emptyElement.style.display = 'none';
        listElement.innerHTML = filteredData.map(item => createItemCard(item, currentTab)).join('');
    }
}

// Create item card
function createItemCard(item, type) {
    const frequencyBadge = item.frequency ? 
        `<span class="frequency-badge">${item.frequency}</span>` : '';
    
    return `
        <div class="item-card ${type}">
            <div class="item-header">
                <div class="item-title">${item.title}</div>
                <div class="item-amount">${formatCurrency(item.amount)}</div>
            </div>
            <div class="item-details">
                <div>
                    <span class="item-category">${item.category}</span>
                    ${frequencyBadge}
                </div>
                <div class="item-date">${formatDate(item.date)}</div>
            </div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem('${item._id}', '${type}')">Edit</button>
                <button class="delete-btn" onclick="deleteItem('${item._id}', '${type}')">Delete</button>
            </div>
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Modal functions
function openModal(type, item = null) {
    currentEditType = type;
    currentEditId = item ? item._id : null;
    
    // Set modal title
    if (item) {
        elements.modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    } else {
        elements.modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
    
    // Show/hide frequency field for scheduled charges
    if (type === 'scheduled') {
        elements.frequencyGroup.style.display = 'block';
    } else {
        elements.frequencyGroup.style.display = 'none';
    }
    
    // Fill form if editing
    if (item) {
        document.getElementById('item-title').value = item.title;
        document.getElementById('item-amount').value = item.amount;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-date').value = item.date.split('T')[0];
        document.getElementById('item-description').value = item.description || '';
        if (item.frequency) {
            document.getElementById('item-frequency').value = item.frequency;
        }
    } else {
        elements.itemForm.reset();
        document.getElementById('item-date').value = new Date().toISOString().split('T')[0];
    }
    
    elements.modal.style.display = 'block';
}

function closeModal() {
    elements.modal.style.display = 'none';
    currentEditId = null;
    currentEditType = null;
    elements.itemForm.reset();
}

// CRUD operations
async function saveItem() {
    const formData = {
        title: document.getElementById('item-title').value,
        amount: parseFloat(document.getElementById('item-amount').value),
        category: document.getElementById('item-category').value,
        date: document.getElementById('item-date').value,
        description: document.getElementById('item-description').value
    };
    
    if (currentEditType === 'scheduled') {
        formData.frequency = document.getElementById('item-frequency').value;
    }
    
    try {
        let response;
        let endpoint;
        
        switch(currentEditType) {
            case 'expenses':
                endpoint = '/api/expenses';
                break;
            case 'income':
                endpoint = '/api/income';
                break;
            case 'scheduled':
                endpoint = '/api/scheduled';
                break;
        }
        
        if (currentEditId) {
            // Update existing item
            response = await fetch(`${endpoint}/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new item
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        }
        
        if (response.ok) {
            await loadAllData();
            closeModal();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('Error saving item. Please try again.');
    }
}

// Create pie chart
function updateChart() {
    const canvas = document.getElementById('expense-chart');
    const ctx = canvas.getContext('2d');
    const legend = document.getElementById('chart-legend');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate expense totals by category
    const categoryTotals = {};
    let totalExpenses = 0;
    
    expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
        totalExpenses += expense.amount;
    });
    
    // If no expenses, show empty state
    if (totalExpenses === 0) {
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(150, 150, 120, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No expenses', 150, 150);
        
        legend.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No data to display</p>';
        return;
    }
    
    // Sort categories by amount (largest first)
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a);
    
    // Draw pie chart
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Create legend HTML
    let legendHTML = '';
    
    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        const sliceAngle = (amount / totalExpenses) * 2 * Math.PI;
        
        // Draw slice
        ctx.fillStyle = categoryColors[category] || '#95a5a6';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw slice border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
        
        // Add to legend
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${categoryColors[category] || '#95a5a6'}"></div>
                <div class="legend-text">
                    <div>${category}</div>
                    <div class="legend-percentage">${percentage.toFixed(1)}%</div>
                </div>
                <div class="legend-amount">${formatCurrency(amount)}</div>
            </div>
        `;
    });
    
    legend.innerHTML = legendHTML;
}

async function editItem(id, type) {
    let item;
    switch(type) {
        case 'expenses':
            item = expenses.find(e => e._id === id);
            break;
        case 'income':
            item = income.find(i => i._id === id);
            break;
        case 'scheduled':
            item = scheduledCharges.find(s => s._id === id);
            break;
    }
    
    if (item) {
        openModal(type, item);
    }
}

async function deleteItem(id, type) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            let endpoint;
            switch(type) {
                case 'expenses':
                    endpoint = '/api/expenses';
                    break;
                case 'income':
                    endpoint = '/api/income';
                    break;
                case 'scheduled':
                    endpoint = '/api/scheduled';
                    break;
            }
            
            const response = await fetch(`${endpoint}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await loadAllData();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please try again.');
        }
    }
}