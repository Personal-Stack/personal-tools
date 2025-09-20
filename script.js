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
        this.updateNoChartsMessage();
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

        // Dynamic chart controls
        this.setupDynamicChartControls();

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
    setupDynamicChartControls() {
        const chartTypeSelect = document.getElementById('chartType');
        const addChartBtn = document.getElementById('addCustomChartBtn');
        const clearAllBtn = document.getElementById('clearAllChartsBtn');

        // Chart type change handler
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', () => this.handleChartTypeChange());
        }

        // Add chart button
        if (addChartBtn) {
            addChartBtn.addEventListener('click', () => this.addCustomChart());
        }

        // Clear all charts button
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllDynamicCharts());
        }

        // Initialize the controls
        this.handleChartTypeChange();
        this.updateNoChartsMessage();
        this.populateChartSelects();
    }

    handleChartTypeChange() {
        const chartType = document.getElementById('chartType').value;
        const tagGroup = document.getElementById('tagFilterGroup');
        const freqGroup = document.getElementById('freqFilterGroup');
        const combinedGroup = document.getElementById('combinedFilterGroup');

        // Hide all groups first
        if (tagGroup) tagGroup.style.display = 'none';
        if (freqGroup) freqGroup.style.display = 'none';
        if (combinedGroup) combinedGroup.style.display = 'none';

        // Show relevant groups
        switch (chartType) {
            case 'tag':
                if (tagGroup) tagGroup.style.display = 'flex';
                break;
            case 'frequency':
                if (freqGroup) freqGroup.style.display = 'flex';
                break;
            case 'combined':
                if (combinedGroup) combinedGroup.style.display = 'flex';
                break;
        }

        this.populateChartSelects();
    }

    addCustomChart() {
        const chartType = document.getElementById('chartType').value;
        let key, title, filterConfig;

        switch (chartType) {
            case 'tag':
                const tagValue = document.getElementById('tagChartSelect').value;
                if (!tagValue) {
                    alert('Please select a tag');
                    return;
                }
                key = `tag:${tagValue}`;
                title = tagValue === '__all__' ? 'All Items by Tag' : `Items tagged: ${tagValue}`;
                filterConfig = { type: 'tag', value: tagValue };
                break;

            case 'frequency':
                const freqValue = document.getElementById('freqChartSelect').value;
                if (!freqValue) {
                    alert('Please select a frequency');
                    return;
                }
                key = `freq:${freqValue}`;
                title = `All Items (${freqValue.charAt(0).toUpperCase() + freqValue.slice(1)} View)`;
                filterConfig = { type: 'frequency', value: freqValue };
                break;

            case 'combined':
                const combTag = document.getElementById('combinedTagSelect').value;
                const combFreq = document.getElementById('combinedFreqSelect').value;
                if (!combTag || !combFreq) {
                    alert('Please select both tag and frequency');
                    return;
                }
                key = `combined:${combTag}:${combFreq}`;
                const tagLabel = combTag === '__all__' ? 'All Tags' : combTag;
                const freqLabel = combFreq === '__all__' ? 'Annual View' : `${combFreq.charAt(0).toUpperCase() + combFreq.slice(1)} View`;
                title = `${tagLabel} - ${freqLabel}`;
                filterConfig = { type: 'combined', tag: combTag, frequency: combFreq };
                break;

            default:
                return;
        }

        // Check if chart already exists
        if (this.dynamicCharts[key]) {
            alert('This chart already exists');
            return;
        }

        // Check if there will be any data for this combination (only for tag filtering)
        const testFilter = this.filterItems(filterConfig);
        if (testFilter.length === 0 && filterConfig.type !== 'frequency') {
            let message = 'No budget items match the selected criteria:\n';
            if (filterConfig.type === 'tag') {
                message += `Tag: "${filterConfig.value}"`;
            } else if (filterConfig.type === 'combined') {
                message += `Tag: "${filterConfig.tag}"`;
            }
            message += '\n\nThe chart will be created but will show "No matching items found".';
            
            if (!confirm(message + '\n\nDo you want to create the chart anyway?')) {
                return;
            }
        }

        this.createDynamicChart(key, filterConfig, title);
    }

    addTagChart() {
        // Legacy method for backward compatibility
        const select = document.getElementById('tagChartSelect');
        if (!select || !select.value) return;
        const tag = select.value;
        const key = `tag:${tag}`;
        if (this.dynamicCharts[key]) return;
        const title = tag === '__all__' ? 'All Items' : `Tag: ${tag}`;
        this.createDynamicChart(key, { type: 'tag', value: tag }, title);
    }

    addFrequencyChart() {
        // Legacy method for backward compatibility
        const select = document.getElementById('freqChartSelect');
        if (!select || !select.value) return;
        const freq = select.value;
        const key = `freq:${freq}`;
        if (this.dynamicCharts[key]) return;
        const title = `Frequency: ${freq}`;
        this.createDynamicChart(key, { type: 'frequency', value: freq }, title);
    }

    createDynamicChart(key, filterConfig, title) {
        if (typeof Chart === 'undefined') return;
        const container = document.getElementById('dynamicCharts');
        if (!container) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper dynamic';
        wrapper.setAttribute('data-chart-key', key);
        
        wrapper.innerHTML = `
            <div class="dynamic-chart-header">
                <h3>${title}</h3>
                <button type="button" class="remove-chart-btn" onclick="budgetTracker.removeDynamicChart('${key}')">×</button>
            </div>
            <canvas></canvas>
        `;
        container.appendChild(wrapper);

        const ctx = wrapper.querySelector('canvas').getContext('2d');
        
        // Always use pie/doughnut chart for better visualization
        const chartConfig = {
            type: 'doughnut',
            data: { 
                labels: [], 
                datasets: [{ 
                    data: [], 
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#C9CBCF', '#8DD17E',
                        '#FF99C8', '#7DA3FF', '#FFC870', '#5AD1D1',
                        '#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98'
                    ] 
                }] 
            },
            options: { 
                responsive: false, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }, 
                    title: { 
                        display: false 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                                
                                // Get the chart instance to access the filterConfig
                                const chart = context.chart;
                                const filterConfig = chart.budgetFilterConfig;
                                
                                let frequencyLabel = 'annual';
                                if (filterConfig && filterConfig.type === 'frequency') {
                                    frequencyLabel = filterConfig.value;
                                } else if (filterConfig && filterConfig.type === 'combined' && filterConfig.frequency !== '__all__') {
                                    frequencyLabel = filterConfig.frequency;
                                }
                                
                                return `${label}: $${value.toLocaleString()} ${frequencyLabel} (${percentage}%)`;
                            }
                        }
                    }
                } 
            }
        };

        // Set fixed canvas dimensions based on screen size
        const canvas = wrapper.querySelector('canvas');
        const isMobile = window.innerWidth <= 480;
        const canvasWidth = isMobile ? 270 : 350;
        const canvasHeight = isMobile ? 250 : 300;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        const chart = new Chart(ctx, chartConfig);
        
        // Store filterConfig in chart for tooltip access
        chart.budgetFilterConfig = filterConfig;
        
        this.dynamicCharts[key] = { chart, filterConfig, title, wrapper };
        this.updateDynamicChart(key);
        this.updateNoChartsMessage();
    }

    updateDynamicChart(key) {
        const entry = this.dynamicCharts[key];
        if (!entry) return;
        
        const { chart, filterConfig } = entry;
        let filtered = this.filterItems(filterConfig);
        
        if (filtered.length === 0) {
            chart.data.labels = ['No matching items found'];
            chart.data.datasets[0].data = [1];
            chart.data.datasets[0].backgroundColor = ['#e9ecef'];
        } else {
            const labels = filtered.map(it => it.name);
            const data = filtered.map(it => this.convertToTargetFrequency(it, filterConfig));
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            
            // Ensure colors array matches data length
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#C9CBCF', '#8DD17E',
                '#FF99C8', '#7DA3FF', '#FFC870', '#5AD1D1',
                '#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98'
            ];
            chart.data.datasets[0].backgroundColor = data.map((_, index) => colors[index % colors.length]);
        }
        
        chart.update();
    }

    filterItems(filterConfig) {
        let filtered = this.items.slice();
        
        switch (filterConfig.type) {
            case 'tag':
                if (filterConfig.value === '__all__') {
                    // Return all items
                } else {
                    filtered = filtered.filter(it => (it.tags || []).includes(filterConfig.value));
                }
                break;
                
            case 'frequency':
                // For frequency charts, show ALL items but convert them to the target frequency
                // Don't filter by frequency, just convert all items to show in target frequency
                break;
                
            case 'combined':
                // Apply tag filter
                if (filterConfig.tag !== '__all__') {
                    filtered = filtered.filter(it => (it.tags || []).includes(filterConfig.tag));
                }
                // For combined charts, don't filter by frequency either - convert all to target frequency
                break;
        }
        
        return filtered;
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

    convertToTargetFrequency(item, filterConfig) {
        // First convert to annual, then to target frequency
        const annual = this.toAnnual(item);
        
        // Determine target frequency
        let targetFrequency = 'annual'; // default
        
        if (filterConfig.type === 'frequency') {
            targetFrequency = filterConfig.value;
        } else if (filterConfig.type === 'combined' && filterConfig.frequency !== '__all__') {
            targetFrequency = filterConfig.frequency;
        }
        
        // Convert from annual to target frequency
        switch(targetFrequency) {
            case 'daily': return annual / 365;
            case 'weekly': return annual / 52;
            case 'monthly': return annual / 12;
            case 'yearly': return annual;
            default: return annual; // fallback to annual
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
        this.updateNoChartsMessage();
    }

    clearAllDynamicCharts() {
        if (Object.keys(this.dynamicCharts).length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to remove all custom charts?')) {
            Object.keys(this.dynamicCharts).forEach(key => {
                const entry = this.dynamicCharts[key];
                entry.chart.destroy();
                entry.wrapper.remove();
            });
            this.dynamicCharts = {};
            this.updateNoChartsMessage();
        }
    }

    updateNoChartsMessage() {
        const noChartsMsg = document.getElementById('noChartsMessage');
        const hasCharts = Object.keys(this.dynamicCharts).length > 0;
        
        if (noChartsMsg) {
            noChartsMsg.style.display = hasCharts ? 'none' : 'block';
        }
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
        
        // Also update chart selects
        this.populateChartSelects();
    }

    populateChartSelects() {
        const tags = new Set();
        const frequencies = new Set();
        this.items.forEach(it => {
            (it.tags || []).forEach(t => tags.add(t));
            frequencies.add(it.frequency);
        });
        const sortedTags = Array.from(tags).sort();
        const sortedFreqs = Array.from(frequencies).sort();
        
        // Update main tag select
        const tagSelect = document.getElementById('tagChartSelect');
        if (tagSelect) {
            const prevValue = tagSelect.value;
            let optionsHtml = '<option value="" disabled>Choose tag</option><option value="__all__">All Items</option>';
            optionsHtml += sortedTags.map(t => {
                const count = this.items.filter(item => (item.tags || []).includes(t)).length;
                return `<option value="${t}">${t} (${count} items)</option>`;
            }).join('');
            tagSelect.innerHTML = optionsHtml;
            if (prevValue && (prevValue === '__all__' || sortedTags.includes(prevValue))) {
                tagSelect.value = prevValue;
            }
        }
        
        // Update frequency select - all frequencies available since we convert
        const freqSelect = document.getElementById('freqChartSelect');
        if (freqSelect) {
            const prevValue = freqSelect.value;
            let optionsHtml = '<option value="" disabled>Choose frequency view</option>';
            ['daily', 'weekly', 'monthly', 'yearly'].forEach(freq => {
                const totalItems = this.items.length;
                optionsHtml += `<option value="${freq}">${freq} (${totalItems} items converted)</option>`;
            });
            freqSelect.innerHTML = optionsHtml;
            if (prevValue && ['daily', 'weekly', 'monthly', 'yearly'].includes(prevValue)) {
                freqSelect.value = prevValue;
            }
        }
        
        // Update combined tag select
        const combinedTagSelect = document.getElementById('combinedTagSelect');
        if (combinedTagSelect) {
            const prevValue = combinedTagSelect.value;
            let optionsHtml = '<option value="" disabled>Choose tag</option><option value="__all__">All Tags</option>';
            optionsHtml += sortedTags.map(t => {
                const count = this.items.filter(item => (item.tags || []).includes(t)).length;
                return `<option value="${t}">${t} (${count} items)</option>`;
            }).join('');
            combinedTagSelect.innerHTML = optionsHtml;
            if (prevValue && (prevValue === '__all__' || sortedTags.includes(prevValue))) {
                combinedTagSelect.value = prevValue;
            }
        }
        
        // Update combined frequency select - all frequencies available since we convert
        const combinedFreqSelect = document.getElementById('combinedFreqSelect');
        if (combinedFreqSelect) {
            const prevValue = combinedFreqSelect.value;
            let optionsHtml = '<option value="" disabled>Choose frequency view</option><option value="__all__">Annual View</option>';
            ['daily', 'weekly', 'monthly', 'yearly'].forEach(freq => {
                optionsHtml += `<option value="${freq}">${freq} view</option>`;
            });
            combinedFreqSelect.innerHTML = optionsHtml;
            if (prevValue && (['__all__', 'daily', 'weekly', 'monthly', 'yearly'].includes(prevValue))) {
                combinedFreqSelect.value = prevValue;
            }
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

