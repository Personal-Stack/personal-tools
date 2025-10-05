/**
 * Progress Ring Component
 * Handles circular progress animation for timers
 */

class ProgressRing {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            radius: options.radius || 140,
            strokeWidth: options.strokeWidth || 8,
            duration: options.duration || 300, // animation duration in ms
            ...options
        };
        
        this.circumference = 2 * Math.PI * this.options.radius;
        this.init();
    }
    
    init() {
        if (!this.element) {
            console.error('Progress ring element not found');
            return;
        }
        
        // Set up the stroke-dasharray for the progress circle
        this.element.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.element.style.strokeDashoffset = this.circumference;
        
        // Transform to start from top (12 o'clock position)
        this.element.style.transform = 'rotate(-90deg)';
        this.element.style.transformOrigin = '50% 50%';
        
        // Set initial transition
        this.element.style.transition = `stroke-dashoffset 0.1s ease-out`;
    }
    
    /**
     * Set progress as a percentage (0-100)
     * @param {number} percent - Progress percentage (0-100)
     */
    setProgress(percent) {
        const validPercent = Math.max(0, Math.min(100, percent));
        const offset = this.circumference - (validPercent / 100) * this.circumference;
        
        if (this.element) {
            this.element.style.strokeDashoffset = offset;
        }
    }
    
    /**
     * Set progress with smooth animation - optimized for 60fps updates
     * @param {number} percent - Progress percentage (0-100)
     */
    setSmoothProgress(percent) {
        if (this.element) {
            // Remove all transitions for ultra-smooth continuous updates
            this.element.style.transition = 'none';
            this.setProgress(percent);
        }
    }
    
    /**
     * Enable smooth transitions for discrete updates (like phase changes)
     */
    enableTransitions() {
        if (this.element) {
            this.element.style.transition = 'stroke 0.2s ease';
        }
    }
    
    /**
     * Set progress based on time remaining
     * @param {number} remaining - Time remaining in seconds
     * @param {number} total - Total time in seconds
     */
    setTimeProgress(remaining, total) {
        if (total <= 0) {
            this.setProgress(0);
            return;
        }
        
        const elapsed = total - remaining;
        const percent = (elapsed / total) * 100;
        this.setProgress(percent);
    }
    
    /**
     * Reset progress to 0
     */
    reset() {
        this.setProgress(0);
    }
    
    /**
     * Complete progress (set to 100%)
     */
    complete() {
        this.setProgress(100);
    }
    
    /**
     * Animate to a specific progress over time
     * @param {number} targetPercent - Target progress percentage
     * @param {number} duration - Animation duration in ms (optional)
     */
    animateTo(targetPercent, duration = null) {
        const animDuration = duration || this.options.duration;
        
        if (this.element) {
            this.element.style.transition = `stroke-dashoffset ${animDuration}ms ease-in-out`;
            this.setProgress(targetPercent);
        }
    }
    
    /**
     * Update the stroke color
     * @param {string} color - CSS color value
     */
    setColor(color) {
        if (this.element) {
            this.element.style.stroke = color;
        }
    }
    
    /**
     * Update stroke width
     * @param {number} width - Stroke width in pixels
     */
    setStrokeWidth(width) {
        if (this.element) {
            this.element.style.strokeWidth = width;
            this.options.strokeWidth = width;
        }
    }
    
    /**
     * Get current progress percentage
     * @returns {number} Current progress (0-100)
     */
    getProgress() {
        if (!this.element) return 0;
        
        const currentOffset = parseFloat(this.element.style.strokeDashoffset) || this.circumference;
        const progress = ((this.circumference - currentOffset) / this.circumference) * 100;
        return Math.max(0, Math.min(100, progress));
    }
}

/**
 * Enhanced Progress Ring with phase-based colors and animations
 */
class TimerProgressRing extends ProgressRing {
    constructor(element, options = {}) {
        super(element, options);
        
        this.colors = {
            focus: options.focusColor || 'var(--color-primary)',
            shortBreak: options.shortBreakColor || 'var(--color-success)',
            longBreak: options.longBreakColor || 'var(--color-warning)',
            paused: options.pausedColor || 'var(--color-gray-400)',
            completed: options.completedColor || 'var(--color-success)',
            ...options.colors
        };
        
        this.currentPhase = 'focus';
    }
    
    /**
     * Update progress ring for a specific timer phase
     * @param {string} phase - Timer phase (focus, shortBreak, longBreak)
     * @param {number} remaining - Time remaining in seconds
     * @param {number} total - Total time for this phase in seconds
     * @param {boolean} isPaused - Whether timer is currently paused
     */
    updateForPhase(phase, remaining, total, isPaused = false) {
        // Update color based on phase and state
        if (isPaused) {
            this.setColor(this.colors.paused);
        } else if (remaining <= 0) {
            this.setColor(this.colors.completed);
        } else {
            this.setColor(this.colors[phase] || this.colors.focus);
        }
        
        // Update progress
        this.setTimeProgress(remaining, total);
        
        this.currentPhase = phase;
    }
    
    /**
     * Show completion animation
     */
    showCompletion() {
        this.setColor(this.colors.completed);
        this.complete();
        
        // Optional: Add a brief flash effect
        setTimeout(() => {
            this.element?.style.setProperty('filter', 'brightness(1.2)');
            setTimeout(() => {
                this.element?.style.removeProperty('filter');
            }, 200);
        }, 100);
    }
    
    /**
     * Show pause state
     */
    showPaused() {
        this.setColor(this.colors.paused);
        // Optionally add a pulsing effect
        if (this.element) {
            this.element.style.animation = 'pulse 2s ease-in-out infinite';
        }
    }
    
    /**
     * Remove pause effects
     */
    clearPaused() {
        if (this.element) {
            this.element.style.animation = '';
        }
        this.setColor(this.colors[this.currentPhase] || this.colors.focus);
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProgressRing, TimerProgressRing };
}