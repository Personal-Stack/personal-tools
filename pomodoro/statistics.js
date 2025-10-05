/**
 * Statistics Manager for Pomodoro Timer
 * Handles session tracking, analysis, and display
 */

class PomodoroStatistics {
    constructor() {
        this.elements = {};
        this.initElements();
    }
    
    initElements() {
        this.elements = {
            totalSessions: document.getElementById('total-sessions'),
            completedSessions: document.getElementById('completed-sessions'),
            totalFocusTime: document.getElementById('total-focus-time'),
            avgSessionLength: document.getElementById('avg-session-length'),
            completionRate: document.getElementById('completion-rate'),
            currentStreak: document.getElementById('current-streak'),
            longestStreak: document.getElementById('longest-streak'),
            todaysSessions: document.getElementById('todays-sessions'),
            emergencyStops: document.getElementById('emergency-stops'),
            focusEfficiency: document.getElementById('focus-efficiency'),
            avgBreakLength: document.getElementById('avg-break-length'),
            sessionConsistency: document.getElementById('session-consistency')
        };
        
        // Debug: Check which elements were found
        const foundElements = Object.entries(this.elements).filter(([_, el]) => el !== null);
        const missingElements = Object.entries(this.elements).filter(([_, el]) => el === null);
        
        console.log('Statistics elements found:', foundElements.length, 'out of', Object.keys(this.elements).length);
        if (missingElements.length > 0) {
            console.warn('Missing statistics elements:', missingElements.map(([key, _]) => key));
        }
    }
    
    /**
     * Calculate comprehensive statistics from session history
     * @param {Array} sessions - Array of session records
     * @returns {Object} Statistics object
     */
    calculateStats(sessions) {
        if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
            return this.getEmptyStats();
        }
        
        // Validate and clean session data
        const validSessions = sessions.filter(s => {
            if (!s || typeof s !== 'object') {
                return false;
            }
            if (typeof s.actualDuration !== 'number' || s.actualDuration < 0 || s.actualDuration > 7200) { // max 2 hours
                return false;
            }
            return true;
        });
        

        
        if (validSessions.length === 0) {
            return this.getEmptyStats();
        }
        

        
        // Use validSessions instead of original sessions
        const today = new Date().toDateString();
        
        // Filter focus sessions - check both 'phase' and 'type' properties for compatibility
        const focusSessions = validSessions.filter(s => s.phase === 'focus' || s.type === 'focus');
        const breakSessions = validSessions.filter(s => 
            (s.phase && s.phase !== 'focus') || (s.type && s.type !== 'focus')
        );
        

        
        // Count sessions as completed based on timing: session should run until expectedEndTime
        const completedSessions = validSessions.filter(s => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) {
                return false;
            }
            
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000); // convert seconds to ms
            const actualEndTime = s.endTime;
            
            // Session is completed if it wasn't stopped early (within 5 second tolerance for natural variance)
            const tolerance = 5000; // 5 seconds in milliseconds
            const wasStoppedEarly = (expectedEndTime - actualEndTime) > tolerance;
            const isCompleted = !wasStoppedEarly;
            
            // Uncomment for debugging: 
            // console.log('Session completion check:', {
            //     expectedEndTime: new Date(expectedEndTime),
            //     actualEndTime: new Date(actualEndTime), 
            //     expectedDuration: s.expectedDuration,
            //     wasStoppedEarly,
            //     isCompleted,
            //     timeDifference: (expectedEndTime - actualEndTime) / 1000 + 's'
            // });
            
            return isCompleted;
        });
        
        const todaySessions = validSessions.filter(s => {
            try {
                return s.startTime && new Date(s.startTime).toDateString() === today;
            } catch (e) {
                console.warn('Invalid startTime in session:', s);
                return false;
            }
        });
        
        console.log('Filtered sessions:', {
            total: sessions.length,
            focus: focusSessions.length,
            break: breakSessions.length,
            completed: completedSessions.length,
            today: todaySessions.length
        });
        
        // Basic metrics
        const totalSessions = sessions.length;
        const completedCount = completedSessions.length;
        const completionRate = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
        
        // Time metrics (convert seconds to minutes) with detailed debugging
        // Use the same completion logic for focus and break sessions
        const completedFocusSessions = focusSessions.filter(s => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return false;
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return !wasStoppedEarly;
        });
        const completedBreakSessions = breakSessions.filter(s => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return false;
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return !wasStoppedEarly;
        });
        
        // Debug individual session durations
        
        
        // Calculate total focus time in minutes (include all focus sessions, not just completed)
        const totalFocusTimeSeconds = focusSessions.reduce((sum, s) => {
            const duration = Number(s.actualDuration) || 0;
            return sum + duration;
        }, 0);
        const totalFocusTime = totalFocusTimeSeconds / 60;
        
        // Calculate total break time in minutes (include all break sessions, not just completed)  
        const totalBreakTimeSeconds = breakSessions.reduce((sum, s) => {
            const duration = Number(s.actualDuration) || 0;
            return sum + duration;
        }, 0);
        const totalBreakTime = totalBreakTimeSeconds / 60;
        
        // Calculate average session length (include all sessions with valid duration)
        const sessionsWithDuration = validSessions.filter(s => s.actualDuration > 0);
        const avgSessionLength = sessionsWithDuration.length > 0
            ? sessionsWithDuration.reduce((sum, s) => {
                const duration = Number(s.actualDuration) || 0;
                return sum + duration;
            }, 0) / sessionsWithDuration.length / 60
            : 0;
        
        // Calculate average break length (include all break sessions with valid duration)
        const breakSessionsWithDuration = breakSessions.filter(s => s.actualDuration > 0);
        const avgBreakLength = breakSessionsWithDuration.length > 0
            ? totalBreakTimeSeconds / breakSessionsWithDuration.length / 60
            : 0;
        

        
        // Streak calculation
        const streaks = this.calculateStreaks(sessions);
        
        // Advanced metrics - count sessions that were stopped early (not completed based on timing)
        const emergencyStops = validSessions.filter(s => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return true; // invalid sessions count as stops
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return wasStoppedEarly; // stopped early
        }).length;
        const focusEfficiency = this.calculateFocusEfficiency(sessions);
        const sessionConsistency = this.calculateSessionConsistency(focusSessions);
        
        const result = {
            totalSessions: Number(totalSessions) || 0,
            completedSessions: Number(completedCount) || 0,
            completionRate: Number(completionRate) || 0,
            totalFocusTime: Number(totalFocusTime) || 0,
            totalBreakTime: Number(totalBreakTime) || 0,
            avgSessionLength: Number.isFinite(avgSessionLength) ? Number(avgSessionLength) : 0,
            avgBreakLength: Number.isFinite(avgBreakLength) ? Number(avgBreakLength) : 0,
            currentStreak: Number(streaks.current) || 0,
            longestStreak: Number(streaks.longest) || 0,
            todaysSessions: Number(todaySessions.length) || 0,
            emergencyStops: Number(emergencyStops) || 0,
            focusEfficiency: Number.isFinite(focusEfficiency) ? Number(focusEfficiency) : 100,
            sessionConsistency: Number.isFinite(sessionConsistency) ? Number(sessionConsistency) : 100,
            // Raw data for further analysis (using different property names to avoid conflicts)
            rawSessions: validSessions,
            rawFocusSessions: focusSessions,
            rawBreakSessions: breakSessions,
            rawCompletedSessions: completedSessions,
            rawTodaySessions: todaySessions
        };
        

        return result;
    }
    
    /**
     * Calculate current and longest streaks
     */
    calculateStreaks(sessions) {
        if (sessions.length === 0) return { current: 0, longest: 0 };
        
        // Sort sessions by start time
        const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Helper function to check if session is completed based on timing
        const isSessionCompleted = (s) => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return false;
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return !wasStoppedEarly;
        };
        
        // Calculate streaks based on completed focus sessions
        for (const session of sortedSessions) {
            const isFocusSession = session.phase === 'focus' || session.type === 'focus';
            if (isFocusSession && isSessionCompleted(session)) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else if (isFocusSession && !isSessionCompleted(session)) {
                tempStreak = 0;
            }
        }
        
        // Current streak is from the end
        for (let i = sortedSessions.length - 1; i >= 0; i--) {
            const session = sortedSessions[i];
            const isFocusSession = session.phase === 'focus' || session.type === 'focus';
            if (isFocusSession) {
                if (isSessionCompleted(session)) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
        
        return { current: currentStreak, longest: longestStreak };
    }
    
    /**
     * Calculate focus efficiency (ratio of completed focus sessions vs all attempted focus sessions)
     */
    calculateFocusEfficiency(sessions) {
        // Helper function to check if session is completed based on timing
        const isSessionCompleted = (s) => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return false;
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return !wasStoppedEarly;
        };
        
        // Get all focus sessions (attempted) - check both 'phase' and 'type' for compatibility
        const allFocusSessions = sessions.filter(s => s.phase === 'focus' || s.type === 'focus');
        
        if (allFocusSessions.length === 0) {
            return 100;
        }
        
        // Get only completed focus sessions (finished at the right time)
        const completedFocusSessions = allFocusSessions.filter(s => isSessionCompleted(s));
        
        // Efficiency = (completed focus sessions / total focus sessions attempted) * 100
        const efficiency = (completedFocusSessions.length / allFocusSessions.length) * 100;
        
        return efficiency;
    }
    
    /**
     * Calculate session consistency (how close actual duration is to expected)
     */
    calculateSessionConsistency(focusSessions) {
        if (focusSessions.length === 0) return 100;
        
        // Helper function to check if session is completed based on timing
        const isSessionCompleted = (s) => {
            if (!s.startTime || !s.endTime || !s.expectedDuration) return false;
            const expectedEndTime = s.startTime + (s.expectedDuration * 1000);
            const tolerance = 5000; // 5 seconds tolerance
            const wasStoppedEarly = (expectedEndTime - s.endTime) > tolerance;
            return !wasStoppedEarly;
        };
        
        const consistencyRatios = focusSessions
            .filter(s => isSessionCompleted(s) && s.expectedDuration > 0)
            .map(s => {
                const ratio = s.actualDuration / s.expectedDuration;
                // How close to 1.0 (perfect consistency)
                return 1 - Math.abs(1 - ratio);
            });
        
        if (consistencyRatios.length === 0) return 100;
        
        const avgConsistency = consistencyRatios.reduce((sum, ratio) => sum + ratio, 0) / consistencyRatios.length;
        return Math.max(0, avgConsistency * 100);
    }
    
    /**
     * Get empty stats object
     */
    getEmptyStats() {
        return {
            totalSessions: 0,
            completedSessions: 0,
            completionRate: 0,
            totalFocusTime: 0,
            totalBreakTime: 0,
            avgSessionLength: 0,
            avgBreakLength: 0,
            currentStreak: 0,
            longestStreak: 0,
            todaysSessions: 0,
            emergencyStops: 0,
            focusEfficiency: 100,
            sessionConsistency: 100
        };
    }
    
    /**
     * Format time in minutes with proper units
     */
    formatMinutes(minutes) {
        const validMinutes = Number.isFinite(minutes) ? Number(minutes) : 0;
        
        if (validMinutes <= 0) {
            return '0s';
        } else if (validMinutes < 1) {
            const seconds = Math.round(validMinutes * 60);
            return seconds > 0 ? seconds + 's' : '0s';
        } else if (validMinutes < 60) {
            return Math.round(validMinutes) + 'm';
        } else {
            const hours = Math.floor(validMinutes / 60);
            const mins = Math.round(validMinutes % 60);
            return hours + 'h' + (mins > 0 ? ' ' + mins + 'm' : '');
        }
    }
    
    /**
     * Format percentage with one decimal place
     */
    formatPercentage(percent) {
        const validPercent = Number(percent) || 0;
        return Math.round(validPercent * 10) / 10 + '%';
    }
    
    /**
     * Update the statistics display
     * @param {Array} sessions - Session history
     */
    updateDisplay(sessions) {
        const stats = this.calculateStats(sessions);
        
        // Update basic stats with safe fallbacks
        if (this.elements.totalSessions) {
            const totalCount = Number(stats.totalSessions) || 0;
            this.elements.totalSessions.textContent = totalCount;
            console.log('Updated total sessions to:', totalCount);
        } else {
            console.warn('totalSessions element not found');
        }
        
        if (this.elements.completedSessions) {
            const completedCount = Number(stats.completedSessions) || 0;
            this.elements.completedSessions.textContent = completedCount;
        }
        
        if (this.elements.totalFocusTime) {
            const focusTime = Number.isFinite(stats.totalFocusTime) ? stats.totalFocusTime : 0;
            this.elements.totalFocusTime.textContent = this.formatMinutes(focusTime);
        }
        
        if (this.elements.avgSessionLength) {
            const avgLength = Number.isFinite(stats.avgSessionLength) ? stats.avgSessionLength : 0;
            this.elements.avgSessionLength.textContent = this.formatMinutes(avgLength);
        }
        
        // Update advanced stats with safe fallbacks
        if (this.elements.completionRate) {
            const rate = Number.isFinite(stats.completionRate) ? stats.completionRate : 0;
            this.elements.completionRate.textContent = this.formatPercentage(rate);
        }
        
        if (this.elements.currentStreak) {
            const currentStreak = Number(stats.currentStreak) || 0;
            this.elements.currentStreak.textContent = currentStreak;
        }
        
        if (this.elements.longestStreak) {
            const longestStreak = Number(stats.longestStreak) || 0;
            this.elements.longestStreak.textContent = longestStreak;
        }
        
        if (this.elements.todaysSessions) {
            const todayCount = Number(stats.todaysSessions) || 0;
            this.elements.todaysSessions.textContent = todayCount;
        }
        
        if (this.elements.emergencyStops) {
            const emergencyCount = Number(stats.emergencyStops) || 0;
            this.elements.emergencyStops.textContent = emergencyCount;
        }
        
        if (this.elements.focusEfficiency) {
            const efficiency = Number.isFinite(stats.focusEfficiency) ? stats.focusEfficiency : 100;
            this.elements.focusEfficiency.textContent = this.formatPercentage(efficiency);
        }
        
        if (this.elements.avgBreakLength) {
            const avgBreak = Number.isFinite(stats.avgBreakLength) ? stats.avgBreakLength : 0;
            this.elements.avgBreakLength.textContent = this.formatMinutes(avgBreak);
        }
        
        if (this.elements.sessionConsistency) {
            const consistency = Number.isFinite(stats.sessionConsistency) ? stats.sessionConsistency : 100;
            this.elements.sessionConsistency.textContent = this.formatPercentage(consistency);
        }
        
        return stats;
    }
    
    /**
     * Get detailed session insights
     */
    getInsights(sessions) {
        const stats = this.calculateStats(sessions);
        const insights = [];
        
        if (stats.completionRate < 50) {
            insights.push('Consider shorter sessions to improve completion rate');
        }
        
        if (stats.focusEfficiency < 80) {
            insights.push('Try to minimize pauses during focus sessions');
        }
        
        if (stats.currentStreak >= 5) {
            insights.push('Great streak! Keep up the momentum');
        }
        
        if (stats.todaysSessions === 0) {
            insights.push('Start your first session today!');
        }
        
        return insights;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PomodoroStatistics;
} else if (typeof window !== 'undefined') {
    window.PomodoroStatistics = PomodoroStatistics;
}