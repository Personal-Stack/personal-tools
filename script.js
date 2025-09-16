// Budget Tracker Application
class BudgetTracker {
    constructor() {
        this.maxCash = 0;
        this.defaultCategories = [
            { name: 'Electricity', amount: 0 },
            { name: 'Water', amount: 0 },
            { name: 'Gas', amount: 0 },
            { name: 'Internet', amount: 0 },
            { name: 'Phone', amount: 0 },
            { name: 'Mortgage', amount: 0 },
            { name: 'Car Gas', amount: 0 },
            { name: 'Investment', amount: 0, isPercentage: true }
        ];
        this.customCategories = [];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDefaultCategories();
        this.updateCalculations();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Max cash input
        const maxCashInput = document.getElementById('maxCash');
        maxCashInput.addEventListener('input', () => {
            this.maxCash = parseFloat(maxCashInput.value) || 0;
            this.updateCalculations();
        });

        // Save data to localStorage on any change
        this.setupAutoSave();
        this.loadSavedData();
    }

    setupAutoSave() {
        // Auto-save every 2 seconds if there are changes
        setInterval(() => {
            this.saveData();
        }, 2000);
    }

    saveData() {
        const data = {
            maxCash: this.maxCash,
            defaultCategories: this.defaultCategories,
            customCategories: this.customCategories
        };
        localStorage.setItem('budgetData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('budgetData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.maxCash = data.maxCash || 0;
            this.defaultCategories = data.defaultCategories || this.defaultCategories;
            this.customCategories = data.customCategories || [];
            
            // Update UI
            document.getElementById('maxCash').value = this.maxCash;
            this.renderDefaultCategories();
            this.renderCustomCategories();
            this.updateCalculations();
        }
    }

    renderDefaultCategories() {
        const container = document.getElementById('defaultCategories');
        container.innerHTML = '';

        this.defaultCategories.forEach((category, index) => {
            const categoryElement = this.createCategoryElement(category, index, true);
            container.appendChild(categoryElement);
        });
    }

    renderCustomCategories() {
        const container = document.getElementById('customCategories');
        container.innerHTML = '';

        this.customCategories.forEach((category, index) => {
            const categoryElement = this.createCategoryElement(category, index, false);
            container.appendChild(categoryElement);
        });
    }

    createCategoryElement(category, index, isDefault) {
        const div = document.createElement('div');
        div.className = 'category-item';

        const isInvestment = category.name === 'Investment';
        
        div.innerHTML = `
            <label>${category.name}:</label>
            <input type="number" 
                   value="${category.amount}" 
                   min="0" 
                   step="0.01" 
                   placeholder="${isInvestment ? 'Percentage' : 'Monthly amount'}"
                   class="${isInvestment ? 'investment-input' : ''}"
                   onchange="budgetTracker.updateCategory(${index}, this.value, ${isDefault})">
            ${isInvestment ? '<span>%</span>' : '<span>$/month</span>'}
            ${!isDefault ? `<button class="remove-btn" onclick="budgetTracker.removeCustomCategory(${index})">Remove</button>` : ''}
        `;

        return div;
    }

    updateCategory(index, value, isDefault) {
        const amount = parseFloat(value) || 0;
        
        if (isDefault) {
            this.defaultCategories[index].amount = amount;
        } else {
            this.customCategories[index].amount = amount;
        }
        
        this.updateCalculations();
    }

    addCustomCategory() {
        const nameInput = document.getElementById('newCategoryName');
        const amountInput = document.getElementById('newCategoryAmount');
        
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value) || 0;
        
        if (name) {
            this.customCategories.push({ name, amount });
            this.renderCustomCategories();
            this.updateCalculations();
            
            // Clear inputs
            nameInput.value = '';
            amountInput.value = '';
        }
    }

    removeCustomCategory(index) {
        this.customCategories.splice(index, 1);
        this.renderCustomCategories();
        this.updateCalculations();
    }

    calculateTotalMonthlyExpenses() {
        let total = 0;
        
        // Add default categories
        this.defaultCategories.forEach(category => {
            if (category.name === 'Investment' && category.isPercentage) {
                // Investment is a percentage of monthly budget
                const monthlyBudget = this.maxCash / 12;
                total += (monthlyBudget * category.amount) / 100;
            } else {
                total += category.amount;
            }
        });
        
        // Add custom categories
        this.customCategories.forEach(category => {
            total += category.amount;
        });
        
        return total;
    }

    updateCalculations() {
        const totalMonthly = this.calculateTotalMonthlyExpenses();
        const totalAnnual = totalMonthly * 12;
        const remaining = this.maxCash - totalAnnual;
        
        // Update indicators
        const availableAfterExpenses = Math.max(0, remaining);
        document.getElementById('dailyMax').textContent = `$${(availableAfterExpenses / 365).toFixed(2)}`;
        document.getElementById('weeklyMax').textContent = `$${(availableAfterExpenses / 52).toFixed(2)}`;
        document.getElementById('monthlyMax').textContent = `$${(availableAfterExpenses / 12).toFixed(2)}`;
        document.getElementById('yearlyMax').textContent = `$${availableAfterExpenses.toFixed(2)}`;
        
        // Update summary
        document.getElementById('totalMonthly').textContent = `$${totalMonthly.toFixed(2)}`;
        document.getElementById('totalAnnual').textContent = `$${totalAnnual.toFixed(2)}`;
        document.getElementById('remainingBudget').textContent = `$${remaining.toFixed(2)}`;
        
        // Update budget status
        const statusElement = document.getElementById('budgetStatus');
        const statusContainer = statusElement.parentElement;
        
        if (remaining > 0) {
            statusElement.textContent = 'Under Budget ✓';
            statusContainer.className = 'summary-item';
        } else if (remaining === 0) {
            statusElement.textContent = 'On Budget';
            statusContainer.className = 'summary-item warning';
        } else {
            statusElement.textContent = 'Over Budget ⚠';
            statusContainer.className = 'summary-item danger';
        }
        
        // Update charts
        this.updateCharts();
    }

    initializeCharts() {
        // Budget Breakdown Chart
        const budgetCtx = document.getElementById('budgetChart').getContext('2d');
        this.charts.budget = new Chart(budgetCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget Breakdown'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Remaining vs Spent Chart
        const remainingCtx = document.getElementById('remainingChart').getContext('2d');
        this.charts.remaining = new Chart(remainingCtx, {
            type: 'bar',
            data: {
                labels: ['Spent', 'Remaining'],
                datasets: [{
                    label: 'Annual Budget ($)',
                    data: [0, 0],
                    backgroundColor: ['#FF6384', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget Overview'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        // Update budget breakdown chart
        const labels = [];
        const data = [];
        
        // Add default categories with non-zero amounts
        this.defaultCategories.forEach(category => {
            if (category.amount > 0) {
                labels.push(category.name);
                if (category.name === 'Investment' && category.isPercentage) {
                    const monthlyBudget = this.maxCash / 12;
                    const annualAmount = ((monthlyBudget * category.amount) / 100) * 12;
                    data.push(annualAmount);
                } else {
                    data.push(category.amount * 12);
                }
            }
        });
        
        // Add custom categories with non-zero amounts
        this.customCategories.forEach(category => {
            if (category.amount > 0) {
                labels.push(category.name);
                data.push(category.amount * 12);
            }
        });
        
        this.charts.budget.data.labels = labels;
        this.charts.budget.data.datasets[0].data = data;
        this.charts.budget.update();
        
        // Update remaining chart
        const totalSpent = this.calculateTotalMonthlyExpenses() * 12;
        const remaining = Math.max(0, this.maxCash - totalSpent);
        
        this.charts.remaining.data.datasets[0].data = [totalSpent, remaining];
        this.charts.remaining.update();
    }
}

// Global functions for HTML onclick events
function addCustomCategory() {
    budgetTracker.addCustomCategory();
}

// Initialize the budget tracker when the page loads
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    budgetTracker = new BudgetTracker();
});