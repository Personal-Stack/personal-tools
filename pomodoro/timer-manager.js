/**
 * Timer Manager - Centralized session management
 * Handles starting, stopping, and tracking all timer sessions
 */
class TimerManager {
    constructor() {
        this.currentSession = null;
        this.tickInterval = null;
        this.onTick = null; // Callback for UI updates
        this.onComplete = null; // Callback when session completes
        this.onStatistics = null; // Callback for statistics updates
    }

    /**
     * Start a new session
     * @param {string} type - 'focus', 'shortBreak', or 'longBreak'
     * @param {number} duration - Duration in seconds
     * @param {Function} onComplete - Called when session completes
     * @param {Function} onStart - Called immediately after session starts (optional)
     */
    runSession(type, duration, onComplete, onStart = null) {
        // Always clear any existing session first
        this.clearSession();
        
        const startTime = Date.now();
        
        // Create new session object
        this.currentSession = {
            type,
            duration,
            startTime,
            endTime: startTime + (duration * 1000),
            completed: false,
            onComplete: onComplete
        };
        
        // Start the tick interval
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 100); // Update every 100ms for smooth UI
        
        console.log(`Timer started: ${type} for ${duration}s`);
        
        // Track session start for statistics
        const startData = {
            phase: type, // Statistics module expects 'phase'
            type: type,  // Keep for backward compatibility
            startTime: startTime,
            expectedDuration: duration,
            action: 'started'
        };
        this.updateStatistics(startData);
        
        // Initial tick
        this.tick();
        
        console.log('TimerManager: onStart callback:', onStart);
        // Execute immediate callback (e.g., show lock screen)
        if (onStart) {
            onStart();
        }
    }
    
    /**
     * Clear/stop the current session
     * @param {string} reason - Reason for clearing ('stopped', 'emergency', 'reset', etc.)
     */
    clearSession(reason = 'stopped') {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        
        // Track incomplete sessions for statistics
        if (this.currentSession && !this.currentSession.completed) {
            console.log(`Timer cleared: ${this.currentSession.type} (${reason})`);
            
            // Create session data for interrupted session
            const sessionData = {
                phase: this.currentSession.type, // Statistics module expects 'phase'
                type: this.currentSession.type,  // Keep for backward compatibility
                startTime: this.currentSession.startTime,
                endTime: Date.now(),
                expectedDuration: this.currentSession.duration,
                actualDuration: this.getElapsedTime(),
                completed: false,
                skipped: false,
                stopped: reason === 'stopped',
                emergency: reason === 'emergency',
                interrupted: true,
                reason: reason
            };
            
            // Update statistics for interrupted session
            this.updateStatistics(sessionData);
        }
        
        this.currentSession = null;
    }
    
    /**
     * Update statistics with completed session
     * @param {Object} sessionObj - Session data to record
     */
    updateStatistics(sessionObj) {
        if (this.onStatistics) {
            this.onStatistics(sessionObj);
        }
    }
    
    /**
     * Get remaining time in current session
     * @returns {number} Remaining seconds, or 0 if no session
     */
    getRemainingTime() {
        if (!this.currentSession) return 0;
        
        const now = Date.now();
        const remaining = Math.max(0, this.currentSession.endTime - now);
        return Math.ceil(remaining / 1000);
    }
    
    /**
     * Get elapsed time in current session
     * @returns {number} Elapsed seconds, or 0 if no session
     */
    getElapsedTime() {
        if (!this.currentSession) return 0;
        
        const now = Date.now();
        const elapsed = now - this.currentSession.startTime;
        return Math.floor(elapsed / 1000);
    }
    
    /**
     * Check if a session is currently running
     * @returns {boolean}
     */
    isRunning() {
        return this.currentSession !== null && !this.currentSession.completed;
    }
    
    /**
     * Get current session info
     * @returns {Object|null}
     */
    getCurrentSession() {
        return this.currentSession;
    }
    
    /**
     * Force complete the current session
     * @param {boolean} wasSkipped - Whether session was skipped vs naturally completed
     */
    completeSession(wasSkipped = false) {
        if (!this.currentSession) return;
        
        const session = this.currentSession;
        const actualDuration = this.getElapsedTime();
        
        // Mark as completed
        session.completed = true;
        session.actualDuration = actualDuration;
        session.wasSkipped = wasSkipped;
        
        // Clear the timer
        this.clearSession();
        
        // Update statistics
        const sessionData = {
            phase: session.type, // Statistics module expects 'phase'
            type: session.type,  // Keep for backward compatibility
            startTime: session.startTime,
            endTime: Date.now(),
            expectedDuration: session.duration,
            actualDuration: actualDuration,
            completed: !wasSkipped,
            skipped: wasSkipped
        };
        
        this.updateStatistics(sessionData);
        
        console.log(`Session completed: ${session.type}, duration: ${actualDuration}s${wasSkipped ? ' (skipped)' : ''}`);
        
        // Call completion callback
        if (session.onComplete) {
            session.onComplete(sessionData);
        }
    }
    
    /**
     * Internal tick handler
     */
    tick() {
        if (!this.currentSession || this.currentSession.completed) {
            return;
        }
        
        const remaining = this.getRemainingTime();
        
        // Call tick callback for UI updates
        if (this.onTick) {
            this.onTick({
                remaining,
                elapsed: this.getElapsedTime(),
                total: this.currentSession.duration,
                type: this.currentSession.type
            });
        }
        
        // Check if session is complete
        if (remaining <= 0) {
            this.completeSession(false); // Natural completion
        }
    }
    
    /**
     * Set callback for tick events (UI updates)
     * @param {Function} callback
     */
    setTickCallback(callback) {
        this.onTick = callback;
    }
    
    /**
     * Set callback for session completion
     * @param {Function} callback
     */
    setCompletionCallback(callback) {
        this.onComplete = callback;
    }
    
    /**
     * Set callback for statistics updates
     * @param {Function} callback
     */
    setStatisticsCallback(callback) {
        this.onStatistics = callback;
    }
}

// Export for use in other modules
window.TimerManager = TimerManager;