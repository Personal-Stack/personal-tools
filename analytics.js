// CSV Analytics Application
class CSVAnalytics {
    constructor() {
        this.csvData = [];
        this.processedData = {
            descriptions: {},
            states: {},
            balanceHistory: []
        };
        this.charts = {
            description: null,
            state: null,
            balance: null
        };
        this.filteredData = [];
        this.init();
    }

    init() {
        console.log('CSV Analytics initialized');
        this.setupFileInputListener();
    }

    setupFileInputListener() {
        const fileInput = document.getElementById('csvFile');
        if (fileInput) {
            console.log('File input listener set up');
            // Update file input text when file is selected and automatically upload
            fileInput.addEventListener('change', (event) => {
                console.log('File input changed', event.target.files);
                const fileName = fileInput.files[0]?.name || 'Choose CSV file';
                const textSpan = document.querySelector('.file-input-text');
                if (textSpan) {
                    textSpan.textContent = fileName;
                }
                
                // Automatically process the file when selected
                if (event.target.files.length > 0) {
                    this.handleFileUpload();
                }
            });
        } else {
            console.error('File input not found');
        }
    }

    handleFileUpload() {
        console.log('handleFileUpload called');
        const fileInput = document.getElementById('csvFile');
        const statusEl = document.getElementById('uploadStatus');
        
        console.log('File input:', fileInput);
        console.log('Files:', fileInput?.files);
        
        if (!fileInput || !fileInput.files.length) {
            this.showStatus('Please select a CSV file', 'error');
            return;
        }

        const file = fileInput.files[0];
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showStatus('Please select a .csv file', 'error');
            return;
        }

        this.showStatus('Reading file...', '');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSV(e.target.result);
            } catch (error) {
                console.error('CSV Parse Error:', error);
                this.showStatus('Error parsing CSV file: ' + error.message, 'error');
            }
        };
        
        reader.onerror = () => {
            this.showStatus('Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }

    parseCSV(csvContent) {
        console.log('Starting CSV parsing');
        console.log('Content length:', csvContent.length);
        console.log('First 500 chars:', csvContent.substring(0, 500));
        
        // Try different line ending formats
        let lines;
        if (csvContent.includes('\r\n')) {
            lines = csvContent.split('\r\n');
        } else if (csvContent.includes('\n')) {
            lines = csvContent.split('\n');
        } else if (csvContent.includes('\r')) {
            lines = csvContent.split('\r');
        } else {
            lines = [csvContent];
        }
        
        // Filter out empty lines
        lines = lines.filter(line => line.trim());
        
        console.log('Total lines found:', lines.length);
        console.log('First few lines:', lines.slice(0, 3));
        
        if (lines.length < 2) {
            throw new Error(`CSV file must contain at least a header and one data row. Found ${lines.length} lines.`);
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const expectedHeaders = ['Type', 'Product', 'Started Date', 'Completed Date', 'Description', 'Amount', 'Fee', 'Currency', 'State', 'Balance'];
        
        console.log('Found headers:', headers);
        console.log('Expected headers:', expectedHeaders);
        
        // Validate headers
        const headerMatches = expectedHeaders.every(expected => 
            headers.some(actual => actual.toLowerCase() === expected.toLowerCase())
        );
        
        console.log('Header matches:', headerMatches);
        
        if (!headerMatches) {
            throw new Error('CSV headers do not match expected format. Expected: ' + expectedHeaders.join(', '));
        }

        // Create header mapping for case-insensitive matching
        const headerMap = {};
        expectedHeaders.forEach(expected => {
            const matchingHeader = headers.find(actual => 
                actual.toLowerCase() === expected.toLowerCase()
            );
            if (matchingHeader) {
                headerMap[expected] = headers.indexOf(matchingHeader);
            }
        });

        // Parse data rows
        this.csvData = [];
        console.log('Starting to parse', lines.length - 1, 'data rows');
        
        for (let i = 1; i < lines.length; i++) {
            const row = this.parseCSVRow(lines[i]);
            console.log(`Row ${i}:`, row);
            
            if (row.length >= headers.length) {
                const record = {
                    type: row[headerMap['Type']] || '',
                    product: row[headerMap['Product']] || '',
                    startedDate: row[headerMap['Started Date']] || '',
                    completedDate: row[headerMap['Completed Date']] || '',
                    description: row[headerMap['Description']] || '',
                    amount: parseFloat(row[headerMap['Amount']]) || 0,
                    fee: parseFloat(row[headerMap['Fee']]) || 0,
                    currency: row[headerMap['Currency']] || 'USD',
                    state: row[headerMap['State']] || '',
                    balance: parseFloat(row[headerMap['Balance']]) || 0,
                    rowIndex: i
                };
                this.csvData.push(record);
            }
        }

        if (this.csvData.length === 0) {
            throw new Error('No valid data rows found in CSV');
        }

        this.showStatus(`Successfully loaded ${this.csvData.length} transactions`, 'success');
        this.processData();
        this.showSections();
        this.createCharts();
        this.populateTable();
    }

    parseCSVRow(row) {
        // Simple split approach - if this doesn't work, we'll use the complex parser
        const simpleResult = row.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
        
        // If no quotes in the row, use simple approach
        if (!row.includes('"')) {
            return simpleResult;
        }
        
        // Complex parsing for quoted fields
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    }

    processData() {
        // Reset processed data
        this.processedData = {
            descriptions: {},
            states: {},
            balanceHistory: [],
            cardPaymentDescriptions: {},
            nonCardPaymentDescriptions: {}
        };

        // Process descriptions (only negative amounts - expenses)
        this.csvData.forEach(record => {
            // Skip positive amounts (income/deposits), Savings and Deposit products, Savings Vault topup, currency exchanges, and flexible cash funds
            if (record.amount >= 0) return;
            if (record.product && record.product.toLowerCase().includes('savings')) return;
            if (record.product && record.product.toLowerCase().includes('deposit')) return;
            if (record.description && record.description.toLowerCase().includes('savings vault topup')) return;
            if (record.description && record.description.toLowerCase().includes('exchanged to')) return;
            if (record.description && record.description.toLowerCase().includes('to flexible cash funds')) return;
            
            const desc = record.description || 'Unknown';
            if (!this.processedData.descriptions[desc]) {
                this.processedData.descriptions[desc] = {
                    count: 0,
                    totalAmount: 0,
                    transactions: []
                };
            }
            this.processedData.descriptions[desc].count++;
            this.processedData.descriptions[desc].totalAmount += Math.abs(record.amount);
            this.processedData.descriptions[desc].transactions.push(record);
            
            // Also process Card Payment transactions separately (only expenses)
            if (record.type && record.type.toLowerCase().includes('card payment')) {
                if (!this.processedData.cardPaymentDescriptions[desc]) {
                    this.processedData.cardPaymentDescriptions[desc] = {
                        count: 0,
                        totalAmount: 0,
                        transactions: []
                    };
                }
                this.processedData.cardPaymentDescriptions[desc].count++;
                this.processedData.cardPaymentDescriptions[desc].totalAmount += Math.abs(record.amount);
                this.processedData.cardPaymentDescriptions[desc].transactions.push(record);
            } else {
                // Process non-Card Payment transactions by description (only expenses)
                if (!this.processedData.nonCardPaymentDescriptions[desc]) {
                    this.processedData.nonCardPaymentDescriptions[desc] = {
                        count: 0,
                        totalAmount: 0,
                        transactions: []
                    };
                }
                this.processedData.nonCardPaymentDescriptions[desc].count++;
                this.processedData.nonCardPaymentDescriptions[desc].totalAmount += Math.abs(record.amount);
                this.processedData.nonCardPaymentDescriptions[desc].transactions.push(record);
            }
        });

        // Process states (only negative amounts - expenses)
        this.csvData.forEach(record => {
            // Skip positive amounts (income/deposits), Savings and Deposit products, Savings Vault topup, currency exchanges, and flexible cash funds
            if (record.amount >= 0) return;
            if (record.product && record.product.toLowerCase().includes('savings')) return;
            if (record.product && record.product.toLowerCase().includes('deposit')) return;
            if (record.description && record.description.toLowerCase().includes('savings vault topup')) return;
            if (record.description && record.description.toLowerCase().includes('exchanged to')) return;
            if (record.description && record.description.toLowerCase().includes('to flexible cash funds')) return;
            
            const state = record.state || 'Unknown';
            if (!this.processedData.states[state]) {
                this.processedData.states[state] = {
                    count: 0,
                    totalAmount: 0,
                    transactions: []
                };
            }
            this.processedData.states[state].count++;
            this.processedData.states[state].totalAmount += Math.abs(record.amount);
            this.processedData.states[state].transactions.push(record);
        });

        // Process balance history (sort by completed date string)
        this.processedData.balanceHistory = [...this.csvData]
            .filter(record => record.completedDate)
            .sort((a, b) => a.completedDate.localeCompare(b.completedDate));

        this.updateSummary();
    }

    updateSummary() {
        const expenseTransactions = this.csvData.filter(record => 
            record.amount < 0 && 
            !(record.product && record.product.toLowerCase().includes('savings')) &&
            !(record.product && record.product.toLowerCase().includes('deposit')) &&
            !(record.description && record.description.toLowerCase().includes('savings vault topup')) &&
            !(record.description && record.description.toLowerCase().includes('exchanged to')) &&
            !(record.description && record.description.toLowerCase().includes('to flexible cash funds'))
        );
        const totalTransactions = expenseTransactions.length;
        const totalAmount = expenseTransactions.reduce((sum, record) => sum + Math.abs(record.amount), 0);
        const averageBalance = this.csvData.reduce((sum, record) => sum + record.balance, 0) / this.csvData.length;
        
        // Calculate date range (using string sorting)
        const dates = this.csvData
            .map(record => record.completedDate)
            .filter(date => date)
            .sort();
        
        const dateRange = dates.length > 0 ? 
            `${dates[0]} - ${dates[dates.length - 1]}` : 
            'No dates available';

        // Update summary display
        document.getElementById('totalTransactions').textContent = totalTransactions.toLocaleString();
        document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);
        document.getElementById('averageBalance').textContent = this.formatCurrency(averageBalance);
        document.getElementById('dateRange').textContent = dateRange;
    }

    showSections() {
        document.getElementById('dataSummary').style.display = 'block';
        document.getElementById('chartsSection').style.display = 'block';
        document.getElementById('dataTable').style.display = 'block';
    }

    createCharts() {
        this.createDescriptionChart();
        this.createStateChart();
        this.createBalanceChart();
    }

    createDescriptionChart() {
        const ctx = document.getElementById('descriptionChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.description) {
            this.charts.description.destroy();
        }

        // Filter for Card Payment transactions only
        const allDescriptions = Object.entries(this.processedData.cardPaymentDescriptions)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount);
        const descriptions = allDescriptions.slice(0, 50); // Top 50 card payment descriptions
            
        // If no card payments found, show message
        if (descriptions.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const container = ctx.parentElement;
            const message = document.createElement('div');
            message.className = 'no-data-message';
            message.textContent = 'No Card Payment transactions found in the data.';
            container.appendChild(message);
            return;
        }

        // Generate unique, distinguishable colors for each bubble
        const generateUniqueColors = (count) => {
            const colors = [];
            const hueStep = 360 / count;
            
            for (let i = 0; i < count; i++) {
                const hue = (i * hueStep) % 360;
                // Vary saturation and lightness to ensure distinctiveness
                const saturation = 70 + (i % 3) * 10; // 70%, 80%, 90%
                const lightness = 45 + (i % 4) * 10;  // 45%, 55%, 65%, 75%
                
                colors.push({
                    background: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`,
                    border: `hsl(${hue}, ${saturation}%, ${Math.max(20, lightness - 20)}%)`,
                    hover: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`
                });
            }
            return colors;
        };

        const uniqueColors = generateUniqueColors(descriptions.length);

        // Prepare bubble chart data: {x: count, y: amount, r: radius based on amount}
        const bubbleData = descriptions.map(([desc, info], index) => ({
            x: info.count, // X-axis: number of transactions
            y: info.totalAmount, // Y-axis: total amount
            r: Math.max(5, Math.min(25, info.totalAmount / 50)), // Bubble size based on amount
            label: desc, // Store description for tooltip
            backgroundColor: uniqueColors[index].background,
            borderColor: uniqueColors[index].border,
            hoverBackgroundColor: uniqueColors[index].hover,
            hoverBorderColor: uniqueColors[index].border
        }));

        // Create chart
        this.charts.description = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Card Payment Spending',
                    data: bubbleData,
                    backgroundColor: (context) => context.raw.backgroundColor,
                    borderColor: (context) => context.raw.borderColor,
                    borderWidth: 2,
                    hoverBackgroundColor: (context) => context.raw.hoverBackgroundColor,
                    hoverBorderColor: (context) => context.raw.hoverBorderColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Card Payment Spending: Amount vs Transaction Count (Top 50)'
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                return context[0].raw.label;
                            },
                            label: (context) => {
                                const point = context.raw;
                                return [
                                    `Transactions: ${point.x}`,
                                    `Total Amount: ${this.formatCurrency(point.y)}`,
                                    `Avg per Transaction: ${this.formatCurrency(point.y / point.x)}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Number of Transactions'
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Amount Spent'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });

        // Update items list with all card payment information, marking excluded items
        this.updateChartItemsList('descriptionItems', 'descriptionTotal', allDescriptions.map(([desc, info], index) => ({
            name: `${desc} (${info.count}x Card Payments)${index >= 50 ? ' - Not in chart' : ''}`,
            value: info.totalAmount,
            count: info.count,
            isExcluded: index >= 50
        })));
    }

    createStateChart() {
        const ctx = document.getElementById('stateChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.state) {
            this.charts.state.destroy();
        }

        // Filter for non-Card Payment transactions by description
        const descriptions = Object.entries(this.processedData.nonCardPaymentDescriptions)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .slice(0, 20); // Top 20 non-card payment descriptions
            
        // If no non-card payments found, show message
        if (descriptions.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            const container = ctx.parentElement;
            const message = document.createElement('div');
            message.className = 'no-data-message';
            message.textContent = 'No non-Card Payment transactions found in the data.';
            container.appendChild(message);
            return;
        }

        const labels = descriptions.map(([desc]) => desc);
        const data = descriptions.map(([, info]) => info.totalAmount);
        const counts = descriptions.map(([, info]) => info.count);

        // Create chart
        this.charts.state = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Non-Card Payment Amount',
                    data: data,
                    backgroundColor: [
                        '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1',
                        '#e83e8c', '#fd7e14', '#20c997', '#6c757d', '#007bff'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Non-Card Payment Spending by Description'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = this.formatCurrency(context.parsed);
                                const count = counts[context.dataIndex];
                                return `${label}: ${value} (${count} transactions)`;
                            }
                        }
                    }
                }
            }
        });

        // Update items list with non-card payment information
        this.updateChartItemsList('stateItems', 'stateTotal', descriptions.map(([desc, info]) => ({
            name: `${desc} (${info.count}x Non-Card Payments)`,
            value: info.totalAmount,
            count: info.count
        })));
    }

    createBalanceChart() {
        const ctx = document.getElementById('balanceChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.balance) {
            this.charts.balance.destroy();
        }

        // Prepare data
        const balanceData = this.processedData.balanceHistory.map(record => ({
            x: record.completedDate,
            y: record.balance
        }));

        // Create chart with simple labels instead of time parsing
        const labels = this.processedData.balanceHistory.map((record, index) => `Transaction ${index + 1}`);
        const balanceValues = this.processedData.balanceHistory.map(record => record.balance);

        this.charts.balance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance Over Time',
                    data: balanceValues,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Transaction Sequence'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Balance'
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Balance: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateChartItemsList(containerId, totalId, items) {
        const container = document.getElementById(containerId);
        const totalEl = document.getElementById(totalId);
        
        if (!container || !totalEl) return;

        const total = items.reduce((sum, item) => sum + item.value, 0);

        container.innerHTML = items.map(item => `
            <div class="chart-item${item.isExcluded ? ' excluded-item' : ''}">
                <span class="chart-item-name">${item.name}</span>
                <span class="chart-item-value">
                    ${this.formatCurrency(item.value)}
                    <span class="chart-item-count">(${item.count})</span>
                </span>
            </div>
        `).join('');

        totalEl.textContent = this.formatCurrency(total);
    }

    populateTable() {
        const tbody = document.getElementById('transactionsBody');
        const stateFilter = document.getElementById('stateFilter');
        
        if (!tbody) return;

        // Populate state filter options
        if (stateFilter) {
            const states = [...new Set(this.csvData.map(record => record.state))].sort();
            stateFilter.innerHTML = '<option value="">All States</option>' + 
                states.map(state => `<option value="${state}">${state}</option>`).join('');
        }

        // Set filtered data to all data initially
        this.filteredData = [...this.csvData];
        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('transactionsBody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredData.map(record => `
            <tr>
                <td>${record.type}</td>
                <td>${record.product}</td>
                <td>${record.startedDate}</td>
                <td>${record.completedDate}</td>
                <td>${record.description}</td>
                <td class="${record.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                    ${this.formatCurrency(record.amount)}
                </td>
                <td>${this.formatCurrency(record.fee)}</td>
                <td>${record.currency}</td>
                <td>
                    <span class="state-${record.state.toLowerCase().replace(/\\s+/g, '-')}">
                        ${record.state}
                    </span>
                </td>
                <td>${this.formatCurrency(record.balance)}</td>
            </tr>
        `).join('');
    }

    filterTable() {
        const searchInput = document.getElementById('searchInput');
        const stateFilter = document.getElementById('stateFilter');
        
        if (!searchInput || !stateFilter) return;

        const searchTerm = searchInput.value.toLowerCase();
        const stateValue = stateFilter.value;

        this.filteredData = this.csvData.filter(record => {
            const matchesSearch = !searchTerm || 
                Object.values(record).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                );
            
            const matchesState = !stateValue || record.state === stateValue;
            
            return matchesSearch && matchesState;
        });

        this.renderTable();
    }

    exportFiltered() {
        if (this.filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = ['Type', 'Product', 'Started Date', 'Completed Date', 'Description', 'Amount', 'Fee', 'Currency', 'State', 'Balance'];
        const csvContent = [
            headers.join(','),
            ...this.filteredData.map(record => [
                record.type,
                record.product,
                record.startedDate,
                record.completedDate,
                `"${record.description}"`,
                record.amount,
                record.fee,
                record.currency,
                record.state,
                record.balance
            ].join(','))
        ].join('\\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `filtered-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    refreshCharts() {
        this.createCharts();
    }

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    showStatus(message, type = '') {
        const statusEl = document.getElementById('uploadStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `upload-status ${type}`;
        }
    }
}

// Initialize the CSV Analytics when the page loads
let csvAnalytics;
document.addEventListener('DOMContentLoaded', () => {
    csvAnalytics = new CSVAnalytics();
});