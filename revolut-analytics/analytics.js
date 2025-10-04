// Analytics Dashboard JavaScript
class RevolutAnalytics {
    constructor() {
        this.transactions = [];
        this.filteredTransactions = [];
        this.charts = {};
        this.currentSort = { column: null, direction: 'asc' };
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        // Default exclusion patterns
        this.defaultExclusions = [
            'savings vault topup',
            'to flexible cash funds',
            'Transfer from',
            'To pocket',
            'Pocket Withdrawal',
            'Exchanged to'
        ];
        this.exclusionPatterns = [...this.defaultExclusions];
        
        // Description chart filters
        this.descriptionFilters = {
            type: 'expenses', // all, expenses, income - default to expenses for spending analysis
            limit: 20,   // number or 'all'
            sort: 'value' // value, count
        };
        
        // LocalStorage keys
        this.STORAGE_KEYS = {
            TRANSACTIONS: 'revolut_transactions',
            EXCLUSIONS: 'revolut_exclusions',
            SETTINGS: 'revolut_settings'
        };
    }
    
    async init() {
        console.log('RevolutAnalytics init() called');
        // DOM is guaranteed to be ready since we're called from DOMContentLoaded
        this.loadStateFromStorage();
        this.setupEventListeners();
        this.setupDefaultExclusions();
        
        // If we have stored transactions, process them
        if (this.transactions.length > 0) {
            console.log(`Processing ${this.transactions.length} stored transactions`);
            this.processData();
        } else {
            console.log('No stored transactions found');
        }
    }
    
    // State Management Methods
    saveTransactionsToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
            console.log(`Saved ${this.transactions.length} transactions to localStorage`);
        } catch (error) {
            console.warn('Failed to save transactions to localStorage:', error);
            this.showNotification('Warning: Could not save data locally', 'warning');
        }
    }
    
    saveExclusionsToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEYS.EXCLUSIONS, JSON.stringify(this.exclusionPatterns));
            console.log('Saved exclusion patterns to localStorage');
        } catch (error) {
            console.warn('Failed to save exclusions to localStorage:', error);
        }
    }
    
    saveSettingsToStorage() {
        try {
            const settings = {
                currentSort: this.currentSort,
                sortColumn: this.sortColumn,
                sortDirection: this.sortDirection,
                itemsPerPage: this.itemsPerPage,
                currentPage: this.currentPage
            };
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }
    
    loadStateFromStorage() {
        try {
            // Load transactions
            const storedTransactions = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
            if (storedTransactions) {
                this.transactions = JSON.parse(storedTransactions);
                
                // Reconstruct Date objects that were serialized as strings
                this.transactions.forEach(transaction => {
                    if (transaction['Started Date'] && typeof transaction['Started Date'] === 'string') {
                        transaction['Started Date'] = new Date(transaction['Started Date']);
                    }
                    if (transaction['Completed Date'] && typeof transaction['Completed Date'] === 'string') {
                        transaction['Completed Date'] = new Date(transaction['Completed Date']);
                    }
                });
                
                console.log(`Loaded ${this.transactions.length} transactions from localStorage`);
            }
            
            // Load exclusions
            const storedExclusions = localStorage.getItem(this.STORAGE_KEYS.EXCLUSIONS);
            if (storedExclusions) {
                this.exclusionPatterns = JSON.parse(storedExclusions);
                console.log('Loaded exclusion patterns from localStorage');
            }
            
            // Load settings
            const storedSettings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (storedSettings) {
                const settings = JSON.parse(storedSettings);
                this.currentSort = settings.currentSort || this.currentSort;
                this.sortColumn = settings.sortColumn || this.sortColumn;
                this.sortDirection = settings.sortDirection || this.sortDirection;
                this.itemsPerPage = settings.itemsPerPage || this.itemsPerPage;
                this.currentPage = settings.currentPage || this.currentPage;
                console.log('Loaded settings from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }
    
    clearStoredData() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS);
            localStorage.removeItem(this.STORAGE_KEYS.EXCLUSIONS);
            localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
            console.log('Cleared all stored data');
            this.showNotification('Stored data cleared successfully', 'success');
        } catch (error) {
            console.warn('Failed to clear stored data:', error);
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system - could be enhanced with design system components
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: var(--spacing-3) var(--spacing-4);
            border-radius: var(--border-radius-md);
            background: var(--color-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'});
            color: white;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    setupDefaultExclusions() {
        const textarea = document.getElementById('exclusionList');
        const patternsToShow = this.exclusionPatterns.length > 0 ? this.exclusionPatterns : this.defaultExclusions;
        
        if (textarea) {
            textarea.value = patternsToShow.join('\n');
        } else {
            // Retry after a short delay if element isn't ready yet
            setTimeout(() => {
                const retryTextarea = document.getElementById('exclusionList');
                if (retryTextarea) {
                    retryTextarea.value = patternsToShow.join('\n');
                }
            }, 100);
        }
    }
    
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }
    
    async loadSampleData() {
        try {
            const response = await fetch('../sample-transactions.csv');
            const csvText = await response.text();
            this.transactions = this.parseCSV(csvText);
            this.saveTransactionsToStorage();
            this.processData();
        } catch (error) {
            console.error('Error loading sample transactions:', error);
            // Fallback to hardcoded sample data if CSV fails to load
            this.transactions = this.getSampleData();
            this.saveTransactionsToStorage();
            this.processData();
        }
    }
    
    processData() {
        this.applyExclusionFilters();
        this.populateFilterOptions();
        this.createCharts();
        this.updateAnalytics();
        this.renderTable();
        this.updateExclusionStatus();
    }
    
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const transactions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const transaction = {};
                headers.forEach((header, index) => {
                    transaction[header.trim()] = values[index].trim();
                });
                
                // Convert and format data
                transaction.Amount = parseFloat(transaction.Amount) || 0;
                transaction.Fee = parseFloat(transaction.Fee) || 0;
                transaction.Balance = parseFloat(transaction.Balance) || 0;
                transaction['Started Date'] = new Date(transaction['Started Date']);
                transaction['Completed Date'] = new Date(transaction['Completed Date']);
                
                transactions.push(transaction);
            }
        }
        
        return transactions;
    }
    
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }
    
    getSampleData() {
        // Fallback sample data
        return [
            {
                Type: 'Card Payment',
                Product: 'Current',
                'Started Date': new Date('2024-01-15'),
                'Completed Date': new Date('2024-01-15'),
                Description: 'Grocery Shopping',
                Amount: -45.50,
                Fee: 0.00,
                Currency: 'USD',
                State: 'Completed',
                Balance: 1254.50
            }
        ];
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners');
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTransactions();
            });
        }
        
        // Filter controls
        const filters = ['typeFilter', 'productFilter', 'stateFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterTransactions());
            }
        });
        
        // Table sorting
        const headers = document.querySelectorAll('.data-table th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                this.sortTable(column);
            });
        });
        
        // Analytics filters
        const analyticsFilters = ['dateRange', 'amountRange'];
        analyticsFilters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.updateAdvancedAnalytics());
            }
        });
        
        // File upload handling - automatically process when file is selected
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    console.log('File selected, automatically processing...');
                    this.showLoading();
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
        
        // Sample data button
        const loadSampleBtn = document.getElementById('loadSampleData');
        if (loadSampleBtn) {
            loadSampleBtn.addEventListener('click', () => {
                console.log('Loading sample data...');
                this.showLoading();
                this.loadSampleData().then(() => {
                    this.hideLoading();
                    console.log('Sample data loaded');
                });
            });
        }
        
        // Clear data button
        const clearDataBtn = document.getElementById('clearData');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
        
        // Exclusion controls
        console.log('Setting up exclusion controls');
        const applyExclusionsBtn = document.getElementById('applyExclusions');
        if (applyExclusionsBtn) {
            console.log('Apply exclusions button found, adding click listener');
            applyExclusionsBtn.addEventListener('click', () => {
                console.log('Apply exclusions clicked!');
                this.updateExclusionPatterns();
            });
        } else {
            console.error('Apply Exclusions button not found');
        }
        
        const resetExclusionsBtn = document.getElementById('resetExclusions');
        if (resetExclusionsBtn) {
            console.log('Reset exclusions button found, adding click listener');
            resetExclusionsBtn.addEventListener('click', () => {
                console.log('Reset exclusions clicked!');
                this.resetExclusionPatterns();
            });
        } else {
            console.error('Reset exclusions button not found');
        }
        
        const clearExclusionsBtn = document.getElementById('clearExclusions');
        if (clearExclusionsBtn) {
            console.log('Clear exclusions button found, adding click listener');
            clearExclusionsBtn.addEventListener('click', () => {
                console.log('Clear exclusions clicked!');
                this.clearExclusionPatterns();
            });
        } else {
            console.error('Clear exclusions button not found');
        }
        
        // Modal controls
        const openModalBtn = document.getElementById('openExclusionModal');
        const closeModalBtn = document.getElementById('closeExclusionModal');
        const modal = document.getElementById('exclusionModal');
        
        if (openModalBtn && modal) {
            openModalBtn.addEventListener('click', () => {
                console.log('Opening exclusion modal');
                modal.classList.add('show');
            });
        }
        
        if (closeModalBtn && modal) {
            closeModalBtn.addEventListener('click', () => {
                console.log('Closing exclusion modal');
                modal.classList.remove('show');
            });
        }
        
        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });

        // Description chart filter event listeners
        const descriptionFilterType = document.getElementById('descriptionFilter');
        if (descriptionFilterType) {
            descriptionFilterType.addEventListener('change', (e) => {
                this.descriptionFilters.type = e.target.value;
                this.updateDescriptionChart();
            });
        }

        const descriptionFilterLimit = document.getElementById('descriptionLimit');
        if (descriptionFilterLimit) {
            descriptionFilterLimit.addEventListener('change', (e) => {
                this.descriptionFilters.limit = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                this.updateDescriptionChart();
            });
        }

        const descriptionFilterSort = document.getElementById('descriptionSort');
        if (descriptionFilterSort) {
            descriptionFilterSort.addEventListener('change', (e) => {
                this.descriptionFilters.sort = e.target.value;
                this.updateDescriptionChart();
            });
        }

        // Theme toggle event listener
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.transactions = this.parseCSV(csvText);
                this.saveTransactionsToStorage();
                this.processData();
                this.hideLoading();
                console.log('File processed successfully');
            } catch (error) {
                console.error('Error parsing CSV file:', error);
                alert('Error parsing CSV file. Please check the format.');
                this.hideLoading();
            }
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            alert('Error reading file');
            this.hideLoading();
        };
        
        reader.readAsText(file);
    }
    
    clearAllData() {
        this.transactions = [];
        this.filteredTransactions = [];
        this.clearStoredData();
        this.clearCharts();
        this.renderTable();
        this.updateAnalytics();
        
        // Clear file input
        document.getElementById('csvFile').value = '';
        
        // Reset exclusions to defaults
        this.exclusionPatterns = [...this.defaultExclusions];
        this.setupDefaultExclusions();
    }
    
    clearCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
    
    updateExclusionPatterns() {
        const textarea = document.getElementById('exclusionList');
        if (!textarea) {
            console.error('Exclusion textarea not found');
            return;
        }
        
        const patterns = textarea.value
            .split('\n')
            .map(pattern => pattern.trim())
            .filter(pattern => pattern.length > 0);
        
        console.log('Updating exclusion patterns:', patterns);
        this.exclusionPatterns = patterns;
        this.saveExclusionsToStorage();
        this.processData();
        
        // Close modal after applying
        const modal = document.getElementById('exclusionModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    resetExclusionPatterns() {
        console.log('Resetting exclusion patterns to defaults:', this.defaultExclusions);
        this.exclusionPatterns = [...this.defaultExclusions];
        const textarea = document.getElementById('exclusionList');
        if (textarea) {
            textarea.value = this.defaultExclusions.join('\n');
        }
        this.saveExclusionsToStorage();
        this.processData();
        
        // Close modal after resetting
        const modal = document.getElementById('exclusionModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    clearExclusionPatterns() {
        console.log('Clearing exclusion patterns');
        this.exclusionPatterns = [];
        const textarea = document.getElementById('exclusionList');
        if (textarea) {
            textarea.value = '';
        }
        this.processData();
        
        // Close modal after clearing
        const modal = document.getElementById('exclusionModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    applyExclusionFilters() {
        console.log(`Applying exclusion filters to ${this.transactions.length} transactions with ${this.exclusionPatterns.length} patterns`);
        
        if (this.exclusionPatterns.length === 0) {
            this.filteredTransactions = [...this.transactions];
            console.log(`No exclusions, filtered transactions: ${this.filteredTransactions.length}`);
            return;
        }
        
        this.filteredTransactions = this.transactions.filter(transaction => {
            // Check all text fields for exclusion patterns
            const textFields = [
                transaction.Type || '',
                transaction.Product || '',
                transaction.Description || '',
                transaction.State || ''
            ];
            
            const transactionText = textFields.join(' ').toUpperCase();
            
            // Return false (exclude) if any exclusion pattern is found
            return !this.exclusionPatterns.some(pattern => 
                transactionText.includes(pattern.toUpperCase())
            );
        });
        
        console.log(`After filtering: ${this.filteredTransactions.length} transactions remain`);
    }
    
    updateExclusionStatus() {
        const statusElement = document.getElementById('exclusionStatus');
        if (!statusElement) {
            console.error('Exclusion status element not found');
            return;
        }
        
        const totalCount = this.transactions.length;
        const filteredCount = this.filteredTransactions.length;
        const excludedCount = totalCount - filteredCount;
        
        console.log(`Status update: ${excludedCount} excluded from ${totalCount} total, patterns:`, this.exclusionPatterns);
        
        if (excludedCount > 0) {
            statusElement.innerHTML = `
                <span style="color: var(--color-warning-dark);">
                    ⚠️ ${excludedCount} transaction(s) excluded from ${totalCount} total
                </span>
            `;
        } else if (this.exclusionPatterns.length > 0) {
            statusElement.innerHTML = `
                <span style="color: var(--color-success-dark);">
                    ✓ No transactions excluded (${totalCount} total shown)
                </span>
            `;
        } else {
            statusElement.innerHTML = `
                <span style="color: var(--color-text-secondary);">
                    All ${totalCount} transactions shown (no exclusions active)
                </span>
            `;
        }
    }
    
    populateFilterOptions() {
        const types = [...new Set(this.filteredTransactions.map(t => t.Type))];
        const products = [...new Set(this.filteredTransactions.map(t => t.Product))];
        const states = [...new Set(this.filteredTransactions.map(t => t.State))];

        this.populateSelect('typeFilter', types);
        this.populateSelect('productFilter', products);
        this.populateSelect('stateFilter', states);
    }    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }
    
    createCharts() {
        // Clear existing charts first
        this.clearCharts();
        
        if (this.filteredTransactions.length > 0) {
            this.createTypeChart();
            this.createProductChart();
            this.createDescriptionChart();
        }
    }
    
    createTypeChart() {
        const ctx = document.getElementById('typeChart').getContext('2d');
        const typeData = this.getChartData('Type');
        
        this.charts.typeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: typeData.labels,
                datasets: [{
                    data: typeData.values,
                    backgroundColor: this.getThemeColors().pieColors,
                    borderWidth: 2,
                    borderColor: this.getThemeColors().borderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: this.getThemeColors().textColor
                        }
                    },
                    tooltip: {
                        titleColor: this.getThemeColors().textColor,
                        bodyColor: this.getThemeColors().textColor,
                        backgroundColor: document.documentElement.getAttribute('ds-theme') === 'dark' ? '#374151' : '#ffffff',
                        borderColor: this.getThemeColors().borderColor,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    createProductChart() {
        const ctx = document.getElementById('productChart').getContext('2d');
        const productData = this.getChartData('Product');
        
        this.charts.productChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: productData.labels,
                datasets: [{
                    data: productData.values,
                    backgroundColor: this.getThemeColors().pieColors.slice(0, 5),
                    borderWidth: 2,
                    borderColor: this.getThemeColors().borderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: this.getThemeColors().textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    createDescriptionChart() {
        const ctx = document.getElementById('descriptionChart').getContext('2d');
        const descriptionData = this.getDescriptionData();
        
        const chartLabel = this.descriptionFilters.sort === 'count' ? 'Transaction Count' : 'Transaction Value';
        
        this.charts.descriptionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: descriptionData.labels,
                datasets: [{
                    label: chartLabel,
                    data: descriptionData.values,
                    backgroundColor: this.getThemeColors().barColor.background,
                    borderColor: this.getThemeColors().barColor.border,
                    borderWidth: 1,
                    hoverBackgroundColor: this.getThemeColors().barColor.hover,
                    hoverBorderColor: this.getThemeColors().barColor.hoverBorder
                }]
            },
            options: {
                indexAxis: 'y', // This makes it horizontal
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: this.descriptionFilters.sort === 'count' ? 'Number of Transactions' : 'Transaction Value',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor,
                            callback: function(value) {
                                return this.descriptionFilters.sort === 'count' ? Math.round(value) : value.toFixed(2);
                            }.bind(this)
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Transaction Description',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x;
                                if (this.descriptionFilters.sort === 'count') {
                                    return `Count: ${value} transaction${value !== 1 ? 's' : ''}`;
                                } else {
                                    return `Total: ${value.toFixed(2)}`;
                                }
                            }.bind(this)
                        }
                    }
                }
            }
        });
    }
    
    updateDescriptionChart() {
        if (this.charts.descriptionChart) {
            this.charts.descriptionChart.destroy();
        }
        this.createDescriptionChart();
    }
    
    getChartData(field) {
        const counts = {};
        // Filter to only include spending (negative amounts)
        const spendingTransactions = this.filteredTransactions.filter(transaction => transaction.Amount < 0);
        
        spendingTransactions.forEach(transaction => {
            const value = transaction[field];
            counts[value] = (counts[value] || 0) + 1;
        });
        
        return {
            labels: Object.keys(counts),
            values: Object.values(counts)
        };
    }
    
    getDescriptionData() {
        const descriptions = {};
        const counts = {}; // For count-based sorting
        
        // Filter transactions based on selected type
        let dataTransactions = this.filteredTransactions;
        if (this.descriptionFilters.type === 'expenses') {
            dataTransactions = this.filteredTransactions.filter(t => t.Amount < 0);
        } else if (this.descriptionFilters.type === 'income') {
            dataTransactions = this.filteredTransactions.filter(t => t.Amount > 0);
        }
        
        dataTransactions.forEach(transaction => {
            let description = transaction.Description || 'Unknown';
            
            // Trim and clean up description - allow longer text for bar chart
            description = description.trim();
            if (description.length > 40) {
                description = description.substring(0, 40) + '...';
            }
            
            // Track both values and counts
            const amount = Math.abs(transaction.Amount || 0);
            descriptions[description] = (descriptions[description] || 0) + amount;
            counts[description] = (counts[description] || 0) + 1;
        });
        
        // Sort by selected criteria
        let sortedEntries;
        if (this.descriptionFilters.sort === 'count') {
            sortedEntries = Object.entries(counts)
                .sort(([,a], [,b]) => b - a)
                .map(([desc]) => [desc, descriptions[desc]]);
        } else {
            sortedEntries = Object.entries(descriptions)
                .sort(([,a], [,b]) => b - a);
        }
        
        // Apply limit
        if (this.descriptionFilters.limit !== 'all') {
            sortedEntries = sortedEntries.slice(0, this.descriptionFilters.limit);
        }
        
        return {
            labels: sortedEntries.map(([desc]) => desc),
            values: this.descriptionFilters.sort === 'count' 
                ? sortedEntries.map(([desc]) => counts[desc])
                : sortedEntries.map(([, amount]) => amount)
        };
    }
    
    updateAnalytics() {
        const totalTransactions = this.filteredTransactions.length;
        const totalSpent = this.filteredTransactions
            .filter(t => t.Amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.Amount), 0);
        const totalIncome = this.filteredTransactions
            .filter(t => t.Amount > 0)
            .reduce((sum, t) => sum + t.Amount, 0);
        const currentBalance = this.transactions.length > 0 ? 
            this.transactions[this.transactions.length - 1].Balance : 0;
        
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('totalSpent').textContent = `${totalSpent.toFixed(2)}`;
        document.getElementById('totalIncome').textContent = `${totalIncome.toFixed(2)}`;
        document.getElementById('currentBalance').textContent = `${currentBalance.toFixed(2)}`;
        
        this.updateAdvancedAnalytics();
        this.updateAdvancedFinancialAnalytics();
    }
    
    updateAdvancedAnalytics() {
        let cardPayments = this.filteredTransactions.filter(t => t.Type === 'Card Payment' && t.Amount < 0);
        
        // Apply date filter
        const dateRange = document.getElementById('dateRange').value;
        if (dateRange !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            if (dateRange === 'week') {
                filterDate.setDate(now.getDate() - 7);
            } else if (dateRange === 'month') {
                filterDate.setMonth(now.getMonth() - 1);
            }
            
            cardPayments = cardPayments.filter(t => t['Completed Date'] >= filterDate);
        }
        
        // Apply amount filter
        const amountRange = document.getElementById('amountRange').value;
        if (amountRange !== 'all') {
            if (amountRange === 'small') {
                cardPayments = cardPayments.filter(t => Math.abs(t.Amount) < 25);
            } else if (amountRange === 'medium') {
                cardPayments = cardPayments.filter(t => Math.abs(t.Amount) >= 25 && Math.abs(t.Amount) <= 100);
            } else if (amountRange === 'large') {
                cardPayments = cardPayments.filter(t => Math.abs(t.Amount) > 100);
            }
        }
        
        const avgTransaction = cardPayments.length > 0 ? 
            cardPayments.reduce((sum, t) => sum + Math.abs(t.Amount), 0) / cardPayments.length : 0;
        
        const categoryGroups = {};
        cardPayments.forEach(t => {
            const description = t.Description.toLowerCase();
            let category = 'Other';
            
            if (description.includes('grocery') || description.includes('food')) {
                category = 'Groceries';
            } else if (description.includes('restaurant') || description.includes('coffee') || description.includes('dining')) {
                category = 'Dining';
            } else if (description.includes('gas') || description.includes('fuel')) {
                category = 'Transportation';
            } else if (description.includes('shopping') || description.includes('clothing')) {
                category = 'Shopping';
            }
            
            categoryGroups[category] = (categoryGroups[category] || 0) + 1;
        });
        
        const topCategory = Object.keys(categoryGroups).length > 0 ? 
            Object.keys(categoryGroups).reduce((a, b) => categoryGroups[a] > categoryGroups[b] ? a : b) : 'None';
        
        const largestPurchase = cardPayments.length > 0 ? 
            Math.max(...cardPayments.map(t => Math.abs(t.Amount))) : 0;
        
                const totalFees = this.filteredTransactions.reduce((sum, t) => sum + t.Fee, 0);
        
        document.getElementById('avgTransaction').textContent = `${avgTransaction.toFixed(2)}`;
        document.getElementById('topCategory').textContent = topCategory;
        document.getElementById('largestPurchase').textContent = `${largestPurchase.toFixed(2)}`;
        document.getElementById('totalFees').textContent = `${totalFees.toFixed(2)}`;
    }
    
    filterTransactions() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const productFilter = document.getElementById('productFilter').value;
        const stateFilter = document.getElementById('stateFilter').value;
        
        this.filteredTransactions = this.transactions.filter(transaction => {
            const matchesSearch = !searchTerm || 
                transaction.Description.toLowerCase().includes(searchTerm) ||
                transaction.Type.toLowerCase().includes(searchTerm) ||
                transaction.Product.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeFilter || transaction.Type === typeFilter;
            const matchesProduct = !productFilter || transaction.Product === productFilter;
            const matchesState = !stateFilter || transaction.State === stateFilter;
            
            return matchesSearch && matchesType && matchesProduct && matchesState;
        });
        
        this.currentPage = 1;
        this.renderTable();
    }
    
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        // Save state
        this.saveSettingsToStorage();
        
        this.filteredTransactions.sort((a, b) => {
            let aVal = a[this.getColumnKey(column)];
            let bVal = b[this.getColumnKey(column)];
            
            // Handle different data types
            if (column === 'amount' || column === 'fee' || column === 'balance') {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
            } else if (column === 'date') {
                aVal = a['Completed Date'];
                bVal = b['Completed Date'];
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.updateSortHeaders();
        this.renderTable();
    }
    
    getColumnKey(column) {
        const columnMap = {
            'type': 'Type',
            'product': 'Product',
            'date': 'Completed Date',
            'description': 'Description',
            'amount': 'Amount',
            'fee': 'Fee',
            'state': 'State',
            'balance': 'Balance'
        };
        return columnMap[column] || column;
    }
    
    updateSortHeaders() {
        const headers = document.querySelectorAll('.data-table th[data-sort]');
        headers.forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (header.dataset.sort === this.sortColumn) {
                header.classList.add(`sorted-${this.sortDirection}`);
            }
        });
    }
    
    renderTable() {
        const tbody = document.getElementById('transactionsBody');
        if (!tbody) {
            console.warn('Table body element not found, retrying in 100ms');
            setTimeout(() => this.renderTable(), 100);
            return;
        }
        
        console.log(`Rendering table with ${this.filteredTransactions.length} filtered transactions`);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        
        pageTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            const formatAmount = (amount) => {
                const amountClass = amount >= 0 ? 'amount-positive' : 'amount-negative';
                return `<span class="${amountClass}">${Math.abs(amount).toFixed(2)}</span>`;
            };
            
            const formatDate = (date) => {
                return date.toLocaleDateString();
            };
            
            const formatState = (state) => {
                const stateClass = state.toLowerCase() === 'completed' ? 'state-completed' : 'state-failed';
                return `<span class="${stateClass}">${state}</span>`;
            };
            
            row.innerHTML = `
                <td>${transaction.Type}</td>
                <td>${transaction.Product}</td>
                <td>${formatDate(transaction['Completed Date'])}</td>
                <td>${transaction.Description}</td>
                <td>${formatAmount(transaction.Amount)}</td>
                <td>${transaction.Fee.toFixed(2)}</td>
                <td>${formatState(transaction.State)}</td>
                <td>${transaction.Balance.toFixed(2)}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        this.renderPagination();
    }
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `<button ${this.currentPage === 1 ? 'disabled' : ''} onclick="analytics.goToPage(${this.currentPage - 1})">Previous</button>`;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button onclick="analytics.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="analytics.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="page-info">...</span>`;
            }
            paginationHTML += `<button onclick="analytics.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        paginationHTML += `<button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="analytics.goToPage(${this.currentPage + 1})">Next</button>`;
        
        // Page info
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
        paginationHTML += `<span class="page-info">Showing ${startItem}-${endItem} of ${this.filteredTransactions.length}</span>`;
        
        pagination.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.saveSettingsToStorage();
            this.renderTable();
        }
    }

    // Theme Management - using global theme approach

    getThemeColors() {
        // Multiple ways to detect dark theme to ensure it works
        const isDark = document.documentElement.getAttribute('ds-theme') === 'dark' || 
                      document.documentElement.classList.contains('dark') ||
                      document.body.getAttribute('ds-theme') === 'dark';
        
        console.log('Theme detection:', { isDark, attribute: document.documentElement.getAttribute('ds-theme') });
        
        return {
            borderColor: isDark ? '#334155' : '#fff',
            textColor: isDark ? '#ffffff' : '#374151',
            gridColor: isDark ? '#4b5563' : '#e5e7eb',
            pieColors: [
                '#FF6384',
                '#36A2EB', 
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6B6B',
                '#4ECDC4'
            ],
            barColor: {
                background: '#36A2EB',
                border: '#1E88E5',
                hover: '#42A5F5',
                hoverBorder: '#1976D2'
            }
        };
    }

    // Advanced Financial Analytics Functions
    updateAdvancedFinancialAnalytics() {
        this.calculateVolatilityRisk();
        this.calculateDrawdownRisk();
        this.analyzeTrends();
        this.detectAnomalies();
        this.generateInsights();
        this.createAdvancedCharts();
        this.analyzeCategoryRisks();
    }

    calculateVolatilityRisk() {
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        if (expenses.length < 7) {
            document.getElementById('volatilityScore').textContent = 'N/A';
            document.getElementById('volatilityStatus').textContent = 'Need more data';
            return;
        }

        // Group by day and calculate daily spending
        const dailySpending = {};
        expenses.forEach(t => {
            const date = new Date(t['Completed Date']).toDateString();
            dailySpending[date] = (dailySpending[date] || 0) + Math.abs(t.Amount);
        });

        const amounts = Object.values(dailySpending);
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const volatility = (stdDev / mean) * 100;

        document.getElementById('volatilityScore').textContent = `${volatility.toFixed(1)}%`;
        
        const riskElement = document.getElementById('volatilityRisk');
        const statusElement = document.getElementById('volatilityStatus');
        
        if (volatility < 30) {
            riskElement.className = 'card-summary risk-indicator low-risk';
            statusElement.textContent = 'Low Risk - Stable spending';
        } else if (volatility < 60) {
            riskElement.className = 'card-summary risk-indicator medium-risk';
            statusElement.textContent = 'Medium Risk - Some variability';
        } else {
            riskElement.className = 'card-summary risk-indicator high-risk';
            statusElement.textContent = 'High Risk - Very volatile spending';
        }
    }

    calculateDrawdownRisk() {
        if (this.transactions.length < 30) {
            document.getElementById('drawdownScore').textContent = 'N/A';
            document.getElementById('drawdownStatus').textContent = 'Need more history';
            return;
        }

        // Calculate running balance changes
        let maxBalance = this.transactions[0].Balance;
        let maxDrawdown = 0;
        
        this.transactions.forEach(t => {
            if (t.Balance > maxBalance) {
                maxBalance = t.Balance;
            }
            const drawdown = ((maxBalance - t.Balance) / maxBalance) * 100;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        });

        document.getElementById('drawdownScore').textContent = `${maxDrawdown.toFixed(1)}%`;
        
        const riskElement = document.getElementById('drawdownRisk');
        const statusElement = document.getElementById('drawdownStatus');
        
        if (maxDrawdown < 20) {
            riskElement.className = 'card-summary risk-indicator low-risk';
            statusElement.textContent = 'Low Risk - Stable balance';
        } else if (maxDrawdown < 40) {
            riskElement.className = 'card-summary risk-indicator medium-risk';
            statusElement.textContent = 'Medium Risk - Some depletion';
        } else {
            riskElement.className = 'card-summary risk-indicator high-risk';
            statusElement.textContent = 'High Risk - Significant drawdowns';
        }
    }

    analyzeTrends() {
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        if (expenses.length < 10) {
            document.getElementById('trendDirection').textContent = '?';
            document.getElementById('trendStatus').textContent = 'Insufficient data';
            return;
        }

        // Calculate weekly spending trend
        const weeklyData = {};
        expenses.forEach(t => {
            const date = new Date(t['Completed Date']);
            const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekKey = weekStart.toDateString();
            weeklyData[weekKey] = (weeklyData[weekKey] || 0) + Math.abs(t.Amount);
        });

        const weeks = Object.keys(weeklyData).sort();
        if (weeks.length < 3) {
            document.getElementById('trendDirection').textContent = '→';
            document.getElementById('trendStatus').textContent = 'Stable trend';
            return;
        }

        const firstWeek = weeklyData[weeks[0]];
        const lastWeek = weeklyData[weeks[weeks.length - 1]];
        const trendPercent = ((lastWeek - firstWeek) / firstWeek) * 100;

        const riskElement = document.getElementById('trendRisk');
        const statusElement = document.getElementById('trendStatus');
        
        if (trendPercent > 15) {
            document.getElementById('trendDirection').textContent = '📈';
            riskElement.className = 'card-summary risk-indicator high-risk';
            statusElement.textContent = `Spending up ${trendPercent.toFixed(1)}%`;
        } else if (trendPercent < -15) {
            document.getElementById('trendDirection').textContent = '📉';
            riskElement.className = 'card-summary risk-indicator low-risk';
            statusElement.textContent = `Spending down ${Math.abs(trendPercent).toFixed(1)}%`;
        } else {
            document.getElementById('trendDirection').textContent = '→';
            riskElement.className = 'card-summary risk-indicator medium-risk';
            statusElement.textContent = 'Stable trend';
        }
    }

    detectAnomalies() {
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        if (expenses.length < 10) {
            document.getElementById('anomaliesCount').textContent = '0';
            document.getElementById('anomalyStatus').textContent = 'Need more data';
            return;
        }

        const amounts = expenses.map(t => Math.abs(t.Amount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
        
        // Detect outliers (>2 standard deviations from mean)
        const anomalies = expenses.filter(t => Math.abs(t.Amount) > mean + (2 * stdDev));
        
        document.getElementById('anomaliesCount').textContent = anomalies.length;
        
        const riskElement = document.getElementById('anomalyRisk');
        const statusElement = document.getElementById('anomalyStatus');
        
        if (anomalies.length === 0) {
            riskElement.className = 'card-summary risk-indicator low-risk';
            statusElement.textContent = 'No unusual transactions';
        } else if (anomalies.length <= 3) {
            riskElement.className = 'card-summary risk-indicator medium-risk';
            statusElement.textContent = 'Some large transactions';
        } else {
            riskElement.className = 'card-summary risk-indicator high-risk';
            statusElement.textContent = 'Many unusual transactions';
        }
    }

    generateInsights() {
        const insights = [];
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        
        if (expenses.length < 5) {
            insights.push({
                icon: '📊',
                text: 'Upload more transaction data to get personalized insights and risk analysis.',
                type: 'info'
            });
        } else {
            // Category concentration risk
            const categorySpending = {};
            expenses.forEach(t => {
                const category = t.Description || 'Unknown';
                categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.Amount);
            });
            
            const totalSpending = Object.values(categorySpending).reduce((a, b) => a + b, 0);
            const topCategory = Object.entries(categorySpending)
                .sort((a, b) => b[1] - a[1])[0];
            
            if (topCategory && (topCategory[1] / totalSpending) > 0.4) {
                insights.push({
                    icon: '⚠️',
                    text: `${Math.round((topCategory[1] / totalSpending) * 100)}% of spending is concentrated in "${topCategory[0]}". Consider diversifying expenses to reduce risk.`,
                    type: 'warning'
                });
            }
            
            // Recent spending spike
            const recentExpenses = expenses.filter(t => {
                const date = new Date(t['Completed Date']);
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return date >= sevenDaysAgo;
            });
            
            if (recentExpenses.length > expenses.length * 0.3) {
                insights.push({
                    icon: '🔥',
                    text: 'High spending activity in the last 7 days. Monitor upcoming expenses to maintain budget control.',
                    type: 'warning'
                });
            }
            
            // Positive insights
            const monthlyAverage = totalSpending / Math.max(1, Math.ceil(expenses.length / 30));
            if (monthlyAverage < 1000) {
                insights.push({
                    icon: '✅',
                    text: `Your average monthly spending of £${monthlyAverage.toFixed(2)} suggests good budget discipline.`,
                    type: 'success'
                });
            }
        }
        
        if (insights.length === 0) {
            insights.push({
                icon: '💡',
                text: 'Your spending patterns look stable. Keep monitoring for any changes in trends.',
                type: 'info'
            });
        }
        
        const insightsContainer = document.getElementById('advancedInsights');
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
    }

    createAdvancedCharts() {
        this.createTrendChart();
        this.createAnomalyChart();
    }

    createTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.trendChart) {
            this.charts.trendChart.destroy();
        }
        
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        const dailyData = {};
        
        expenses.forEach(t => {
            const date = new Date(t['Completed Date']).toDateString();
            dailyData[date] = (dailyData[date] || 0) + Math.abs(t.Amount);
        });
        
        const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
        const amounts = sortedDates.map(date => dailyData[date]);
        
        // Calculate moving average
        const movingAvg = [];
        const period = Math.min(7, amounts.length);
        for (let i = 0; i < amounts.length; i++) {
            const start = Math.max(0, i - period + 1);
            const slice = amounts.slice(start, i + 1);
            movingAvg.push(slice.reduce((a, b) => a + b, 0) / slice.length);
        }
        
        this.charts.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Daily Spending',
                    data: amounts,
                    borderColor: 'rgba(255, 99, 132, 0.8)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.1
                }, {
                    label: '7-Day Average',
                    data: movingAvg,
                    borderColor: 'rgba(54, 162, 235, 0.8)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: this.getThemeColors().textColor
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (£)',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    }
                }
            }
        });
    }

    createAnomalyChart() {
        const canvas = document.getElementById('anomalyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.anomalyChart) {
            this.charts.anomalyChart.destroy();
        }
        
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        const amounts = expenses.map(t => Math.abs(t.Amount));
        const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
        
        const data = expenses.map((t, i) => ({
            x: i,
            y: Math.abs(t.Amount),
            isAnomaly: Math.abs(t.Amount) > mean + (2 * stdDev)
        }));
        
        this.charts.anomalyChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Normal Transactions',
                    data: data.filter(d => !d.isAnomaly),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 0.8)'
                }, {
                    label: 'Anomalies',
                    data: data.filter(d => d.isAnomaly),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: this.getThemeColors().textColor
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Transaction Index',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount (£)',
                            color: this.getThemeColors().textColor
                        },
                        ticks: {
                            color: this.getThemeColors().textColor
                        },
                        grid: {
                            color: this.getThemeColors().gridColor
                        }
                    }
                }
            }
        });
    }

    analyzeCategoryRisks() {
        const expenses = this.filteredTransactions.filter(t => t.Amount < 0);
        const categoryData = {};
        
        expenses.forEach(t => {
            const category = t.Description || 'Unknown';
            if (!categoryData[category]) {
                categoryData[category] = {
                    total: 0,
                    count: 0,
                    amounts: []
                };
            }
            const amount = Math.abs(t.Amount);
            categoryData[category].total += amount;
            categoryData[category].count += 1;
            categoryData[category].amounts.push(amount);
        });
        
        const categories = Object.entries(categoryData)
            .map(([name, data]) => {
                const avg = data.total / data.count;
                const variance = data.amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / data.count;
                const volatility = Math.sqrt(variance) / avg;
                
                let risk = 'low';
                if (volatility > 0.5) risk = 'high';
                else if (volatility > 0.3) risk = 'medium';
                
                return {
                    name: name.length > 30 ? name.substring(0, 30) + '...' : name,
                    total: data.total,
                    count: data.count,
                    avg: avg,
                    volatility: volatility,
                    risk: risk
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
        
        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Count</th>
                        <th>Average</th>
                        <th>Risk</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(cat => `
                        <tr>
                            <td>${cat.name}</td>
                            <td>${cat.total.toFixed(2)}</td>
                            <td>${cat.count}</td>
                            <td>${cat.avg.toFixed(2)}</td>
                            <td><span class="risk-score ${cat.risk}">${cat.risk.toUpperCase()}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('categoryRiskTable').innerHTML = tableHTML;
    }

    // Refresh all charts with current theme colors
    refreshChartsForTheme() {
        if (this.filteredTransactions.length > 0) {
            this.createCharts();
            this.createAdvancedCharts();
        }
    }
}

// Theme toggle functionality (same as home page)
function toggleTheme() {
    if (window.theme && typeof window.theme.toggle === 'function') {
        window.theme.toggle();
        updateThemeUI();
        
        // Force chart refresh after theme change
        setTimeout(() => {
            if (window.analytics && typeof window.analytics.refreshChartsForTheme === 'function') {
                window.analytics.refreshChartsForTheme();
            }
        }, 50);
    }
}

function updateThemeUI() {
    const icon = document.getElementById('theme-icon');
    
    if (window.theme && typeof window.theme.isDark === 'function') {
        try {
            const isDark = window.theme.isDark();
            icon.textContent = isDark ? '☀️' : '🌙';
            
            // Refresh charts with new theme colors
            if (window.analytics && typeof window.analytics.refreshChartsForTheme === 'function') {
                window.analytics.refreshChartsForTheme();
            }
        } catch (e) {
            console.warn('Error updating theme UI:', e);
        }
    }
}

// Initialize the analytics dashboard
let analytics;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing RevolutAnalytics');
    
    // Initialize theme UI when page loads
    setTimeout(updateThemeUI, 100);
    
    // Listen for theme changes
    if (window.theme && typeof window.theme.onChange === 'function') {
        window.theme.onChange(updateThemeUI);
    }
    
    analytics = new RevolutAnalytics();
    window.analytics = analytics; // Make globally accessible for theme changes
    console.log('Calling init() after DOM is ready');
    analytics.init();
});