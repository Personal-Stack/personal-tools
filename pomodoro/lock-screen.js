/**
 * Lock Screen Manager for Pomodoro Timer
 * Handles break overlay display, progress tracking, and emergency stop functionality
 */

class LockScreenManager {
    constructor(pomodoroTimer) {
        this.pomodoroTimer = pomodoroTimer;
        this.isInForcedBreak = false;
        this.breakStartTime = null;
        this.breakDuration = 0; // in seconds
        this.breakPhase = null; // 'shortBreak' or 'longBreak'
        this.breakInterval = null;
        
        this.elements = {};
        this.init();
    }
    
    init() {
        this.initElements();
        this.setupEventListeners();
    }
    
    initElements() {
        this.elements = {
            breakOverlay: document.getElementById('break-overlay'),
            breakTimer: document.getElementById('break-timer'),
            breakProgressFill: document.getElementById('break-progress-fill'),
            breakProgressText: document.getElementById('break-progress-text'),
            breakTitle: document.querySelector('.break-title'),
            breakMessage: document.querySelector('.break-message')
        };
        
        // Verify critical elements exist
        if (!this.elements.breakOverlay) {
            console.error('Break overlay element not found');
            console.error('🔒 LockScreen: DOM state when searching for break-overlay:', document.readyState);
            console.error('🔒 LockScreen: Available elements with break in id/class:', 
                [...document.querySelectorAll('*')].filter(el => 
                    el.id.includes('break') || el.className.includes('break')
                ).map(el => ({id: el.id, className: el.className}))
            );
            return false;
        }
        
        return true;
    }
    
    setupEventListeners() {
        // Store reference to avoid multiple listeners
        this.keyHandler = (e) => {
            
            // Emergency stop hotkey (Alt + Shift + E)
            if (e.altKey && e.shiftKey && e.code === 'KeyE') {
                e.preventDefault();
                e.stopPropagation();
                
                // Call main timer's emergency stop directly
                if (window.pomodoroTimer && typeof window.pomodoroTimer.executeEmergencyStop === 'function') {
                    window.pomodoroTimer.executeEmergencyStop();
                } else {
                    this.emergencyStop();
                }
                return;
            }
            
            // Only block other keys if we're in a forced break
            if (this.isInForcedBreak) {
                // Block other potential exit keys during break
                if (e.key === 'F11' || e.key === 'Escape' || 
                    (e.ctrlKey && (e.key === 'w' || e.key === 'W'))) {
                    console.log('🔒 LockScreen: Blocked key:', e.key);
                    e.preventDefault();
                }
            }
        };
        
        // Add event listener with capture to handle before other listeners
        document.addEventListener('keydown', this.keyHandler, true);
        
        // Prevent context menu during break
        document.addEventListener('contextmenu', (e) => {
            if (this.isInForcedBreak) {
                console.log('🔒 LockScreen: Blocked context menu');
                e.preventDefault();
            }
        });
        
        // Handle visibility change (prevent easy exit by switching tabs)
        document.addEventListener('visibilitychange', () => {
            if (this.isInForcedBreak && document.hidden) {
                console.log('🔒 LockScreen: User tried to hide during break');
                // Optionally show a notification or log this behavior
            }
        });
    }
    
    /**
     * Show the break lock screen
     * @param {string} phase - 'shortBreak' or  'longBreak'
     * @param {number} duration - Break duration in minutes
     */
    showBreakScreen(phase, duration) {
      console.log('🔒 LockScreen: Showing break screen for', phase, 'duration:', duration, 'minutes');
        if (!this.elements.breakOverlay) {
            console.error('Cannot show break screen - overlay not found');
            return;
        }
        
        this.isInForcedBreak = true;
        this.breakStartTime = Date.now();
        this.breakDuration = duration * 60; // convert to seconds
        this.breakPhase = phase;
        
        // Update break screen content
        this.updateBreakContent(phase, duration);
        
        // Show the overlay
        this.elements.breakOverlay.classList.remove('hidden');
        
        // Request fullscreen for immersive break experience in PWA mode
        if (this.isPWAMode()) {
            setTimeout(() => {
                this.requestFullscreen();
            }, 100); // Small delay to ensure overlay is visible first
        }
        
        // Start the break timer
        this.startBreakTimer();
        
        // Disable main timer controls
        this.disableMainControls();
        
        // Show notification
        this.showNotification(`${this.getPhaseDisplayName(phase)} started! Take a break for ${duration} minutes.`, 'info');
    }
    
    /**
     * Hide the break lock screen
     */
    hideBreakScreen() {
        if (!this.isInForcedBreak) return;
        
        console.log('🔒 LockScreen: Ending break screen');
        
        this.isInForcedBreak = false;
        this.breakStartTime = null;
        this.breakPhase = null;
        
        // Exit fullscreen first
        this.exitFullscreen();
        
        // Hide the overlay
        if (this.elements.breakOverlay) {
            this.elements.breakOverlay.classList.add('hidden');
        }
        
        // Stop the break timer
        this.stopBreakTimer();
        
        // Re-enable main timer controls
        this.enableMainControls();
        
        // Show completion notification
        this.showNotification('Break completed! Ready for your next focus session.', 'success');
    }
    
    updateBreakContent(phase, duration) {
        const displayName = this.getPhaseDisplayName(phase);
        const icon = phase === 'longBreak' ? '🌟' : '☕';
        const message = phase === 'longBreak' 
            ? 'Take a longer break to fully recharge your energy.'
            : 'Take a moment to rest your mind and body.';
        
        // Update title and message
        if (this.elements.breakTitle) {
            this.elements.breakTitle.textContent = `${displayName}!`;
        }
        
        if (this.elements.breakMessage) {
            this.elements.breakMessage.textContent = message;
        }
        
        // Update icon
        const breakIcon = document.querySelector('.break-icon');
        if (breakIcon) {
            breakIcon.textContent = icon;
        }
        
        // Initialize timer display
        if (this.elements.breakTimer) {
            this.elements.breakTimer.textContent = this.formatTime(duration * 60);
        }
        
        // Reset progress
        if (this.elements.breakProgressFill) {
            this.elements.breakProgressFill.style.width = '0%';
        }
        if (this.elements.breakProgressText) {
            this.elements.breakProgressText.textContent = '0% complete';
        }
    }
    
    startBreakTimer() {
        this.breakInterval = setInterval(() => {
            this.updateBreakProgress();
        }, 1000);
    }
    
    stopBreakTimer() {
        if (this.breakInterval) {
            clearInterval(this.breakInterval);
            this.breakInterval = null;
        }
    }
    
    updateBreakProgress() {
        // Double-check we're still in a valid break state
        if (!this.isInForcedBreak || !this.breakStartTime || !this.breakInterval) {
            console.log('🔒 LockScreen: Break progress update called but not in valid break state, stopping');
            this.stopBreakTimer();
            return;
        }
        
        const now = Date.now();
        const elapsed = (now - this.breakStartTime) / 1000; // in seconds
        const remaining = Math.max(0, this.breakDuration - elapsed);
        
        // Update timer display only if still in break
        if (this.elements.breakTimer && this.isInForcedBreak) {
            this.elements.breakTimer.textContent = this.formatTime(Math.ceil(remaining));
        }
        
        // Update progress bar only if still in break
        if (this.isInForcedBreak) {
            const progressPercent = ((this.breakDuration - remaining) / this.breakDuration) * 100;
            if (this.elements.breakProgressFill) {
                this.elements.breakProgressFill.style.width = `${Math.min(100, progressPercent)}%`;
            }
            if (this.elements.breakProgressText) {
                this.elements.breakProgressText.textContent = `${Math.round(progressPercent)}% complete`;
            }
        }
        
        // Check if break is complete (only if still in valid break state)
        if (remaining <= 0 && this.isInForcedBreak) {
            this.completeBreak();
        }
    }
    
    completeBreak() {
        // Safety check - don't complete if we're not in a valid break state
        if (!this.isInForcedBreak || !this.breakStartTime) {
            console.log('🔒 LockScreen: Break completion called but not in valid break state');
            return;
        }
        
        console.log('🔒 LockScreen: Break completed naturally');
        
        // Record break completion
        this.recordBreakCompletion(true);
        
        // Hide break screen
        this.hideBreakScreen();
        
        // Notify main timer that break is complete
        if (this.pomodoroTimer && typeof this.pomodoroTimer.onBreakCompleted === 'function') {
            this.pomodoroTimer.onBreakCompleted();
        }
    }
    
    emergencyStop() {
        // Stop break timer
        this.stopBreakTimer();
        
        // Hide lock screen
        this.forceHide();
        
        // Record break interruption
        if (this.breakStartTime) {
            this.recordBreakCompletion(false);
        }
        
        // Stop main timer
        if (this.pomodoroTimer && typeof this.pomodoroTimer.emergencyStopAll === 'function') {
            this.pomodoroTimer.emergencyStopAll();
        } else if (window.pomodoroTimer && typeof window.pomodoroTimer.emergencyStopAll === 'function') {
            window.pomodoroTimer.emergencyStopAll();
        } else if (window.pomodoroTimer) {
            // Manual fallback
            window.pomodoroTimer.stopTicking();
            window.pomodoroTimer.updateState(state => ({
                currentPhase: 'focus',
                isRunning: false,
                sessionStartTime: null,
                sessionExpectedDuration: null,
                pausedAt: null,
                totalPausedTime: 0
            }), true);
            window.pomodoroTimer.render();
        }
        
        // Show notification
        if (window.pomodoroTimer && typeof window.pomodoroTimer.showNotification === 'function') {
            window.pomodoroTimer.showNotification('⚠️ Break interrupted by emergency stop!', 'warning');
        }
    }
    
    forceHide() {
        // Stop all intervals first
        this.stopBreakTimer();
        
        // Set flags to prevent any further updates
        this.isInForcedBreak = false;
        this.breakStartTime = null;
        this.breakPhase = null;
        
        // Exit fullscreen first
        this.exitFullscreen();
        
        // Hide the overlay
        if (this.elements.breakOverlay) {
            this.elements.breakOverlay.classList.add('hidden');
            this.elements.breakOverlay.style.display = 'none';
        }
        
        // Re-enable main timer controls
        this.enableMainControls();
    }
    
    recordBreakCompletion(completed) {
        if (!this.breakStartTime) return;
        
        const actualDuration = (Date.now() - this.breakStartTime) / 1000;
        const expectedDuration = this.breakDuration;
        
        const breakRecord = {
            phase: this.breakPhase,
            startTime: this.breakStartTime,
            endTime: Date.now(),
            expectedDuration: expectedDuration,
            actualDuration: Math.round(actualDuration),
            completed: completed,
            emergencyStop: !completed
        };
        
        console.log('🔒 LockScreen: Recording break:', breakRecord);
        
        // Add to main timer's session history if available
        if (this.pomodoroTimer && this.pomodoroTimer.state && this.pomodoroTimer.state.sessions) {
            this.pomodoroTimer.updateState(state => ({
                sessions: [...state.sessions, breakRecord]
            }), true);
        }
    }
    
    disableMainControls() {
        // Disable main timer buttons during break
        const startBtn = document.getElementById('start-pause-btn');
        const skipBtn = document.getElementById('skip-btn');
        
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
        }
        if (skipBtn) {
            skipBtn.disabled = true;
            skipBtn.style.opacity = '0.5';
        }
    }
    
    enableMainControls() {
        // Re-enable main timer buttons after break
        const startBtn = document.getElementById('start-pause-btn');
        const skipBtn = document.getElementById('skip-btn');
        
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
        }
        if (skipBtn) {
            skipBtn.disabled = false;
            skipBtn.style.opacity = '1';
        }
    }
    
    isPWAMode() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }
    
    isFullscreen() {
        return !!(document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement);
    }
    
    requestFullscreen() {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    console.log('🔒 LockScreen: Fullscreen not supported or denied');
                });
            }
        } catch (error) {
            console.log('🔒 LockScreen: Fullscreen request failed');
        }
    }
    
    exitFullscreen() {
        try {
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen();
            }
        } catch (error) {
            console.log('🔒 LockScreen: Exit fullscreen failed');
        }
    }
    
    // Utility methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    getPhaseDisplayName(phase) {
        switch (phase) {
            case 'shortBreak': return 'Short Break';
            case 'longBreak': return 'Long Break';
            default: return 'Break Time';
        }
    }
    
    showNotification(message, variant = 'info') {
        // Use design system snackbar if available
        if (typeof SnackbarManager !== 'undefined' && SnackbarManager.instance) {
            SnackbarManager.instance.show(message, { variant, duration: 3000 });
        } else if (typeof window !== 'undefined' && window.snackbar) {
            // Use the appropriate method based on variant
            if (window.snackbar[variant]) {
                window.snackbar[variant](message, { duration: 3000 });
            } else {
                window.snackbar.show(message, { variant, duration: 3000 });
            }
        } else {
            console.log(`🔒 LockScreen [${variant.toUpperCase()}]:`, message);
        }
    }
    
    // Public getters
    get isLocked() {
        return this.isInForcedBreak;
    }
    
    get currentBreakPhase() {
        return this.breakPhase;
    }
    
    get timeRemaining() {
        if (!this.isInForcedBreak || !this.breakStartTime) return 0;
        
        const elapsed = (Date.now() - this.breakStartTime) / 1000;
        return Math.max(0, this.breakDuration - elapsed);
    }
    

}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LockScreenManager;
} else {
    // Make available globally for browser usage
    window.LockScreenManager = LockScreenManager;
}