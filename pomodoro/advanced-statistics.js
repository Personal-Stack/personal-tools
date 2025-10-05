/**
 * Advanced Statistics with Chart.js Integration
 * Provides comprehensive data visualization for Pomodoro sessions
 */

class AdvancedStatistics {
    constructor() {
        this.charts = {};
        this.timeframe = 'week'; // default timeframe
        this.colors = {
            primary: '#3b82f6',
            success: '#10b981', 
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            gray: '#6b7280'
        };
        
        this.init();
    }
    
    init() {
        this.initControls();
        this.initCharts();
        this.updateCharts();
        
        // Update charts when data changes
        document.addEventListener('pomodoroStatsUpdated', () => {
            this.updateCharts();
        });
        
        // Handle window resize for responsive canvas sizing
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    initControls() {
        const timeframeSelect = document.getElementById('chart-timeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', (e) => {
                this.timeframe = e.target.value;
                this.updateCharts();
            });
        }
    }
    
    initCharts() {
        // Set canvas dimensions for all charts
        this.setCanvasDimensions();
        
        this.initFocusTrendChart();
        this.initCompletionChart();
        this.initSessionDistributionChart();
        this.initPhaseBreakdownChart();
    }
    
    setCanvasDimensions() {
        const isMobile = window.innerWidth <= 768;
        const canvasWidth = isMobile ? 240 : 280;
        const canvasHeight = isMobile ? 200 : 240;
        
        const canvasIds = ['focusTrendChart', 'completionChart', 'sessionDistributionChart', 'phaseBreakdownChart'];
        
        canvasIds.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                canvas.style.width = `${canvasWidth}px`;
                canvas.style.height = `${canvasHeight}px`;
            }
        });
    }
    
    /**
     * Focus Time Trend - Line chart showing focus time over time
     */
    initFocusTrendChart() {
        const ctx = document.getElementById('focusTrendChart');
        if (!ctx) {
            console.warn('Focus trend chart canvas not found');
            return;
        }
        
        console.log('Initializing focus trend chart');
        
        this.charts.focusTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Focus Time (minutes)',
                    data: [],
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + ' minutes';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + 'm';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }
    
    /**
     * Completion Rate - Doughnut chart showing completion vs incomplete sessions
     */
    initCompletionChart() {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;
        
        this.charts.completion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Incomplete'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [this.colors.success, this.colors.danger],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    /**
     * Session Distribution - Bar chart showing sessions by time of day
     */
    initSessionDistributionChart() {
        const ctx = document.getElementById('sessionDistributionChart');
        if (!ctx) return;
        
        const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        
        this.charts.sessionDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Sessions Started',
                    data: new Array(24).fill(0),
                    backgroundColor: this.colors.info + '80',
                    borderColor: this.colors.info,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Sessions'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Phase Breakdown - Pie chart showing time spent in each phase
     */
    initPhaseBreakdownChart() {
        const ctx = document.getElementById('phaseBreakdownChart');
        if (!ctx) return;
        
        this.charts.phaseBreakdown = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Focus', 'Short Break', 'Long Break'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.success,
                        this.colors.warning
                    ],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    /**
     * Update all charts with current data
     */
    updateCharts() {
        const sessions = this.getFilteredSessions();
        console.log('Advanced stats updating charts with sessions:', sessions.length);
        
        this.updateFocusTrendChart(sessions);
        this.updateCompletionChart(sessions);
        this.updateSessionDistributionChart(sessions);
        this.updatePhaseBreakdownChart(sessions);
    }
    
    /**
     * Debug method to test chart with sample data
     */
    testFocusTrendChart() {
        if (!this.charts.focusTrend) {
            console.log('Focus trend chart not initialized');
            return;
        }
        
        // Create sample data for testing
        const testData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            data: [25.5, 30.0, 22.5, 35.0, 28.0]
        };
        
        console.log('Testing focus trend chart with sample data:', testData);
        
        this.charts.focusTrend.data.labels = testData.labels;
        this.charts.focusTrend.data.datasets[0].data = testData.data;
        this.charts.focusTrend.update();
        
        console.log('Focus trend chart updated with test data');
    }
    
    /**
     * Get sessions filtered by current timeframe
     */
    getFilteredSessions() {
        try {
            const saved = localStorage.getItem('pomodoroState');
            if (!saved) return [];
            
            const state = JSON.parse(saved);
            const sessions = state.sessions || [];
            
            const now = Date.now();
            let cutoffTime;
            
            switch(this.timeframe) {
                case 'today':
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    cutoffTime = today.getTime();
                    break;
                case 'week':
                    cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
                    break;
                case 'all':
                default:
                    cutoffTime = 0;
                    break;
            }
            
            return sessions.filter(s => s.startTime >= cutoffTime);
        } catch (e) {
            console.error('Error loading sessions:', e);
            return [];
        }
    }
    
    /**
     * Update focus trend chart
     */
    updateFocusTrendChart(sessions) {
        if (!this.charts.focusTrend) return;
        
        console.log('Focus trend chart - All sessions:', sessions.length);
        
        // Handle both 'phase' and 'type' properties for compatibility
        const focusSessions = sessions.filter(s => {
            const sessionType = s.phase || s.type;
            const isCompleted = this.isSessionCompleted(s);
            return sessionType === 'focus' && isCompleted;
        });
        
        console.log('Focus trend chart - Focus sessions found:', focusSessions.length);
        
        if (focusSessions.length === 0) {
            // Show empty state
            this.charts.focusTrend.data.labels = ['No Data'];
            this.charts.focusTrend.data.datasets[0].data = [0];
            this.charts.focusTrend.update();
            return;
        }
        
        // Group by date/time period
        const groupedData = this.groupSessionsByPeriod(focusSessions);
        const labels = Object.keys(groupedData).sort();
        
        console.log('Focus trend chart - Grouped data:', groupedData);
        console.log('Focus trend chart - Labels:', labels);
        
        const data = labels.map(label => {
            const sessionsInPeriod = groupedData[label];
            const totalMinutes = sessionsInPeriod.reduce((sum, s) => {
                // Handle different duration property names
                let duration = s.actualDuration || s.duration;
                if (!duration && s.startTime && s.endTime) {
                    // Calculate duration from timestamps
                    duration = (s.endTime - s.startTime) / 1000; // convert to seconds
                }
                const minutes = duration ? duration / 60 : 0;
                console.log(`Session duration: ${duration}s = ${minutes} minutes`);
                return sum + minutes;
            }, 0);
            return Math.round(totalMinutes * 10) / 10; // round to 1 decimal
        });
        
        console.log('Focus trend chart - Final data:', data);
        
        this.charts.focusTrend.data.labels = labels;
        this.charts.focusTrend.data.datasets[0].data = data;
        this.charts.focusTrend.update();
    }
    
    /**
     * Update completion rate chart
     */
    updateCompletionChart(sessions) {
        if (!this.charts.completion) return;
        
        const completed = sessions.filter(s => this.isSessionCompleted(s)).length;
        const incomplete = sessions.length - completed;
        
        this.charts.completion.data.datasets[0].data = [completed, incomplete];
        this.charts.completion.update();
    }
    
    /**
     * Update session distribution chart
     */
    updateSessionDistributionChart(sessions) {
        if (!this.charts.sessionDistribution) return;
        
        const hourCounts = new Array(24).fill(0);
        
        sessions.forEach(session => {
            if (session.startTime) {
                const hour = new Date(session.startTime).getHours();
                hourCounts[hour]++;
            }
        });
        
        this.charts.sessionDistribution.data.datasets[0].data = hourCounts;
        this.charts.sessionDistribution.update();
    }
    
    /**
     * Update phase breakdown chart
     */
    updatePhaseBreakdownChart(sessions) {
        if (!this.charts.phaseBreakdown) return;
        
        const completedSessions = sessions.filter(s => this.isSessionCompleted(s));
        
        const phaseTime = {
            focus: 0,
            shortBreak: 0,
            longBreak: 0
        };
        
        completedSessions.forEach(session => {
            const minutes = session.actualDuration / 60;
            if (session.phase === 'focus') {
                phaseTime.focus += minutes;
            } else if (session.phase === 'shortBreak') {
                phaseTime.shortBreak += minutes;
            } else if (session.phase === 'longBreak') {
                phaseTime.longBreak += minutes;
            }
        });
        
        const data = [
            Math.round(phaseTime.focus * 10) / 10,
            Math.round(phaseTime.shortBreak * 10) / 10,
            Math.round(phaseTime.longBreak * 10) / 10
        ];
        
        this.charts.phaseBreakdown.data.datasets[0].data = data;
        this.charts.phaseBreakdown.update();
    }
    
    /**
     * Check if session is completed based on timing
     */
    isSessionCompleted(session) {
        if (!session.startTime || !session.endTime) return false;
        
        // If there's no expected duration, assume it's completed if it has an end time
        if (!session.expectedDuration) {
            return true; // Session has both start and end time, consider it completed
        }
        
        const expectedEndTime = session.startTime + (session.expectedDuration * 1000);
        const tolerance = 5000; // 5 seconds tolerance
        return session.endTime >= (expectedEndTime - tolerance);
    }
    
    /**
     * Group sessions by time period based on current timeframe
     */
    groupSessionsByPeriod(sessions) {
        const grouped = {};
        
        sessions.forEach(session => {
            let key;
            const date = new Date(session.startTime);
            
            switch(this.timeframe) {
                case 'today':
                    key = date.getHours().toString().padStart(2, '0') + ':00';
                    break;
                case 'week':
                    key = date.toLocaleDateString('en-US', { weekday: 'short' });
                    break;
                case 'month':
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    break;
                case 'all':
                default:
                    key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    break;
            }
            
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(session);
        });
        
        return grouped;
    }
    
    /**
     * Handle window resize for responsive canvas sizing
     */
    handleResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.setCanvasDimensions();
            
            // Recreate charts with new dimensions
            Object.keys(this.charts).forEach(chartName => {
                if (this.charts[chartName]) {
                    this.charts[chartName].resize();
                }
            });
        }, 250);
    }
    
    /**
     * Destroy all charts (for cleanup)
     */
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        
        // Clean up resize listener
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }
}

// Initialize advanced statistics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other components to initialize
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            window.advancedStats = new AdvancedStatistics();
            console.log('Advanced Statistics initialized');
        } else {
            console.error('Chart.js not loaded');
        }
    }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedStatistics;
}