/**
 * Snackbar Utility
 * 
 * JavaScript utility for creating and managing snackbars/toast notifications
 * with easy positioning and automatic dismiss functionality.
 */

class SnackbarManager {
  constructor() {
    this.containers = {};
    this.activeSnackbars = new Map();
    this.defaultOptions = {
      duration: 4000,
      position: 'bottom-right',
      variant: 'default',
      dismissible: true,
      action: null,
      icon: null,
      progress: true
    };
  }

  /**
   * Create or get container for specific position
   */
  getContainer(position) {
    if (!this.containers[position]) {
      const container = document.createElement('div');
      container.className = `snackbar-container ${position}`;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
      this.containers[position] = container;
    }
    return this.containers[position];
  }

  /**
   * Show a snackbar
   */
  show(message, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const container = this.getContainer(config.position);
    
    // Create snackbar element
    const snackbar = document.createElement('div');
    const id = `snackbar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    snackbar.id = id;
    snackbar.className = `snackbar ${config.variant}`;
    snackbar.setAttribute('role', 'alert');
    snackbar.setAttribute('aria-atomic', 'true');
    
    // Build content
    let content = `<div class="snackbar-content">`;
    
    if (config.icon) {
      content += `<div class="snackbar-icon">${config.icon}</div>`;
    }
    
    content += `<div class="snackbar-message">${message}</div>`;
    content += `</div>`;
    
    if (config.action) {
      content += `<button class="snackbar-action" onclick="${config.action.handler}">${config.action.text}</button>`;
    }
    
    if (config.dismissible) {
      content += `<button class="snackbar-close" onclick="SnackbarManager.instance.dismiss('${id}')" aria-label="Close notification">×</button>`;
    }
    
    if (config.progress && config.duration > 0) {
      content += `<div class="snackbar-progress"></div>`;
    }
    
    snackbar.innerHTML = content;
    
    // Add to container
    container.appendChild(snackbar);
    
    // Handle progress bar
    if (config.progress && config.duration > 0) {
      const progressBar = snackbar.querySelector('.snackbar-progress');
      if (progressBar) {
        progressBar.style.width = '100%';
        setTimeout(() => {
          progressBar.style.width = '0%';
          progressBar.style.transition = `width ${config.duration}ms linear`;
        }, 10);
      }
    }
    
    // Store reference
    this.activeSnackbars.set(id, {
      element: snackbar,
      container: container,
      timeout: null
    });
    
    // Auto dismiss
    if (config.duration > 0) {
      const timeout = setTimeout(() => {
        this.dismiss(id);
      }, config.duration);
      
      this.activeSnackbars.get(id).timeout = timeout;
    }
    
    return id;
  }

  /**
   * Dismiss a specific snackbar
   */
  dismiss(id) {
    const snackbarData = this.activeSnackbars.get(id);
    if (!snackbarData) return;
    
    const { element, container, timeout } = snackbarData;
    
    // Clear timeout
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Add removing class for animation
    element.classList.add('removing');
    
    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        container.removeChild(element);
      }
      this.activeSnackbars.delete(id);
      
      // Clean up empty containers
      if (container.children.length === 0) {
        document.body.removeChild(container);
        delete this.containers[Object.keys(this.containers).find(key => this.containers[key] === container)];
      }
    }, 200);
  }

  /**
   * Dismiss all snackbars
   */
  dismissAll() {
    const ids = Array.from(this.activeSnackbars.keys());
    ids.forEach(id => this.dismiss(id));
  }

  /**
   * Convenience methods for different variants
   */
  success(message, options = {}) {
    return this.show(message, { 
      ...options, 
      variant: 'success',
      icon: options.icon || '✓'
    });
  }

  error(message, options = {}) {
    return this.show(message, { 
      ...options, 
      variant: 'error',
      icon: options.icon || '✕'
    });
  }

  warning(message, options = {}) {
    return this.show(message, { 
      ...options, 
      variant: 'warning',
      icon: options.icon || '⚠'
    });
  }

  info(message, options = {}) {
    return this.show(message, { 
      ...options, 
      variant: 'info',
      icon: options.icon || 'ℹ'
    });
  }
}

// Create global instance
SnackbarManager.instance = new SnackbarManager();

// Global convenience functions
window.showSnackbar = (message, options) => SnackbarManager.instance.show(message, options);
window.dismissSnackbar = (id) => SnackbarManager.instance.dismiss(id);
window.dismissAllSnackbars = () => SnackbarManager.instance.dismissAll();

// Convenience methods
window.snackbar = {
  show: (message, options) => SnackbarManager.instance.show(message, options),
  success: (message, options) => SnackbarManager.instance.success(message, options),
  error: (message, options) => SnackbarManager.instance.error(message, options),
  warning: (message, options) => SnackbarManager.instance.warning(message, options),
  info: (message, options) => SnackbarManager.instance.info(message, options),
  dismiss: (id) => SnackbarManager.instance.dismiss(id),
  dismissAll: () => SnackbarManager.instance.dismissAll()
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SnackbarManager;
}