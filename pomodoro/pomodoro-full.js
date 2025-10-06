/**
 * Pomodoro Timer with TimerManager - Complete Implementation
 * Combines clean TimerManager architecture with full feature set
 */

class PomodoroTimer {
    constructor() {
        // Settings (will be loaded from localStorage or form)
        this.settings = {
            focusDuration: 25 * 60, // seconds
            shortBreakDuration: 5 * 60,
            longBreakDuration: 15 * 60,
            sessionsUntilLongBreak: 4,
            lockScreenEnabled: true,
            notificationsEnabled: true
        };
        
        // State
        this.state = {
            currentPhase: 'focus', // 'focus', 'shortBreak', 'longBreak'
            currentSession: 1,
            sessions: [] // Session history
        };
        
        // Components
        this.timerManager = new TimerManager();
        this.lockScreen = null;
        this.elements = {};
        this.progressRing = null;
        this.statistics = null;
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.initElements();
        this.setupTimerManager();
        this.setupEventListeners();
        this.initializeSettingsForm();
        this.initializeLockScreen();
        this.initializeProgressRing();
        this.initializeStatistics();
        this.initializeNotifications();
        this.restoreSessionIfRunning();
        this.render();
        this.updateStatistics();
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('pomodoroState');
            if (saved) {
                const savedState = JSON.parse(saved);
                this.state = { ...this.state, ...savedState };
            }
        } catch (error) {
            console.warn('Could not load saved state:', error);
        }
        
        // Load settings
        try {
            const savedSettings = localStorage.getItem('pomodoroSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.warn('Could not load saved settings:', error);
        }
    }
    
    saveState() {
        localStorage.setItem('pomodoroState', JSON.stringify(this.state));
    }
    
    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }
    
    saveRunningSession(type, duration) {
        const sessionData = {
            type,
            duration,
            startTime: Date.now(),
            endTime: Date.now() + (duration * 1000)
        };
        localStorage.setItem('pomodoroRunningSession', JSON.stringify(sessionData));
    }
    
    clearRunningSession() {
        localStorage.removeItem('pomodoroRunningSession');
    }
    
    initElements() {
        this.elements = {
            timeDisplay: document.getElementById('timer-time'),
            phaseDisplay: document.getElementById('timer-phase'),
            sessionDisplay: document.getElementById('timer-session'),
            startBtn: document.getElementById('start-pause-btn'),
            startBtnText: document.getElementById('start-pause-text'),
            skipBtn: document.getElementById('skip-btn'),
            progressRingElement: document.getElementById('progress-ring'),
            // Clear state button
            resetStateBtn: document.getElementById('reset-state-btn'),
            // Settings form elements
            focusDurationInput: document.getElementById('focus-duration'),
            shortBreakDurationInput: document.getElementById('short-break-duration'),
            longBreakDurationInput: document.getElementById('long-break-duration'),
            lockScreenToggle: document.getElementById('lock-screen-enabled'),
            notificationsToggle: document.getElementById('notifications-enabled'),
            resetSettingsBtn: document.getElementById('reset-settings'),
            // Preset elements
            presetChips: document.querySelectorAll('.preset-chip')
        };
    }
    
    setupTimerManager() {
        // Timer tick callback for UI updates
        this.timerManager.setTickCallback((data) => {
            this.render(data);
            this.updateProgressRing(data);
        });
        
        // Statistics callback
        this.timerManager.setStatisticsCallback((sessionData) => {
            this.updateStatistics(sessionData);
        });
    }
    
    setupEventListeners() {
        // Start/Stop button
        this.elements.startBtn?.addEventListener('click', () => {
            if (this.timerManager.isRunning()) {
                this.stopTimer();
            } else {
                this.startTimer();
            }
        });
        
        // Skip button
        this.elements.skipBtn?.addEventListener('click', () => {
            this.skip();
        });
        
        // Clear state button
        this.elements.resetStateBtn?.addEventListener('click', () => {
            this.clearAllData();
        });
        
        // Emergency stop (Alt + Shift + E)
        this.globalKeyHandler = (e) => {
            if (e.altKey && e.shiftKey && e.code === 'KeyE') {
                e.preventDefault();
                e.stopPropagation();
                this.emergencyStopAll();
            }
        };
        
        document.addEventListener('keydown', this.globalKeyHandler);
    }
    
    initializeSettingsForm() {
        if (!this.elements.focusDurationInput) return;
        
        // Load current settings into form
        this.elements.focusDurationInput.value = this.settings.focusDuration / 60;
        this.elements.shortBreakDurationInput.value = this.settings.shortBreakDuration / 60;
        this.elements.longBreakDurationInput.value = this.settings.longBreakDuration / 60;
        this.elements.lockScreenToggle.checked = this.settings.lockScreenEnabled;
        this.elements.notificationsToggle.checked = this.settings.notificationsEnabled;
        
        // Auto-save on changes
        [this.elements.focusDurationInput, this.elements.shortBreakDurationInput, 
         this.elements.longBreakDurationInput].forEach(input => {
            input?.addEventListener('input', () => this.autoSaveSettings());
        });
        
        this.elements.lockScreenToggle?.addEventListener('change', () => this.autoSaveSettings());
        this.elements.notificationsToggle?.addEventListener('change', () => this.autoSaveSettings());
        this.elements.resetSettingsBtn?.addEventListener('click', () => this.resetSettings());
        
        // Preset handlers
        this.elements.presetChips.forEach(chip => {
            chip.addEventListener('click', () => this.applyPreset(chip));
        });
        
        this.updateActivePreset();
    }
    
    initializeLockScreen() {
        if (window.LockScreenManager) {
            this.lockScreen = new LockScreenManager(this);
        }
    }
    
    initializeProgressRing() {
        if (window.ProgressRing && this.elements.progressRingElement) {
            this.progressRing = new ProgressRing(this.elements.progressRingElement);
        }
    }
    
    initializeStatistics() {
        if (window.PomodoroStatistics) {
            this.statistics = new PomodoroStatistics();
            console.log('PomodoroStatistics initialized:', !!this.statistics);
            
            // Update display immediately with current sessions
            if (this.statistics && this.statistics.updateDisplay) {
                this.statistics.updateDisplay(this.state.sessions);
                console.log('Initial statistics update called with', this.state.sessions.length, 'sessions');
            }
        } else {
            console.warn('PomodoroStatistics not available on window object');
        }
    }
    
    async initializeNotifications() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }
        
        // Check current permission status
        if (Notification.permission === 'default') {
            // Request permission on first visit
            try {
                const permission = await Notification.requestPermission();
                console.log('Notification permission:', permission);
                
                if (permission === 'granted') {
                    this.showWelcomeNotification();
                }
            } catch (error) {
                console.log('Error requesting notification permission:', error);
            }
        } else if (Notification.permission === 'granted') {
            console.log('Notifications already granted');
        } else {
            console.log('Notifications denied by user');
        }
    }
    
    showWelcomeNotification() {
        this.sendBrowserNotification(
            'Pomodoro Timer Ready! 🍅',
            'You\'ll receive notifications when sessions start and finish.',
            { icon: this.getNotificationIcon(), tag: 'welcome' }
        );
    }
    
    getNotificationIcon() {
        // Use the tomato emoji as a data URL icon for consistency
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Simple fallback icon using canvas
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍅', 32, 32);
        
        return canvas.toDataURL();
    }
    
    restoreSessionIfRunning() {
        const savedSessionData = this.loadRunningSession();
        
        if (!savedSessionData) {
            return; // No session to restore
        }
        
        const remaining = this.calculateRemainingTime(savedSessionData);
        
        if (remaining <= 0) {
            this.clearExpiredSession();
            return;
        }
        
        // Update current phase to match the restored session
        this.state.currentPhase = savedSessionData.type;
        
        // Restore the appropriate timer type with remaining time
        this.restoreTimerWithRemainingTime(savedSessionData.type, remaining);
        
        this.showRestorationNotification(savedSessionData.type, remaining);
    }
    
    loadRunningSession() {
        try {
            const savedSession = localStorage.getItem('pomodoroRunningSession');
            return savedSession ? JSON.parse(savedSession) : null;
        } catch (error) {
            console.warn('Could not load running session:', error);
            this.clearRunningSession();
            return null;
        }
    }
    
    calculateRemainingTime(sessionData) {
        const now = Date.now();
        return Math.ceil((sessionData.endTime - now) / 1000);
    }
    
    clearExpiredSession() {
        this.clearRunningSession();
        console.log('Found expired session, cleared it');
    }
    
    restoreTimerWithRemainingTime(type, remaining) {
        const onComplete = (sessionData) => {
            this.onSessionComplete(sessionData);
        };
        
        if (type === 'shortBreak' || type === 'longBreak') {
            this.restoreBreakTimer(type, remaining, onComplete);
        } else {
            this.restoreFocusTimer(remaining, onComplete);
        }
    }
    
    restoreBreakTimer(breakType, remaining, onComplete) {
        const onStart = this.settings.lockScreenEnabled && this.lockScreen
            ? () => {
                this.lockScreen.showBreakScreen(breakType, remaining / 60);
            }
            : null;
        
        this.timerManager.runSession(breakType, remaining, onComplete, onStart);
    }
    
    restoreFocusTimer(remaining, onComplete) {
        this.timerManager.runSession('focus', remaining, onComplete, null);
    }
    
    showRestorationNotification(type, remaining) {
        const minutes = Math.ceil(remaining / 60);
        const sessionName = type === 'longBreak' ? 'Long Break' : 
                          type === 'shortBreak' ? 'Short Break' : 'Focus';
        
        this.showNotification(
            `Restored ${sessionName} - ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`, 
            'info'
        );
    }
    
    // Timer Methods
    startTimer() {
        const type = this.state.currentPhase;
        
        if (type === 'shortBreak' || type === 'longBreak') {
            this.startBreakTimer(type);
        } else {
            this.startFocusTimer();
        }
    }
    
    startFocusTimer() {
        const duration = this.settings.focusDuration;
        const type = 'focus';
        
        // Define completion callback
        const onComplete = (sessionData) => {
            this.onSessionComplete(sessionData);
        };
        
        // No special start callback for focus sessions
        const onStart = null;
        
        // Start timer
        this.timerManager.runSession(type, duration, onComplete, onStart);
        
        // Save running session for restoration on page refresh
        this.saveRunningSession(type, duration);
        
        this.showNotification(`Focus session started! Duration: ${Math.round(duration/60)} minutes`);
    }
    
    startBreakTimer(breakType) {
        const duration = breakType === 'longBreak' ? 
            this.settings.longBreakDuration : 
            this.settings.shortBreakDuration;
        
        // Define completion callback
        const onComplete = (sessionData) => {
            this.onSessionComplete(sessionData);
        };
        
        // Define start callback for lock screen display
        const onStart = this.settings.lockScreenEnabled
            ? () => {
                if (this.lockScreen) {
                    this.lockScreen.showBreakScreen(breakType, duration / 60);
                }
            }
            : null;
        
        // Start timer
        this.timerManager.runSession(breakType, duration, onComplete, onStart);
        
        // Save running session for restoration on page refresh
        this.saveRunningSession(breakType, duration);
        
        const breakName = breakType === 'longBreak' ? 'Long Break' : 'Short Break';
        this.showNotification(`${breakName} started! Duration: ${Math.round(duration/60)} minutes`);
    }
    
    stopTimer() {
        // Clear timer with 'stopped' reason for statistics
        this.timerManager.clearSession('stopped');
        
        // Clear running session persistence
        this.clearRunningSession();
        
        // Hide lock screen if showing
        if (this.lockScreen && this.lockScreen.isInForcedBreak) {
            this.lockScreen.forceHide();
        }
        
        // Reset to focus phase and update UI
        this.resetToFocusPhase();
        
        // Re-render to update button states and UI
        this.render();
        
        this.showNotification('Timer stopped');
    }
    
    skip() {
        // Only allow skip if a session is currently running
        if (!this.timerManager.isRunning()) {
            console.warn('Cannot skip - no session is currently running');
            return;
        }
        
        // Hide lock screen if showing
        if (this.lockScreen && this.lockScreen.isInForcedBreak) {
            this.lockScreen.forceHide();
        }
        
        // Complete current session as skipped
        this.timerManager.completeSession(true);
    }
    
    clearAllData() {
        // Show confirmation dialog
        const confirmed = confirm(
            'Are you sure you want to clear all data?\n\n' +
            'This will remove:\n' +
            '• All session history and statistics\n' +
            '• Custom settings and preferences\n' +
            '• Any saved timer state\n\n' +
            'This action cannot be undone.'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Stop any running timer
            if (this.timerManager.isRunning()) {
                this.timerManager.clearSession();
            }
            
            // Hide lock screen if showing
            if (this.lockScreen && this.lockScreen.isInForcedBreak) {
                this.lockScreen.forceHide();
            }
            
            // Clear all localStorage data
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('pomodoro') || key.includes('timer') || key.includes('session'))) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove identified keys
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Also remove specific known keys
            localStorage.removeItem('pomodoroState');
            localStorage.removeItem('pomodoroSettings');
            localStorage.removeItem('pomodoroSessions');
            localStorage.removeItem('timerState');
            
            // Reset application state to defaults
            this.settings = {
                focusDuration: 25 * 60,
                shortBreakDuration: 5 * 60,
                longBreakDuration: 15 * 60,
                sessionsUntilLongBreak: 4,
                lockScreenEnabled: true
            };
            
            this.state = {
                currentPhase: 'focus',
                currentSession: 1,
                sessions: []
            };
            
            // Reset timer manager
            this.timerManager = new TimerManager();
            this.setupTimerManager();
            
            // Reset statistics
            if (this.statistics) {
                this.statistics = new PomodoroStatistics();
                this.statistics.updateDisplay();
            }
            
            // Reset settings form
            this.initializeSettingsForm();
            
            // Reset UI
            this.render();
            this.updateStatistics();
            
            // Show success message
            console.log('All data cleared successfully');
            
            // Optional: Show a temporary success indicator
            if (this.elements.resetStateBtn) {
                const originalText = this.elements.resetStateBtn.innerHTML;
                this.elements.resetStateBtn.innerHTML = '✅';
                this.elements.resetStateBtn.style.backgroundColor = 'var(--color-success)';
                
                setTimeout(() => {
                    this.elements.resetStateBtn.innerHTML = originalText;
                    this.elements.resetStateBtn.style.backgroundColor = '';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('An error occurred while clearing data. Please try again or refresh the page.');
        }
    }
    
    emergencyStopAll() {
        // Stop current timer and clear all sessions with 'emergency' reason
        this.timerManager.clearSession('emergency');
        this.clearRunningSession();
        
        // Force hide lock screen immediately
        if (this.lockScreen && this.lockScreen.isInForcedBreak) {
            this.lockScreen.forceHide();
        }
        
        // Reset timer to focus phase (fresh start)
        this.resetToFocusPhase();
        
        // Update UI to reflect reset state
        this.render();
        
        this.showNotification('Emergency stop activated! Timer reset to focus phase.', 'warning');
    }
    
    resetToFocusPhase() {
        // Reset to initial focus state
        this.state.currentPhase = 'focus';
        // Don't reset session number - keep progress
        
        // Save the reset state
        this.saveState();
        
        // Reset progress ring if it exists
        if (this.progressRing) {
            this.progressRing.setProgress(0);
        }
    }
    
    // Session Management
    onSessionComplete(sessionData) {
        // Clear running session persistence (session is now complete)
        this.clearRunningSession();
        
        // Add to history
        this.state.sessions.push(sessionData);
        
        // Move to next phase
        const nextPhase = this.getNextPhase();
        const nextSession = this.state.currentPhase === 'focus' ? 
            this.state.currentSession + 1 : 
            this.state.currentSession;
        
        // Update state
        this.state.currentPhase = nextPhase;
        this.state.currentSession = nextSession;
        this.saveState();
        
        // Show completion animation
        if (this.progressRing) {
            this.progressRing.showCompletion();
        }
        
        // Show notification
        const action = sessionData.skipped ? 'skipped' : 'completed';
        this.showNotification(`${sessionData.type} ${action}! Starting ${nextPhase}`);
        
        // Update statistics
        this.updateStatistics();
        
        // Auto-start next phase after short delay
        setTimeout(() => {
            this.startTimer();
        }, 1000);
    }
    
    // Helper Methods
    getCurrentPhaseDuration() {
        switch (this.state.currentPhase) {
            case 'longBreak': return this.settings.longBreakDuration;
            case 'shortBreak': return this.settings.shortBreakDuration;
            default: return this.settings.focusDuration;
        }
    }
    
    getNextPhase() {
        if (this.state.currentPhase === 'focus') {
            return this.state.currentSession % this.settings.sessionsUntilLongBreak === 0 ? 
                'longBreak' : 'shortBreak';
        }
        return 'focus';
    }
    
    // Settings Methods
    autoSaveSettings() {
        this.validateAndUpdateSettings();
        this.saveSettings();
        this.updateActivePreset();
    }
    
    validateAndUpdateSettings() {
        if (!this.elements.focusDurationInput) return;
        
        const focus = Math.max(1, parseInt(this.elements.focusDurationInput.value) || 25) * 60;
        const shortBreak = Math.max(1, parseInt(this.elements.shortBreakDurationInput.value) || 5) * 60;
        const longBreak = Math.max(1, parseInt(this.elements.longBreakDurationInput.value) || 15) * 60;
        
        this.settings.focusDuration = focus;
        this.settings.shortBreakDuration = shortBreak;
        this.settings.longBreakDuration = longBreak;
        this.settings.lockScreenEnabled = this.elements.lockScreenToggle.checked;
        this.settings.notificationsEnabled = this.elements.notificationsToggle.checked;
    }
    
    resetSettings() {
        this.settings = {
            focusDuration: 25 * 60,
            shortBreakDuration: 5 * 60,
            longBreakDuration: 15 * 60,
            sessionsUntilLongBreak: 4,
            lockScreenEnabled: true,
            notificationsEnabled: true
        };
        
        this.saveSettings();
        this.initializeSettingsForm();
        this.updateActivePreset();
        this.showNotification('Settings reset to default', 'success');
    }
    
    applyPreset(chipElement) {
        const focus = parseInt(chipElement.dataset.focus) || 25;
        const shortBreak = parseInt(chipElement.dataset.short) || 5;
        const longBreak = parseInt(chipElement.dataset.long) || 15;
        
        this.settings.focusDuration = focus * 60;
        this.settings.shortBreakDuration = shortBreak * 60;
        this.settings.longBreakDuration = longBreak * 60;
        
        this.saveSettings();
        this.initializeSettingsForm();
        this.updateActivePreset();
        
        const presetName = chipElement.querySelector('.preset-label')?.textContent || 'preset';
        this.showNotification(`${presetName} preset applied`, 'success');
    }
    
    updateActivePreset() {
        const currentFocus = this.settings.focusDuration / 60;
        const currentShort = this.settings.shortBreakDuration / 60;
        const currentLong = this.settings.longBreakDuration / 60;
        
        this.elements.presetChips.forEach(chip => {
            const presetFocus = parseInt(chip.dataset.focus);
            const presetShort = parseInt(chip.dataset.short);
            const presetLong = parseInt(chip.dataset.long);
            
            if (presetFocus === currentFocus && presetShort === currentShort && presetLong === currentLong) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }
    
    // UI Updates
    render(timerData = null) {
        const isRunning = this.timerManager.isRunning();
        const remaining = timerData ? timerData.remaining : this.getCurrentPhaseDuration();
        
        // Update displays
        if (this.elements.timeDisplay) {
            this.elements.timeDisplay.textContent = this.formatTime(remaining);
        }
        
        if (this.elements.phaseDisplay) {
            this.elements.phaseDisplay.textContent = this.state.currentPhase;
        }
        
        if (this.elements.sessionDisplay) {
            this.elements.sessionDisplay.textContent = `Session ${this.state.currentSession}`;
        }
        
        // Update start button
        const buttonText = isRunning ? 'Stop' : 'Start';
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = buttonText;
        }
        if (this.elements.startBtnText) {
            this.elements.startBtnText.textContent = buttonText;
        }
        
        // Update skip button - only enabled when session is running
        if (this.elements.skipBtn) {
            this.elements.skipBtn.disabled = !isRunning;
            // Add visual indication of disabled state
            if (isRunning) {
                this.elements.skipBtn.classList.remove('disabled');
            } else {
                this.elements.skipBtn.classList.add('disabled');
            }
        }
        
        // Update colors based on phase
        const color = this.getPhaseColor(this.state.currentPhase);
        if (this.elements.progressRingElement) {
            this.elements.progressRingElement.style.stroke = color;
        }
    }
    
    updateProgressRing(timerData) {
        if (this.progressRing && timerData) {
            const progress = 1 - (timerData.remaining / timerData.total);
            this.progressRing.setProgress(progress);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    
    getPhaseColor(phase) {
        switch (phase) {
            case 'focus': return 'var(--color-primary)';
            case 'shortBreak': return 'var(--color-success)';
            case 'longBreak': return 'var(--color-info)';
            default: return 'var(--color-primary)';
        }
    }
    
    showNotification(message, variant = 'info') {
        // Always show snackbar for immediate visual feedback
        if (window.showSnackbar) {
            window.showSnackbar(message, variant);
        } else {
            console.log(`[${variant.toUpperCase()}] ${message}`);
        }
        
        // Send browser notification for important events
        if (this.shouldSendBrowserNotification(message, variant)) {
            this.sendBrowserNotification(
                this.getNotificationTitle(message, variant),
                message,
                {
                    icon: this.getNotificationIcon(),
                    tag: 'pomodoro-timer',
                    requireInteraction: false,
                    silent: false
                }
            );
        }
    }
    
    shouldSendBrowserNotification(message, variant) {
        // Send notifications for timer events, not for settings changes
        const timerKeywords = ['started', 'completed', 'skipped', 'break', 'focus', 'stopped'];
        const isTimerEvent = timerKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );
        
        // Don't send notifications if the page is visible (user is actively using it)
        const isPageHidden = document.hidden || document.visibilityState === 'hidden';
        
        return isTimerEvent && (isPageHidden || variant === 'warning');
    }
    
    getNotificationTitle(message, variant) {
        if (message.includes('started')) {
            return 'Timer Started ⏱️';
        } else if (message.includes('completed')) {
            return 'Session Complete! ✅';
        } else if (message.includes('skipped')) {
            return 'Session Skipped ⏭️';
        } else if (message.includes('break')) {
            return 'Break Time! ☕';
        } else if (message.includes('stopped')) {
            return 'Timer Stopped ⏹️';
        } else if (variant === 'warning') {
            return 'Pomodoro Alert ⚠️';
        } else {
            return 'Pomodoro Timer 🍅';
        }
    }
    
    sendBrowserNotification(title, body, options = {}) {
        // Check if notifications are supported and permitted
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        // Check if notifications are enabled in settings
        if (!this.settings.notificationsEnabled) {
            return;
        }
        
        try {
            const notification = new Notification(title, {
                body: body,
                icon: options.icon || this.getNotificationIcon(),
                tag: options.tag || 'pomodoro',
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                ...options
            });
            
            // Play notification sound (unless silent)
            if (!options.silent) {
                this.playNotificationSound(title);
            }
            
            // Auto-close notification after 5 seconds unless it requires interaction
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000);
            }
            
            // Optional: Focus app when notification is clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            console.log('Browser notification sent:', title);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    playNotificationSound(title) {
        try {
            // Create different sounds for different events
            let frequency = 800; // Default frequency
            let duration = 200; // Default duration
            
            if (title.includes('Complete')) {
                // Success sound - higher pitch, double beep
                frequency = 1200;
                duration = 150;
                this.beep(frequency, duration);
                setTimeout(() => this.beep(frequency, duration), 200);
            } else if (title.includes('Started')) {
                // Start sound - medium pitch, single beep
                frequency = 600;
                duration = 300;
                this.beep(frequency, duration);
            } else if (title.includes('Break')) {
                // Break sound - gentle, lower pitch
                frequency = 400;
                duration = 400;
                this.beep(frequency, duration);
            } else {
                // Default sound
                this.beep(frequency, duration);
            }
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }
    
    beep(frequency = 800, duration = 200) {
        try {
            // Create web audio context for beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
            
        } catch (error) {
            // Fallback: no sound if Web Audio API fails
            console.log('Web Audio API not available for beep sound');
        }
    }
    
    updateStatistics(sessionData = null) {
        let stateChanged = false;
        
        // If sessionData is provided, handle individual session tracking
        if (sessionData) {
            console.log('Statistics update:', sessionData);
            
            // Add to sessions history for completed or interrupted sessions
            if (sessionData.action !== 'started') {
                this.state.sessions.push(sessionData);
                stateChanged = true;
            }
            
            // No need for custom counter updates - Statistics module handles this
        }
        
        // Save state if any changes were made
        if (stateChanged) {
            this.saveState();
            
            // Re-render UI to reflect updated state/statistics
            this.render();
        }
        
        // Always update statistics display using existing statistics module
        if (this.statistics && this.statistics.updateDisplay) {
            console.log('Updating statistics display with', this.state.sessions.length, 'sessions');
            console.log('Current sessions:', this.state.sessions);
            this.statistics.updateDisplay(this.state.sessions);
        } else {
            console.warn('Statistics not available for update:', {
                hasStatistics: !!this.statistics,
                hasUpdateDisplay: !!(this.statistics && this.statistics.updateDisplay),
                windowPomodoroStatistics: !!window.PomodoroStatistics
            });
        }
        
        // Trigger statistics update event for advanced charts
        document.dispatchEvent(new CustomEvent('pomodoroStatsUpdated', {
            detail: { 
                sessions: this.state.sessions,
                currentPhase: this.state.currentPhase,
                currentSession: this.state.currentSession
            }
        }));
    }

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();
    console.log('Pomodoro Timer initialized with TimerManager and full features!');
});