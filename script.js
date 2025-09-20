// Budget Tracker Application
class BudgetTracker {
    constructor() {
        this.maxCash = 0;
        this.items = [];
        this.charts = {};
        this.editingIndex = undefined; // track index being edited
        this.dynamicCharts = {}; // key -> { chart, type: 'tag'|'frequency', value }
        this.pendingImportData = null; // store data for preview before import
        
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

        // Feed import
        const importBtn = document.getElementById('importFeedBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.handleFeedImport());
        }

        // Enhanced feed import with preview
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        const cancelImportBtn = document.getElementById('cancelImportBtn');
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', () => this.confirmFeedImport());
        }
        if (cancelImportBtn) {
            cancelImportBtn.addEventListener('click', () => this.cancelFeedImport());
        }

        // Dynamic chart buttons
        const addTagChartBtn = document.getElementById('addTagChartBtn');
        if (addTagChartBtn) addTagChartBtn.addEventListener('click', () => this.addTagChart());
        const addFreqChartBtn = document.getElementById('addFreqChartBtn');
        if (addFreqChartBtn) addFreqChartBtn.addEventListener('click', () => this.addFrequencyChart());

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
            this.populateTagSelect();
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

        if (this.editingIndex === index) {
            // Inline edit mode
            div.innerHTML = `
                <form class="inline-edit" onsubmit="budgetTracker.saveEditItem(event, ${index})">
                    <div class="inline-edit-grid">
                        <input type="text" name="name" value="${item.name}" required />
                        <input type="number" name="value" value="${item.value}" min="0" step="0.01" required />
                        <input type="text" name="tags" value="${(item.tags||[]).join(', ')}" placeholder="Tags (comma separated)" list="existingTags" />
                        <select name="frequency">
                            <option value="daily" ${item.frequency==='daily'?'selected':''}>Daily</option>
                            <option value="weekly" ${item.frequency==='weekly'?'selected':''}>Weekly</option>
                            <option value="monthly" ${item.frequency==='monthly'?'selected':''}>Monthly</option>
                            <option value="yearly" ${item.frequency==='yearly'?'selected':''}>Yearly</option>
                        </select>
                        <div class="inline-buttons">
                            <button type="submit" class="save-btn">Save</button>
                            <button type="button" class="cancel-btn" onclick="budgetTracker.cancelEditItem()">Cancel</button>
                        </div>
                    </div>
                </form>
            `;
        } else {
            div.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        <span class="item-value">$${item.value.toFixed(2)}</span>
                        <span class="item-frequency">${item.frequency}</span>
                        <span class="item-tags">${(item.tags && item.tags.length ? item.tags.join(', ') : 'No tags')}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="budgetTracker.startEditItem(${index})">Edit</button>
                    <button class="remove-btn" onclick="budgetTracker.removeItem(${index})">Remove</button>
                </div>`;
        }
        return div;
    }

    addItem() {
        const nameInput = document.getElementById('itemName');
        const valueInput = document.getElementById('itemValue');
        const tagsInput = document.getElementById('itemTags');
        const frequencySelect = document.getElementById('itemFrequency');
        
        const name = nameInput.value.trim();
        const value = parseFloat(valueInput.value) || 0;
    const tags = tagsInput.value.split(',').map(t=>t.trim()).filter(t=>t);
        const frequency = frequencySelect.value;
        
        if (name && value > 0) {
            // Always add new (editing occurs inline now)
            this.items.push({ name, value, tags, frequency });
            this.renderItems();
            this.updateCalculations();
            this.refreshDynamicCharts();
            this.populateTagSelect();

            // Clear inputs
            nameInput.value = '';
            valueInput.value = '';
            tagsInput.value = '';
            frequencySelect.value = 'monthly';
        }
    }

    startEditItem(index) {
        this.editingIndex = index;
        this.renderItems();
    }

    saveEditItem(event, index) {
        event.preventDefault();
        const form = event.target;
        const name = form.elements.name.value.trim();
        const value = parseFloat(form.elements.value.value) || 0;
        const tags = form.elements.tags.value.split(',').map(t=>t.trim()).filter(t=>t);
        const frequency = form.elements.frequency.value;
        if (name && value > 0) {
            this.items[index] = { name, value, tags, frequency };
            this.editingIndex = undefined;
            this.renderItems();
            this.updateCalculations();
            this.refreshDynamicCharts();
            this.populateTagSelect();
        }
    }

    handleFeedImport() {
        const fileInput = document.getElementById('feedFile');
        const statusEl = document.getElementById('importStatus');
        const previewEl = document.getElementById('importPreview');
        
        if (!fileInput || !fileInput.files.length) {
            if (statusEl) {
                statusEl.textContent = 'Please select a JSON file';
                statusEl.className = 'import-status error';
            }
            return;
        }

        const file = fileInput.files[0];
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            if (statusEl) {
                statusEl.textContent = 'Please select a .json file';
                statusEl.className = 'import-status error';
            }
            return;
        }

        // Show loading status
        if (statusEl) {
            statusEl.textContent = 'Reading file...';
            statusEl.className = 'import-status';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.validateAndPreviewData(data, statusEl, previewEl);
            } catch(err) {
                console.error('JSON Parse Error:', err);
                if (statusEl) {
                    statusEl.textContent = 'Invalid JSON format. Please check your file.';
                    statusEl.className = 'import-status error';
                }
                this.hidePreview();
            }
        };
        
        reader.onerror = () => {
            if (statusEl) {
                statusEl.textContent = 'Error reading file';
                statusEl.className = 'import-status error';
            }
            this.hidePreview();
        };
        
        reader.readAsText(file);
    }

    validateAndPreviewData(data, statusEl, previewEl) {
        // Validate data structure
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be an object');
        }

        const validatedData = {
            settings: {},
            items: []
        };

        // Validate and extract settings
        if (data.settings && typeof data.settings === 'object') {
            if (typeof data.settings.maxCash === 'number' && data.settings.maxCash >= 0) {
                validatedData.settings.maxCash = data.settings.maxCash;
            }
            if (data.settings.currency && typeof data.settings.currency === 'string') {
                validatedData.settings.currency = data.settings.currency;
            }
        }

        // Validate and extract items
        if (Array.isArray(data.items)) {
            validatedData.items = data.items
                .filter(item => item && typeof item === 'object')
                .map(item => ({
                    name: (item.name || 'Unnamed').toString().trim(),
                    value: typeof item.value === 'number' && item.value >= 0 ? item.value : 0,
                    frequency: ['daily','weekly','monthly','yearly'].includes(item.frequency) ? item.frequency : 'monthly',
                    tags: Array.isArray(item.tags) ? 
                        item.tags.filter(t => t && typeof t === 'string').map(t => t.trim()) : 
                        (typeof item.tags === 'string' ? [item.tags.trim()] : [])
                }))
                .filter(item => item.name && item.value > 0);
        }

        // Store for later confirmation
        this.pendingImportData = validatedData;

        // Show preview
        this.showPreview(validatedData, statusEl, previewEl);
    }

    showPreview(data, statusEl, previewEl) {
        const previewMaxCash = document.getElementById('previewMaxCash');
        const previewItemsCount = document.getElementById('previewItemsCount');

        if (previewMaxCash) {
            previewMaxCash.textContent = data.settings.maxCash ? 
                `$${data.settings.maxCash.toLocaleString()}` + 
                (data.settings.currency ? ` ${data.settings.currency}` : '') : 
                'Not specified';
        }

        if (previewItemsCount) {
            previewItemsCount.textContent = data.items.length;
        }

        if (statusEl) {
            statusEl.textContent = 'File loaded successfully. Review the preview below.';
            statusEl.className = 'import-status success';
        }

        if (previewEl) {
            previewEl.style.display = 'block';
        }
    }

    hidePreview() {
        const previewEl = document.getElementById('importPreview');
        if (previewEl) {
            previewEl.style.display = 'none';
        }
        this.pendingImportData = null;
    }

    confirmFeedImport() {
        if (!this.pendingImportData) {
            return;
        }

        const data = this.pendingImportData;
        const statusEl = document.getElementById('importStatus');

        try {
            // Apply settings
            if (data.settings.maxCash) {
                this.maxCash = data.settings.maxCash;
                document.getElementById('maxCash').value = this.maxCash;
            }

            // Apply items (replace existing)
            if (data.items.length > 0) {
                this.items = data.items;
            }

            // Update UI
            this.editingIndex = undefined;
            this.renderItems();
            this.updateCalculations();
            this.refreshDynamicCharts();
            this.populateTagSelect();

            // Show success status
            if (statusEl) {
                statusEl.textContent = `Successfully imported ${data.items.length} items` + 
                    (data.settings.maxCash ? ` and budget of $${data.settings.maxCash.toLocaleString()}` : '');
                statusEl.className = 'import-status success';
            }

            // Hide preview
            this.hidePreview();

            // Clear file input
            const fileInput = document.getElementById('feedFile');
            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Import Error:', error);
            if (statusEl) {
                statusEl.textContent = 'Error importing data';
                statusEl.className = 'import-status error';
            }
        }
    }

    cancelFeedImport() {
        this.hidePreview();
        const statusEl = document.getElementById('importStatus');
        if (statusEl) {
            statusEl.textContent = 'Import cancelled';
            statusEl.className = 'import-status';
        }
    }

    cancelEditItem() {
        this.editingIndex = undefined;
        this.renderItems();
    }

    removeItem(index) {
        this.items.splice(index, 1);
        if (this.editingIndex !== undefined) {
            if (index === this.editingIndex) {
                this.editingIndex = undefined;
            } else if (index < this.editingIndex) {
                this.editingIndex -= 1; // shift editing index
            }
        }
        this.renderItems();
        this.updateCalculations();
        this.refreshDynamicCharts();
        this.populateTagSelect();
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
        this.refreshDynamicCharts();
    }

    // ----- Dynamic Charts -----
    addTagChart() {
        const select = document.getElementById('tagChartSelect');
        if (!select || !select.value) return;
        const tag = select.value;
        const key = `tag:${tag}`;
        if (this.dynamicCharts[key]) return; // already exists
        this.createDynamicChart(key, 'tag', tag);
    }

    addFrequencyChart() {
        const select = document.getElementById('freqChartSelect');
        if (!select || !select.value) return;
        const freq = select.value;
        const key = `freq:${freq}`;
        if (this.dynamicCharts[key]) return;
        this.createDynamicChart(key, 'frequency', freq);
    }

    createDynamicChart(key, type, value) {
        if (typeof Chart === 'undefined') return;
        const container = document.getElementById('dynamicCharts');
        if (!container) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper dynamic';
        wrapper.setAttribute('data-chart-key', key);
        let title;
        if (type === 'tag') {
            title = (value === '__all__') ? 'All Items' : `Tag: ${value}`;
        } else {
            title = `Frequency: ${value}`;
        }
        wrapper.innerHTML = `
            <div class="dynamic-chart-header">
                <h3>${title}</h3>
                <button type="button" class="remove-chart-btn" onclick="budgetTracker.removeDynamicChart('${key}')">×</button>
            </div>
            <canvas></canvas>
        `;
        container.appendChild(wrapper);
        const ctx = wrapper.querySelector('canvas').getContext('2d');
        // Use doughnut chart for the special "All Items" aggregate, bar otherwise
        const isAllItems = (type === 'tag' && value === '__all__');
        const chartConfig = isAllItems ? {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#C9CBCF', '#8DD17E',
                '#FF99C8', '#7DA3FF', '#FFC870', '#5AD1D1'
            ] }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: false } } }
        } : {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Annual Amount ($)', data: [], backgroundColor: '#36A2EB' }] },
            options: { responsive: true, plugins: { legend: { display: false } } }
        };
        const chart = new Chart(ctx, chartConfig);
        this.dynamicCharts[key] = { chart, type, value, wrapper };
        this.updateDynamicChart(key);
    }

    updateDynamicChart(key) {
        const entry = this.dynamicCharts[key];
        if (!entry) return;
        const { chart, type, value } = entry;
        let filtered = [];
        if (type === 'tag') {
            if (value === '__all__') {
                filtered = this.items.slice();
            } else {
                filtered = this.items.filter(it => (it.tags||[]).includes(value));
            }
        } else if (type === 'frequency') {
            filtered = this.items.filter(it => it.frequency === value);
        }
        const labels = filtered.map(it => it.name);
        const data = filtered.map(it => this.toAnnual(it));
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        // For All Items doughnut, ensure colors array at least matches length
        if (type === 'tag' && value === '__all__') {
            const colors = chart.data.datasets[0].backgroundColor;
            if (Array.isArray(colors)) {
                while (colors.length < data.length) {
                    colors.push(colors[colors.length % 12]);
                }
            }
        }
        chart.update();
    }

    toAnnual(item) {
        switch(item.frequency) {
            case 'daily': return item.value * 365;
            case 'weekly': return item.value * 52;
            case 'monthly': return item.value * 12;
            case 'yearly': return item.value;
            default: return item.value * 12;
        }
    }

    refreshDynamicCharts() {
        Object.keys(this.dynamicCharts).forEach(key => this.updateDynamicChart(key));
    }

    removeDynamicChart(key) {
        const entry = this.dynamicCharts[key];
        if (!entry) return;
        entry.chart.destroy();
        entry.wrapper.remove();
        delete this.dynamicCharts[key];
    }

    populateTagSelect() {
        const select = document.getElementById('tagChartSelect');
        const datalist = document.getElementById('existingTags');
        if (!select) return;
        const prevValue = select.value;
        const tags = new Set();
        this.items.forEach(it => (it.tags||[]).forEach(t => tags.add(t)) );
        const newTags = Array.from(tags).filter(t => t !== '__all__').sort();
        // Always rebuild to keep All Items option present
        let optionsHtml = '<option value="" disabled>Choose tag</option><option value="__all__">All Items</option>';
        optionsHtml += newTags.map(t=>`<option value="${t}">${t}</option>`).join('');
        select.innerHTML = optionsHtml;
        // Restore selection if still valid
        if (prevValue && (prevValue === '__all__' || newTags.includes(prevValue))) {
            select.value = prevValue;
        } else {
            // Keep placeholder selected if nothing chosen
            select.selectedIndex = 0;
        }
        if (datalist) {
            datalist.innerHTML = newTags.map(t=>`<option value="${t}">`).join('');
        }
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

