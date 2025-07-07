// Global variables
let currentEditId = null;
let currentTransactionType = null;

// Category colors for chart
const categoryColors = {
    'Food': '#FF6384',
    'Transportation': '#36A2EB',
    'Entertainment': '#FFCE56',
    'Shopping': '#4BC0C0',
    'Bills': '#9966FF',
    'Healthcare': '#FF9F40',
    'Education': '#FF6384',
    'Travel': '#C9CBCF',
    'Salary': '#4BC0C0',
    'Freelance': '#36A2EB',
    'Investment': '#9966FF',
    'Other': '#FFCE56'
};

// Categories by type
const categories = {
    expense: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Other']
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadSummary();
    loadTransactions();
    setDefaultDate();
});

// Load summary data
async function loadSummary() {
    try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        
        document.getElementById('total-income').textContent = formatCurrency(data.income);
        document.getElementById('total-expenses').textContent = formatCurrency(data.expenses);
        document.getElementById('balance').textContent = formatCurrency(data.balance);
        
        // Update balance color
        const balanceElement = document.getElementById('balance');
        if (data.balance >= 0) {
            balanceElement.style.color = '#28a745';
        } else {
            balanceElement.style.color = '#dc3545';
        }
        
        // Update chart
        updateChart(data.categoryBreakdown);
        
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const typeFilter = document.getElementById('type-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        
        let url = '/api/transactions?';
        if (typeFilter) url += `type=${typeFilter}&`;
        if (categoryFilter !== 'all') url += `category=${categoryFilter}&`;
        
        const response = await fetch(url);
        const transactions = await response.json();
        
        displayTransactions(transactions);
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Display transactions
function displayTransactions(transactions) {
    const container = document.getElementById('transactions-list');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-title">${transaction.title}</div>
                <div class="transaction-details">
                    <span class="transaction-category">${transaction.category}</span>
                    <span>${formatDate(transaction.date)}</span>
                    ${transaction.description ? `<span>${transaction.description}</span>` : ''}
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="action-btn edit-btn" onclick="editTransaction('${transaction.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteTransaction('${transaction.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Update chart
function updateChart(categoryBreakdown) {
    const canvas = document.getElementById('expense-chart');
    const ctx = canvas.getContext('2d');
    const legend = document.getElementById('chart-legend');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = Object.keys(categoryBreakdown);
    const total = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0);
    
    if (total === 0) {
        // Draw empty state
        ctx.fillStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.arc(150, 150, 120, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No expenses', 150, 150);
        
        legend.innerHTML = '<p style="text-align: center; color: #666;">No data to display</p>';
        return;
    }
    
    // Draw pie chart
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    let currentAngle = -Math.PI / 2;
    
    let legendHTML = '';
    
    categories.forEach(category => {
        const amount = categoryBreakdown[category];
        const percentage = (amount / total) * 100;
        const sliceAngle = (amount / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.fillStyle = categoryColors[category] || '#CCCCCC';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
        
        // Add to legend
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${categoryColors[category] || '#CCCCCC'}"></div>
                <div class="legend-text">${category}</div>
                <div class="legend-amount">${formatCurrency(amount)}</div>
            </div>
        `;
    });
    
    legend.innerHTML = legendHTML;
}

// Modal functions
function openModal(type) {
    currentTransactionType = type;
    currentEditId = null;
    
    document.getElementById('modal-title').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('modal').style.display = 'block';
    
    // Populate categories
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = categories[type].map(cat => 
        `<option value="${cat}">${cat}</option>`
    ).join('');
    
    // Reset form
    document.getElementById('transaction-form').reset();
    setDefaultDate();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentEditId = null;
    currentTransactionType = null;
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

// Save transaction
async function saveTransaction(event) {
    event.preventDefault();
    
    const formData = {
        type: currentTransactionType,
        title: document.getElementById('title').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value
    };
    
    try {
        let response;
        
        if (currentEditId) {
            // Update existing transaction
            response = await fetch(`/api/transactions/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new transaction
            response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
        }
        
        if (response.ok) {
            closeModal();
            loadSummary();
            loadTransactions();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error saving transaction. Please try again.');
    }
}

// Edit transaction
async function editTransaction(id) {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        const transaction = transactions.find(t => t.id === id);
        
        if (transaction) {
            currentEditId = id;
            currentTransactionType = transaction.type;
            
            document.getElementById('modal-title').textContent = `Edit ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`;
            
            // Populate categories
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = categories[transaction.type].map(cat => 
                `<option value="${cat}" ${cat === transaction.category ? 'selected' : ''}>${cat}</option>`
            ).join('');
            
            // Fill form
            document.getElementById('title').value = transaction.title;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category').value = transaction.category;
            document.getElementById('date').value = transaction.date;
            document.getElementById('description').value = transaction.description || '';
            
            document.getElementById('modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading transaction for edit:', error);
    }
}

// Delete transaction
async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            const response = await fetch(`/api/transactions/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadSummary();
                loadTransactions();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction. Please try again.');
        }
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}