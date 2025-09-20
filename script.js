// Budget Tracker Application
class BudgetTracker {
    constructor() {
        this.maxCash = 0;
        this.items = [];
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderItems();
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
            items: this.items
        };
        localStorage.setItem('budgetData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('budgetData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.maxCash = data.maxCash || 0;
            this.items = data.items || [];
            
            // Update UI
            document.getElementById('maxCash').value = this.maxCash;
            this.renderItems();
            this.updateCalculations();
        }
    }

    renderItems() {
        const container = document.getElementById('itemsList');
        if (!container) return;
        
        container.innerHTML = '';

        this.items.forEach((item, index) => {
            const itemElement = this.createItemElement(item, index);
            container.appendChild(itemElement);
        });
    }

    createItemElement(item, index) {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.setAttribute('data-index', index);
        
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name" data-field="name">${item.name}</div>
                <div class="item-details">
                    <span class="item-value" data-field="value">$${item.value.toFixed(2)}</span>
                    <span class="item-frequency" data-field="frequency">${item.frequency}</span>
                    <span class="item-tags" data-field="tags">${item.tags || 'No tags'}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="budgetTracker.editItem(${index})">Edit</button>
                <button class="remove-btn" onclick="budgetTracker.removeItem(${index})">Remove</button>
            </div>
        `;

        return div;
    }

    addItem() {
        const nameInput = document.getElementById('itemName');
        const valueInput = document.getElementById('itemValue');
        const tagsInput = document.getElementById('itemTags');
        const frequencySelect = document.getElementById('itemFrequency');
        
        const name = nameInput.value.trim();
        const value = parseFloat(valueInput.value) || 0;
        const tags = tagsInput.value.trim();
        const frequency = frequencySelect.value;
        
        if (name && value > 0) {
            this.items.push({ name, value, tags, frequency });
            this.renderItems();
            this.updateCalculations();
            
            // Clear inputs
            nameInput.value = '';
            valueInput.value = '';
            tagsInput.value = '';
            frequencySelect.value = 'monthly';
        }
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.renderItems();
        this.updateCalculations();
    }

    editItem(index) {
        const itemRow = document.querySelector(`[data-index="${index}"]`);
        const item = this.items[index];
        
        if (itemRow.classList.contains('editing')) {
            return; // Already in edit mode
        }
        
        itemRow.classList.add('editing');
        
        // Replace display elements with input elements
        const nameElement = itemRow.querySelector('[data-field="name"]');
        const valueElement = itemRow.querySelector('[data-field="value"]');
        const frequencyElement = itemRow.querySelector('[data-field="frequency"]');
        const tagsElement = itemRow.querySelector('[data-field="tags"]');
        
        nameElement.innerHTML = `<input type="text" class="edit-name" value="${item.name}" />`;
        valueElement.innerHTML = `$<input type="number" class="edit-value" value="${item.value}" min="0" step="0.01" />`;
        frequencyElement.innerHTML = `
            <select class="edit-frequency">
                <option value="daily" ${item.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${item.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="monthly" ${item.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                <option value="yearly" ${item.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
            </select>
        `;
        tagsElement.innerHTML = `<input type="text" class="edit-tags" value="${item.tags || ''}" placeholder="Tags (optional)" />`;
        
        // Replace action buttons
        const actionsDiv = itemRow.querySelector('.item-actions');
        actionsDiv.innerHTML = `
            <button class="save-btn" onclick="budgetTracker.saveItem(${index})">Save</button>
            <button class="cancel-btn" onclick="budgetTracker.cancelEdit(${index})">Cancel</button>
        `;
    }

    saveItem(index) {
        const itemRow = document.querySelector(`[data-index="${index}"]`);
        
        const name = itemRow.querySelector('.edit-name').value.trim();
        const value = parseFloat(itemRow.querySelector('.edit-value').value) || 0;
        const frequency = itemRow.querySelector('.edit-frequency').value;
        const tags = itemRow.querySelector('.edit-tags').value.trim();
        
        if (name && value > 0) {
            this.items[index] = { name, value, tags, frequency };
            this.renderItems();
            this.updateCalculations();
        }
    }

    cancelEdit(index) {
        // Simply re-render to cancel edit mode
        this.renderItems();
    }

    calculateTotalMonthlyExpenses() {
        let total = 0;
        
        // Convert all items to monthly amounts based on frequency
        this.items.forEach(item => {
            let monthlyAmount = 0;
            
            switch (item.frequency) {
                case 'daily':
                    monthlyAmount = item.value * 30.44; // average days per month
                    break;
                case 'weekly':
                    monthlyAmount = item.value * 4.33; // average weeks per month
                    break;
                case 'monthly':
                    monthlyAmount = item.value;
                    break;
                case 'yearly':
                    monthlyAmount = item.value / 12;
                    break;
                default:
                    monthlyAmount = item.value; // default to monthly
            }
            
            total += monthlyAmount;
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
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available, charts will not be displayed');
            // Hide charts section or show a message
            const chartsSection = document.querySelector('.charts');
            if (chartsSection) {
                chartsSection.innerHTML = '<h2>Budget Visualization</h2><p style="text-align: center; padding: 40px; color: #666;">Charts require internet connection to load Chart.js library.</p>';
            }
            return;
        }

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
        // Only update charts if Chart.js is available and charts are initialized
        if (typeof Chart === 'undefined' || !this.charts.budget || !this.charts.remaining) {
            return;
        }

        // Update budget breakdown chart
        const labels = [];
        const data = [];
        
        // Add items with non-zero values
        this.items.forEach(item => {
            if (item.value > 0) {
                labels.push(item.name);
                
                // Convert to annual amount for chart display
                let annualAmount = 0;
                switch (item.frequency) {
                    case 'daily':
                        annualAmount = item.value * 365;
                        break;
                    case 'weekly':
                        annualAmount = item.value * 52;
                        break;
                    case 'monthly':
                        annualAmount = item.value * 12;
                        break;
                    case 'yearly':
                        annualAmount = item.value;
                        break;
                    default:
                        annualAmount = item.value * 12;
                }
                
                data.push(annualAmount);
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
function addItem() {
    budgetTracker.addItem();
}

// Initialize the budget tracker when the page loads
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    budgetTracker = new BudgetTracker();
});