/**
 * Theme Utility
 * 
 * JavaScript utility for managing theme switching in the Design System.
 * Supports automatic system preference detection and manual theme switching.
 */

class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark'];
    this.defaultTheme = 'light';
    this.storageKey = 'ds-theme';
    this.attribute = 'ds-theme';
    
    // Initialize theme
    this.init();
  }

  /**
   * Initialize theme system
   */
  init() {
    // Get saved theme or detect system preference
    const savedTheme = this.getSavedTheme();
    const systemTheme = this.getSystemTheme();
    const initialTheme = savedTheme || systemTheme || this.defaultTheme;
    
    // Apply initial theme
    this.setTheme(initialTheme, false);
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => {
        // Only auto-change if user hasn't manually set a preference
        if (!this.getSavedTheme()) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('Could not access localStorage for theme preference');
      return null;
    }
  }

  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    if (!document.body) {
      console.warn('Document body not available, returning default theme');
      return this.defaultTheme;
    }
    return document.body.getAttribute(this.attribute) || this.defaultTheme;
  }

  /**
   * Set theme
   */
  setTheme(theme, save = true) {
    if (!this.themes.includes(theme)) {
      console.warn(`Invalid theme: ${theme}. Available themes:`, this.themes);
      return false;
    }

    if (!document.body) {
      console.warn('Document body not available, cannot set theme');
      return false;
    }

    const body = document.body;
    const currentTheme = this.getCurrentTheme();
    
    // Prevent transition flash during theme change
    body.classList.add('theme-transitioning');
    
    // Set new theme
    body.setAttribute(this.attribute, theme);
    
    // Save preference
    if (save) {
      this.saveTheme(theme);
    }
    
    // Remove transition class after a brief delay
    setTimeout(() => {
      if (document.body) {
        document.body.classList.remove('theme-transitioning');
      }
    }, 50);
    
    // Dispatch theme change event
    this.dispatchThemeChangeEvent(theme, currentTheme);
    
    return true;
  }

  /**
   * Save theme preference
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (e) {
      console.warn('Could not save theme preference to localStorage');
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    return this.setTheme(newTheme);
  }

  /**
   * Check if dark theme is active
   */
  isDark() {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Check if light theme is active
   */
  isLight() {
    return this.getCurrentTheme() === 'light';
  }

  /**
   * Remove saved theme preference (will use system preference)
   */
  clearSavedTheme() {
    try {
      localStorage.removeItem(this.storageKey);
      // Reset to system preference
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme, false);
    } catch (e) {
      console.warn('Could not clear theme preference from localStorage');
    }
  }

  /**
   * Dispatch custom theme change event
   */
  dispatchThemeChangeEvent(newTheme, oldTheme) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: newTheme,
        previousTheme: oldTheme,
        isDark: newTheme === 'dark',
        isLight: newTheme === 'light'
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Add theme change listener
   */
  onThemeChange(callback) {
    document.addEventListener('themechange', callback);
  }

  /**
   * Remove theme change listener
   */
  offThemeChange(callback) {
    document.removeEventListener('themechange', callback);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes() {
    return [...this.themes];
  }

  /**
   * Check if a theme is available
   */
  isValidTheme(theme) {
    return this.themes.includes(theme);
  }
}

// Initialize everything in a function to ensure proper loading
function initializeThemeSystem() {
  // Create global theme manager instance
  const themeManager = new ThemeManager();
  
  // Store on window for access
  window.themeManager = themeManager;

  // Global convenience functions - ensure they're on window
  window.setTheme = function(theme) { 
    return themeManager.setTheme(theme); 
  };
  window.toggleTheme = function() { 
    return themeManager.toggle(); 
  };
  window.getCurrentTheme = function() { 
    return themeManager.getCurrentTheme(); 
  };
  window.isDarkTheme = function() { 
    return themeManager.isDark(); 
  };
  window.isLightTheme = function() { 
    return themeManager.isLight(); 
  };

  // Global theme object
  window.theme = {
    set: function(theme) { return themeManager.setTheme(theme); },
    toggle: function() { return themeManager.toggle(); },
    current: function() { return themeManager.getCurrentTheme(); },
    isDark: function() { return themeManager.isDark(); },
    isLight: function() { return themeManager.isLight(); },
    onChange: function(callback) { return themeManager.onThemeChange(callback); },
    offChange: function(callback) { return themeManager.offThemeChange(callback); },
    clear: function() { return themeManager.clearSavedTheme(); },
    getAvailable: function() { return themeManager.getAvailableThemes(); }
  };
  
  console.log('Theme system initialized successfully');
  return themeManager;
}

// Initialize when DOM is ready
let themeManagerInstance;

function initWhenReady() {
  if (document.body) {
    themeManagerInstance = initializeThemeSystem();
    console.log(`Theme system ready. Current theme: ${window.getCurrentTheme()}`);
    console.log('Available functions:', Object.keys(window.theme));
  } else {
    // DOM not ready yet, wait a bit and try again
    setTimeout(initWhenReady, 10);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWhenReady);
} else {
  initWhenReady();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}