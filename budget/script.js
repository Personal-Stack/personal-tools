// Budget Tracker Application
class BudgetTracker {
    constructor() {
        this.maxCash = 0;
        this.currency = 'USD'; // current currency
        this.investmentValue = 0;
        this.investmentType = 'amount'; // 'amount' or 'percentage'
        this.investmentFrequency = 'monthly';
        this.items = [];
        this.charts = {};
        this.editingIndex = undefined; // track index being edited
        this.dynamicCharts = {}; // key -> { chart, type: 'tag'|'frequency', value }
        this.pendingImportData = null; // store data for preview before import
        this.changeHistory = []; // array to store all budget changes
        
        // Currency conversion rates (base: USD)
        this.conversionRates = {
            'USD': 1.0,
            'EUR': 0.85,
            'BGN': 1.66,
            'GBP': 0.73,
            'JPY': 110.0,
            'CAD': 1.25,
            'AUD': 1.35,
            'CHF': 0.92
        };
        
        // Currency symbols
        this.currencySymbols = {
            'USD': '$',
            'EUR': '€',
            'BGN': 'лв',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'Fr'
        };
        
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
            const oldValue = this.maxCash;
            this.maxCash = parseFloat(maxCashInput.value) || 0;
            
            // Add to history if value actually changed
            if (oldValue !== this.maxCash) {
                this.addToHistory('max_cash_updated', {
                    oldValue: oldValue,
                    newValue: this.maxCash
                });
            }
            
            this.updateCalculations();
        });

        // Investment controls
        const investmentTypeSelect = document.getElementById('investmentType');
        const investmentValueInput = document.getElementById('investmentValue');
        const investmentFrequencySelect = document.getElementById('investmentFrequency');
        const investmentUnit = document.getElementById('investmentUnit');

        if (investmentTypeSelect) {
            investmentTypeSelect.addEventListener('change', () => {
                const oldType = this.investmentType;
                this.investmentType = investmentTypeSelect.value;
                investmentUnit.textContent = this.investmentType === 'percentage' ? '%' : '$';
                
                // Add to history
                this.addToHistory('investment_type_changed', {
                    oldType: oldType,
                    newType: this.investmentType
                });
                
                this.updateCalculations();
            });
        }

        if (investmentValueInput) {
            investmentValueInput.addEventListener('input', () => {
                const oldValue = this.investmentValue;
                this.investmentValue = parseFloat(investmentValueInput.value) || 0;
                
                // Add to history if value actually changed
                if (oldValue !== this.investmentValue) {
                    this.addToHistory('investment_value_changed', {
                        oldValue: oldValue,
                        newValue: this.investmentValue,
                        type: this.investmentType
                    });
                }
                
                this.updateCalculations();
            });
        }

        if (investmentFrequencySelect) {
            investmentFrequencySelect.addEventListener('change', () => {
                const oldFreq = this.investmentFrequency;
                this.investmentFrequency = investmentFrequencySelect.value;
                
                // Add to history
                this.addToHistory('investment_frequency_changed', {
                    oldFrequency: oldFreq,
                    newFrequency: this.investmentFrequency
                });
                
                this.updateCalculations();
            });
        }

        // Currency selection
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            currencySelect.addEventListener('change', () => {
                this.changeCurrency(currencySelect.value);
            });
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
            currency: this.currency,
            investmentValue: this.investmentValue,
            investmentType: this.investmentType,
            investmentFrequency: this.investmentFrequency,
            items: this.items,
            changeHistory: this.changeHistory
        };
        localStorage.setItem('budgetData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('budgetData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.maxCash = data.maxCash || 0;
            this.currency = data.currency || 'USD';
            this.investmentValue = data.investmentValue || 0;
            this.investmentType = data.investmentType || 'amount';
            this.investmentFrequency = data.investmentFrequency || 'monthly';
            this.items = data.items || [];
            this.changeHistory = data.changeHistory || [];
            
            // Update UI
            document.getElementById('maxCash').value = this.maxCash;
            document.getElementById('currency').value = this.currency;
            document.getElementById('currencySymbol').textContent = this.currencySymbols[this.currency];
            document.getElementById('investmentValue').value = this.investmentValue;
            document.getElementById('investmentType').value = this.investmentType;
            document.getElementById('investmentFrequency').value = this.investmentFrequency;
            document.getElementById('investmentUnit').textContent = this.investmentType === 'percentage' ? '%' : this.currencySymbols[this.currency];
            this.renderItems();
            this.updateCalculations();
            this.populateTagSelect();
        }
    }

    // Change History Management
    addToHistory(action, details = {}, comment = '') {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            comment: comment,
            currency: this.currency
        };
        this.changeHistory.push(historyEntry);
        this.saveData(); // Auto-save when history changes
    }

    addHistoryComment(index, comment) {
        if (this.changeHistory[index]) {
            this.changeHistory[index].comment = comment;
            this.saveData();
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
        div.className = 'card-item';

        if (this.editingIndex === index) {
            // Inline edit mode using design system form components
            div.innerHTML = `
                <form class="inline-edit-form" onsubmit="budgetTracker.saveEditItem(event, ${index})">
                    <div class="form-group">
                        <input type="text" name="name" value="${item.name}" class="form-input" placeholder="Item name" required />
                    </div>
                    <div class="form-group">
                        <input type="number" name="value" value="${item.value}" min="0" step="0.01" class="form-input" placeholder="Amount" required />
                    </div>
                    <div class="form-group">
                        <input type="text" name="tags" value="${(item.tags||[]).join(', ')}" class="form-input" placeholder="Tags (comma separated)" list="existingTags" />
                    </div>
                    <div class="form-group">
                        <select name="frequency" class="form-input">
                            <option value="daily" ${item.frequency==='daily'?'selected':''}>Daily</option>
                            <option value="weekly" ${item.frequency==='weekly'?'selected':''}>Weekly</option>
                            <option value="monthly" ${item.frequency==='monthly'?'selected':''}>Monthly</option>
                            <option value="yearly" ${item.frequency==='yearly'?'selected':''}>Yearly</option>
                        </select>
                    </div>
                    <div class="card-item-actions">
                        <button type="submit" class="btn btn-primary btn-sm">Save</button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="budgetTracker.cancelEditItem()">Cancel</button>
                    </div>
                </form>
            `;
        } else {
            // Display mode using exact card-item structure from design system
            div.innerHTML = `
                <div class="card-item-info">
                    <div class="card-item-name">${item.name}</div>
                    <div class="card-item-details">
                        <span class="card-item-value">${this.formatCurrency(item.value)}</span>
                        <span class="card-item-frequency">${item.frequency}</span>
                        <span class="card-item-tags">${(item.tags && item.tags.length ? item.tags.join(', ') : 'No tags')}</span>
                    </div>
                </div>
                <div class="card-item-actions">
                    <button class="btn btn-info btn-sm" onclick="budgetTracker.startEditItem(${index})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="budgetTracker.removeItem(${index})">Remove</button>
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
            
            // Add to history
            this.addToHistory('item_added', {
                itemName: name,
                value: value,
                tags: tags,
                frequency: frequency,
                itemIndex: this.items.length - 1
            });
            
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
            const oldItem = this.items[index];
            
            // Add to history
            this.addToHistory('item_edited', {
                itemIndex: index,
                oldItem: { ...oldItem },
                newItem: { name, value, tags, frequency }
            });
            
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
                this.validateAndImportData(data, statusEl);
            } catch(err) {
                console.error('JSON Parse Error:', err);
                if (statusEl) {
                    statusEl.textContent = 'Invalid JSON format. Please check your file.';
                    statusEl.className = 'import-status error';
                }
            }
        };
        
        reader.onerror = () => {
            if (statusEl) {
                statusEl.textContent = 'Error reading file';
                statusEl.className = 'import-status error';
            }
        };
        
        reader.readAsText(file);
    }

    validateAndImportData(data, statusEl) {
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
            // Validate and extract investment settings
            if (data.settings.investment && typeof data.settings.investment === 'object') {
                const investment = data.settings.investment;
                if ((investment.type === 'amount' || investment.type === 'percentage') &&
                    typeof investment.value === 'number' && investment.value >= 0 &&
                    ['daily', 'weekly', 'monthly', 'yearly'].includes(investment.frequency)) {
                    validatedData.settings.investment = {
                        type: investment.type,
                        value: investment.value,
                        frequency: investment.frequency
                    };
                }
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

        // Validate and extract change history
        if (Array.isArray(data.changeHistory)) {
            validatedData.changeHistory = data.changeHistory
                .filter(entry => entry && typeof entry === 'object')
                .filter(entry => 
                    entry.timestamp && 
                    entry.action && 
                    typeof entry.timestamp === 'string' &&
                    typeof entry.action === 'string'
                )
                .map(entry => ({
                    timestamp: entry.timestamp,
                    action: entry.action,
                    details: entry.details || {},
                    comment: typeof entry.comment === 'string' ? entry.comment : '',
                    currency: typeof entry.currency === 'string' ? entry.currency : 'USD'
                }));
        }

        // Import data immediately
        this.importDataDirectly(validatedData, statusEl);
    }

    importDataDirectly(data, statusEl) {
        try {
            // Apply currency settings first
            if (data.settings.currency && this.currencySymbols.hasOwnProperty(data.settings.currency)) {
                const newCurrency = data.settings.currency;
                const oldCurrency = this.currency;
                
                // If currency is different, we'll need to convert existing values
                if (oldCurrency !== newCurrency) {
                    // Convert existing maxCash if it exists
                    if (this.maxCash > 0) {
                        this.maxCash = this.convertAmount(this.maxCash, oldCurrency, newCurrency);
                    }
                    
                    // Convert existing investment value if it's a fixed amount
                    if (this.investmentType === 'amount' && this.investmentValue > 0) {
                        this.investmentValue = this.convertAmount(this.investmentValue, oldCurrency, newCurrency);
                    }
                    
                    // Convert existing items
                    this.items.forEach(item => {
                        item.value = this.convertAmount(item.value, oldCurrency, newCurrency);
                    });
                }
                
                // Update currency
                this.currency = newCurrency;
                
                // Update UI elements
                document.getElementById('currency').value = this.currency;
                document.getElementById('currencySymbol').textContent = this.currencySymbols[this.currency];
            }

            // Apply settings
            if (data.settings.maxCash) {
                this.maxCash = data.settings.maxCash;
                document.getElementById('maxCash').value = this.maxCash;
            }

            // Apply investment settings
            if (data.settings.investment) {
                this.investmentType = data.settings.investment.type;
                this.investmentValue = data.settings.investment.value;
                this.investmentFrequency = data.settings.investment.frequency;
                
                // Update UI elements
                const typeSelect = document.getElementById('investmentType');
                const valueInput = document.getElementById('investmentValue');
                const frequencySelect = document.getElementById('investmentFrequency');
                const unitSpan = document.getElementById('investmentUnit');
                
                if (typeSelect) typeSelect.value = this.investmentType;
                if (valueInput) valueInput.value = this.investmentValue;
                if (frequencySelect) frequencySelect.value = this.investmentFrequency;
                if (unitSpan) unitSpan.textContent = this.investmentType === 'percentage' ? '%' : this.currencySymbols[this.currency];
            }

            // Apply items (replace existing)
            if (data.items.length > 0) {
                this.items = data.items;
            }

            // Apply change history (merge with existing)
            if (data.changeHistory && Array.isArray(data.changeHistory) && data.changeHistory.length > 0) {
                // Ask user whether to merge or replace history
                const mergeHistory = confirm(
                    `Found ${data.changeHistory.length} change history entries.\n\n` +
                    `Click OK to MERGE with existing history (${this.changeHistory.length} entries).\n` +
                    `Click Cancel to REPLACE existing history.`
                );
                
                if (mergeHistory) {
                    // Merge histories and sort by timestamp
                    const combinedHistory = [...this.changeHistory, ...data.changeHistory];
                    this.changeHistory = combinedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                } else {
                    // Replace existing history
                    this.changeHistory = [...data.changeHistory];
                }
            }

            // Add to history
            this.addToHistory('feed_imported', {
                itemsCount: data.items.length,
                currency: data.settings.currency || null,
                maxCash: data.settings.maxCash || null,
                investment: data.settings.investment || null,
                historyEntriesImported: data.changeHistory ? data.changeHistory.length : 0
            });

            // Update UI
            this.editingIndex = undefined;
            this.renderItems();
            this.updateCalculations();
            this.refreshDynamicCharts();
            this.populateTagSelect();

            // Show success status
            if (statusEl) {
                let message = `Successfully imported ${data.items.length} items`;
                if (data.settings.currency) {
                    message += ` with currency ${data.settings.currency}`;
                }
                if (data.settings.maxCash) {
                    const currencySymbol = this.currencySymbols[this.currency];
                    message += ` and budget of ${currencySymbol}${data.settings.maxCash.toLocaleString()}`;
                }
                if (data.settings.investment) {
                    const { type, value, frequency } = data.settings.investment;
                    const unit = type === 'percentage' ? '%' : this.currencySymbols[this.currency];
                    message += ` and investment of ${unit}${value} ${frequency}`;
                }
                if (data.changeHistory && data.changeHistory.length > 0) {
                    message += ` and ${data.changeHistory.length} history entries`;
                }
                statusEl.textContent = message;
                statusEl.className = 'import-status success';
            }

            // Clear file input
            const fileInput = document.getElementById('feedFile');
            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Import Error:', error);
            if (statusEl) {
                statusEl.textContent = 'Error importing data: ' + error.message;
                statusEl.className = 'import-status error';
            }
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
        const removedItem = this.items[index];
        
        // Add to history before removal
        this.addToHistory('item_removed', {
            itemName: removedItem.name,
            value: removedItem.value,
            tags: removedItem.tags,
            frequency: removedItem.frequency,
            itemIndex: index
        });
        
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

    calculateTotalAnnualExpenses() {
        let total = 0;
        
        // Convert all items to annual amounts based on frequency
        this.items.forEach(item => {
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
                    annualAmount = item.value; // yearly expenses added as full amount
                    break;
                default:
                    annualAmount = item.value * 12; // default to monthly
            }
            
            total += annualAmount;
        });
        
        return total;
    }

    calculateAnnualInvestment() {
        if (!this.investmentValue) return 0;
        
        let annualInvestment = 0;
        
        if (this.investmentType === 'percentage') {
            // Calculate percentage of max cash
            annualInvestment = (this.maxCash * this.investmentValue) / 100;
        } else {
            // Fixed amount - convert to annual based on frequency
            switch (this.investmentFrequency) {
                case 'monthly':
                    annualInvestment = this.investmentValue * 12;
                    break;
                case 'quarterly':
                    annualInvestment = this.investmentValue * 4;
                    break;
                case 'yearly':
                    annualInvestment = this.investmentValue;
                    break;
                default:
                    annualInvestment = this.investmentValue * 12;
            }
        }
        
        return annualInvestment;
    }

    // Currency conversion methods
    convertAmount(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return amount;
        
        // Convert to USD first (base currency), then to target currency
        const usdAmount = amount / this.conversionRates[fromCurrency];
        const convertedAmount = usdAmount * this.conversionRates[toCurrency];
        
        return convertedAmount;
    }

    changeCurrency(newCurrency) {
        const oldCurrency = this.currency;
        
        // Add to history
        this.addToHistory('currency_changed', {
            oldCurrency: oldCurrency,
            newCurrency: newCurrency,
            conversionRate: this.conversionRates[newCurrency] / this.conversionRates[oldCurrency]
        });
        
        // Convert maxCash
        if (this.maxCash > 0) {
            this.maxCash = this.convertAmount(this.maxCash, oldCurrency, newCurrency);
            document.getElementById('maxCash').value = this.maxCash.toFixed(2);
        }
        
        // Convert investment value if it's a fixed amount
        if (this.investmentType === 'amount' && this.investmentValue > 0) {
            this.investmentValue = this.convertAmount(this.investmentValue, oldCurrency, newCurrency);
            document.getElementById('investmentValue').value = this.investmentValue.toFixed(2);
        }
        
        // Convert all item values
        this.items.forEach(item => {
            item.value = this.convertAmount(item.value, oldCurrency, newCurrency);
        });
        
        // Update currency
        this.currency = newCurrency;
        
        // Update currency symbol display
        const currencySymbol = this.currencySymbols[newCurrency];
        document.getElementById('currencySymbol').textContent = currencySymbol;
        
        // Update investment unit symbol if it's amount type
        if (this.investmentType === 'amount') {
            document.getElementById('investmentUnit').textContent = currencySymbol;
        }
        
        // Re-render and update everything
        this.renderItems();
        this.updateCalculations();
        this.refreshDynamicCharts();
    }

    formatCurrency(amount, currency = this.currency) {
        const symbol = this.currencySymbols[currency];
        return `${symbol}${amount.toFixed(2)}`;
    }

    updateCalculations() {
        const totalMonthly = this.calculateTotalMonthlyExpenses();
        const totalAnnual = this.calculateTotalAnnualExpenses();
        const annualInvestment = this.calculateAnnualInvestment();
        const totalAllocated = totalAnnual + annualInvestment;
        const remaining = this.maxCash - totalAllocated;
        
        // Update indicators
        const availableAfterExpenses = Math.max(0, remaining);
        document.getElementById('dailyMax').textContent = this.formatCurrency(availableAfterExpenses / 365);
        document.getElementById('weeklyMax').textContent = this.formatCurrency(availableAfterExpenses / 52);
        document.getElementById('monthlyMax').textContent = this.formatCurrency(availableAfterExpenses / 12);
        document.getElementById('yearlyMax').textContent = this.formatCurrency(availableAfterExpenses);
        
        // Update summary
        document.getElementById('totalMonthly').textContent = this.formatCurrency(totalMonthly);
        document.getElementById('totalAnnual').textContent = this.formatCurrency(totalAnnual);
        document.getElementById('totalInvestment').textContent = this.formatCurrency(annualInvestment);
        document.getElementById('remainingBudget').textContent = this.formatCurrency(remaining);
        
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
                '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56',
                '#8DD17E', '#FF99C8', '#7DA3FF', '#FFC870', '#5AD1D1',
                '#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98', '#FFD700',
                '#00CED1', '#DC143C', '#20B2AA', '#FF7F50', '#B0E0E6',
                '#FF6347', '#40E0D0', '#E6E6FA', '#F08080', '#BDB76B',
                '#E0FFFF', '#FA8072', '#AFEEEE', '#FFE4E1', '#D3D3D3',
                // 20 more colors below
                '#A0522D', '#8B0000', '#FF4500', '#2E8B57', '#4682B4',
                '#DAA520', '#7CFC00', '#BA55D3', '#FF69B4', '#CD5C5C',
                '#1E90FF', '#32CD32', '#FFDAB9', '#8A2BE2', '#00FA9A',
                '#FF1493', '#00BFFF', '#ADFF2F', '#F5DEB3', '#FFDEAD'
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

        // Budget Allocation Chart
        const remainingCtx = document.getElementById('remainingChart').getContext('2d');
        this.charts.remaining = new Chart(remainingCtx, {
            type: 'bar',
            data: {
                labels: ['Expenses', 'Investment', 'Remaining'],
                datasets: [{
                    label: 'Annual Budget ($)',
                    data: [0, 0, 0],
                    backgroundColor: ['#FF6384', '#9966FF', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Budget Allocation'
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

        // Add investment to budget breakdown if it exists
        const annualInvestment = this.calculateAnnualInvestment();
        if (annualInvestment > 0) {
            labels.push('💹 Investment');
            data.push(annualInvestment);
        }
        
        this.charts.budget.data.labels = labels;
        this.charts.budget.data.datasets[0].data = data;
        this.charts.budget.update();
        
        // Update remaining chart to include investment
        const totalExpenses = this.calculateTotalAnnualExpenses();
        const totalAllocated = totalExpenses + annualInvestment;
        const remaining = Math.max(0, this.maxCash - totalAllocated);
        
        // Update chart to show expenses, investment, and remaining
        this.charts.remaining.data.labels = ['Expenses', 'Investment', 'Remaining'];
        this.charts.remaining.data.datasets[0].data = [totalExpenses, annualInvestment, remaining];
        this.charts.remaining.data.datasets[0].backgroundColor = ['#FF6384', '#9966FF', '#36A2EB'];
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
                <button type="button" class="remove-chart-btn btn btn-danger btn-sm" onclick="budgetTracker.removeDynamicChart('${key}')">×</button>
            </div>
            <div class="chart-content-row">
                <div class="chart-display">
                    <div class="chart-canvas-container">
                        <canvas></canvas>
                    </div>
                </div>
                <div class="chart-items-panel">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Items in this chart</h4>
                            <div class="chart-total-badge">
                                <span class="badge badge-primary">Total: <span id="chartTotal_${key}">$0.00</span></span>
                            </div>
                        </div>
                        <div class="card-body chart-items-scrollable">
                            <div class="items-list" id="chartItems_${key}">
                                <!-- Chart items will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
        
        // Update the items list
        this.updateChartItemsList(key, filtered, filterConfig);
        
        chart.update();
    }

    updateChartItemsList(key, filteredItems, filterConfig) {
        const itemsContainer = document.getElementById(`chartItems_${key}`);
        const totalContainer = document.getElementById(`chartTotal_${key}`);
        
        if (!itemsContainer || !totalContainer) return;
        
        if (filteredItems.length === 0) {
            itemsContainer.innerHTML = '<div class="empty-state">No items match the current filter.</div>';
            totalContainer.textContent = this.formatCurrency(0);
            return;
        }
        
        let totalValue = 0;
        const itemsHtml = filteredItems.map(item => {
            const convertedValue = this.convertToTargetFrequency(item, filterConfig);
            totalValue += convertedValue;
            
            return `
                <div class="card-item">
                    <div class="card-item-info">
                        <div class="card-item-name">${item.name}</div>
                        <div class="card-item-details">
                            <span class="card-item-value">${this.formatCurrency(convertedValue)}</span>
                            <span class="card-item-frequency">${item.frequency}</span>
                            <span class="card-item-tags">${item.tags && item.tags.length > 0 ? item.tags.join(', ') : 'No tags'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        itemsContainer.innerHTML = itemsHtml;
        totalContainer.textContent = this.formatCurrency(totalValue);
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

    // Change History Display Methods
    toggleHistory() {
        const container = document.getElementById('historyContainer');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            this.renderHistory();
        } else {
            container.style.display = 'none';
        }
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        const actionFilter = document.getElementById('historyActionFilter').value;
        
        if (!historyList) return;

        let filteredHistory = this.changeHistory;
        if (actionFilter) {
            filteredHistory = this.changeHistory.filter(entry => entry.action === actionFilter);
        }

        if (filteredHistory.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No history entries found.</div>';
            return;
        }

        historyList.innerHTML = filteredHistory
            .slice()
            .reverse() // Show most recent first
            .map((entry, index) => this.renderHistoryEntry(entry, filteredHistory.length - 1 - index))
            .join('');
    }

    renderHistoryEntry(entry, originalIndex) {
        const timestamp = new Date(entry.timestamp).toLocaleString();
        const actionText = this.getActionText(entry);
        const detailsText = this.getDetailsText(entry);
        
        return `
            <div class="card-item history-entry" data-index="${originalIndex}">
                <div class="card-item-info">
                    <div class="card-item-name history-action-type">${actionText}</div>
                    <div class="card-item-details">
                        <span class="history-timestamp">${timestamp}</span>
                        <span class="history-details">${detailsText}</span>
                        ${entry.comment ? `<span class="history-comment">💬 ${entry.comment}</span>` : ''}
                    </div>
                </div>
                <div class="card-item-actions">
                    <button class="btn btn-info btn-sm" onclick="budgetTracker.editComment(${originalIndex})">
                        ${entry.comment ? 'Edit' : 'Add'} Comment
                    </button>
                </div>
            </div>
        `;
    }

    getActionText(entry) {
        const actionMap = {
            'item_added': '➕ Item Added',
            'item_removed': '➖ Item Removed', 
            'item_edited': '✏️ Item Edited',
            'max_cash_updated': '💰 Budget Updated',
            'currency_changed': '💱 Currency Changed',
            'investment_type_changed': '📊 Investment Type Changed',
            'investment_value_changed': '📈 Investment Value Changed',
            'investment_frequency_changed': '⏰ Investment Frequency Changed',
            'feed_imported': '📥 Data Imported',
            'history_exported': '📤 History Exported',
            'history_imported': '📥 History Imported'
        };
        return actionMap[entry.action] || '🔄 Change Made';
    }

    getDetailsText(entry) {
        const { action, details, currency } = entry;
        const currencySymbol = this.currencySymbols[currency] || '$';

        switch (action) {
            case 'item_added':
                return `Added "${details.itemName}" - ${currencySymbol}${details.value} (${details.frequency})`;
            
            case 'item_removed':
                return `Removed "${details.itemName}" - ${currencySymbol}${details.value} (${details.frequency})`;
            
            case 'item_edited':
                return `Changed "${details.oldItem.name}" → "${details.newItem.name}" (${currencySymbol}${details.oldItem.value} → ${currencySymbol}${details.newItem.value})`;
            
            case 'max_cash_updated':
                return `Budget: ${currencySymbol}${details.oldValue.toLocaleString()} → ${currencySymbol}${details.newValue.toLocaleString()}`;
            
            case 'currency_changed':
                return `Currency: ${details.oldCurrency} → ${details.newCurrency} (rate: ${details.conversionRate.toFixed(4)})`;
            
            case 'investment_type_changed':
                return `Investment type: ${details.oldType} → ${details.newType}`;
            
            case 'investment_value_changed':
                const unit = details.type === 'percentage' ? '%' : currencySymbol;
                return `Investment value: ${unit}${details.oldValue} → ${unit}${details.newValue}`;
            
            case 'investment_frequency_changed':
                return `Investment frequency: ${details.oldFrequency} → ${details.newFrequency}`;
            
            case 'feed_imported':
                let text = `Imported ${details.itemsCount} items`;
                if (details.currency) text += `, currency: ${details.currency}`;
                if (details.maxCash) text += `, budget: ${currencySymbol}${details.maxCash.toLocaleString()}`;
                if (details.historyEntriesImported) text += `, ${details.historyEntriesImported} history entries`;
                return text;
            
            case 'history_exported':
                return `Exported ${details.entriesExported} history entries to file`;
            
            case 'history_imported':
                return `Imported ${details.entriesImported} history entries (${details.importMethod}), total: ${details.totalEntriesAfter}`;
            
            default:
                return 'Change made to budget';
        }
    }

    editComment(index) {
        const entry = this.changeHistory[index];
        if (!entry) return;

        const newComment = prompt('Enter comment for this change:', entry.comment || '');
        if (newComment !== null) { // User didn't cancel
            this.addHistoryComment(index, newComment);
            this.renderHistory();
        }
    }

    filterHistory() {
        this.renderHistory();
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all change history? This action cannot be undone.')) {
            this.changeHistory = [];
            this.saveData();
            this.renderHistory();
        }
    }

    exportHistory() {
        if (this.changeHistory.length === 0) {
            alert('No change history to export.');
            return;
        }

        // Create export data structure
        const exportData = {
            exportInfo: {
                exportedAt: new Date().toISOString(),
                totalEntries: this.changeHistory.length,
                exportType: 'change_history',
                appVersion: '1.0',
                currency: this.currency
            },
            changeHistory: this.changeHistory
        };

        // Create and download the file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `budget-history-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add to history
        this.addToHistory('history_exported', {
            entriesExported: this.changeHistory.length,
            exportTimestamp: exportData.exportInfo.exportedAt
        });

        alert(`Successfully exported ${this.changeHistory.length} history entries.`);
    }

    importHistory() {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importData = JSON.parse(event.target.result);
                    this.processHistoryImport(importData);
                } catch (error) {
                    alert('Error reading file: Invalid JSON format.');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

    processHistoryImport(importData) {
        // Validate import data structure
        if (!importData || typeof importData !== 'object') {
            alert('Invalid import file: Not a valid JSON object.');
            return;
        }

        let historyToImport = [];

        // Check if it's a dedicated history export
        if (importData.exportType === 'change_history' && Array.isArray(importData.changeHistory)) {
            historyToImport = importData.changeHistory;
        }
        // Check if it's a full budget export with history
        else if (Array.isArray(importData.changeHistory)) {
            historyToImport = importData.changeHistory;
        }
        // Check if it's just an array of history entries
        else if (Array.isArray(importData)) {
            historyToImport = importData;
        }
        else {
            alert('Invalid import file: No change history data found.');
            return;
        }

        // Validate history entries
        const validEntries = historyToImport.filter(entry => 
            entry && 
            typeof entry === 'object' && 
            entry.timestamp && 
            entry.action &&
            typeof entry.timestamp === 'string' &&
            typeof entry.action === 'string'
        );

        if (validEntries.length === 0) {
            alert('No valid history entries found in the import file.');
            return;
        }

        // Ask user how to handle the import
        const currentCount = this.changeHistory.length;
        const importCount = validEntries.length;
        
        const action = confirm(
            `Found ${importCount} valid history entries to import.\\n\\n` +
            `You currently have ${currentCount} history entries.\\n\\n` +
            `Click OK to MERGE with existing history.\\n` +
            `Click Cancel to REPLACE existing history.`
        );

        if (action) {
            // Merge histories
            const combinedHistory = [...this.changeHistory, ...validEntries];
            // Sort by timestamp and remove duplicates based on timestamp and action
            this.changeHistory = combinedHistory
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .filter((entry, index, arr) => {
                    // Simple duplicate detection based on timestamp and action
                    return index === arr.findIndex(e => 
                        e.timestamp === entry.timestamp && 
                        e.action === entry.action
                    );
                });
        } else {
            // Replace existing history
            this.changeHistory = [...validEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // Save and update UI
        this.saveData();
        this.renderHistory();

        // Add to history
        this.addToHistory('history_imported', {
            entriesImported: validEntries.length,
            importMethod: action ? 'merged' : 'replaced',
            totalEntriesAfter: this.changeHistory.length
        });

        alert(`Successfully imported ${validEntries.length} history entries. Total entries: ${this.changeHistory.length}`);
    }

    // Export complete budget data including settings, items, and history
    exportCompleteData() {
        try {
            // Create a comprehensive export with metadata
            const exportData = {
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    exportVersion: "1.0",
                    exportedFrom: "Budget Planner",
                    description: "Complete budget data export including settings, items, and change history"
                },
                settings: {
                    maxCash: this.maxCash,
                    currency: this.currency,
                    investment: {
                        type: this.investmentType,
                        value: this.investmentValue,
                        frequency: this.investmentFrequency
                    }
                },
                items: this.items.map(item => ({
                    name: item.name,
                    value: item.value,
                    frequency: item.frequency,
                    tags: item.tags || []
                })),
                changeHistory: this.changeHistory.map(entry => ({
                    timestamp: entry.timestamp,
                    action: entry.action,
                    details: entry.details || {},
                    comment: entry.comment || '',
                    currency: entry.currency || this.currency
                }))
            };

            // Create and download the file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD format
            link.download = `budget-complete-${dateStr}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success message (temporary visual feedback)
            const originalTitle = document.querySelector('header h1').textContent;
            document.querySelector('header h1').textContent = `✅ Exported budget-complete-${dateStr}.json`;
            setTimeout(() => {
                document.querySelector('header h1').textContent = originalTitle;
            }, 3000);
            
            console.log('Complete budget data exported:', {
                items: exportData.items.length,
                historyEntries: exportData.changeHistory.length,
                settings: exportData.settings
            });
            
        } catch (error) {
            console.error('Error exporting complete data:', error);
            alert('Error exporting budget data. Please try again.');
        }
    }

    // Help popup functionality
    showHelpPopup() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Add click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeHelpPopup();
                }
            });
            
            // Add escape key to close
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    this.closeHelpPopup();
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('keydown', escapeHandler);
        }
    }

    closeHelpPopup() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Global functions for HTML onclick events
function addItem() {
    budgetTracker.addItem();
}

function showHelp() {
    budgetTracker.showHelpPopup();
}

function closeHelp() {
    budgetTracker.closeHelpPopup();
}

function exportCompleteData() {
    budgetTracker.exportCompleteData();
}

// Initialize the budget tracker when the page loads
let budgetTracker;
document.addEventListener('DOMContentLoaded', () => {
    budgetTracker = new BudgetTracker();
});

