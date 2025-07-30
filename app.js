/**
 * Box Integration App - Query Parameter Display
 * This script handles parsing and displaying all query parameters from the URL
 */

class BoxIntegrationApp {
    constructor() {
        this.init();
    }

    init() {
        this.displayParameters();
        this.setupEventListeners();
        this.logParameters();
    }

    /**
     * Parse and display all query parameters
     */
    displayParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const container = document.getElementById('parameters-container');
        const currentUrlElement = document.getElementById('current-url');
        const timestampElement = document.getElementById('timestamp');
        
        if (!container || !currentUrlElement || !timestampElement) {
            console.error('Required DOM elements not found');
            return;
        }
        
        // Display current URL
        currentUrlElement.textContent = window.location.href;
        
        // Display timestamp
        const now = new Date();
        timestampElement.textContent = `Last updated: ${now.toLocaleString()}`;
        
        // Check if there are any parameters
        if (urlParams.toString() === '') {
            container.innerHTML = '<div class="no-parameters">No query parameters found in the URL.</div>';
            return;
        }
        
        // Display each parameter
        let parametersHtml = '';
        for (const [key, value] of urlParams.entries()) {
            parametersHtml += this.createParameterItem(key, value);
        }
        
        container.innerHTML = parametersHtml;
    }

    /**
     * Create HTML for a parameter item
     */
    createParameterItem(key, value) {
        return `
            <div class="parameter-item">
                <span class="parameter-name">${this.escapeHtml(key)}:</span>
                <span class="parameter-value">${this.escapeHtml(value)}</span>
                <button class="copy-button" onclick="boxApp.copyToClipboard('${this.escapeHtml(key)}')">Copy</button>
            </div>
        `;
    }

    /**
     * Copy text to clipboard
     */
    copyToClipboard(elementId) {
        let textToCopy;
        
        if (elementId === 'current-url') {
            textToCopy = window.location.href;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            textToCopy = urlParams.get(elementId) || '';
        }
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showCopyFeedback(event.target);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            this.showError('Failed to copy to clipboard');
        });
    }

    /**
     * Show visual feedback when copying
     */
    showCopyFeedback(button) {
        const originalText = button.textContent;
        const originalBackground = button.style.background;
        
        button.textContent = 'Copied!';
        button.style.background = '#28a745';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = originalBackground || '#667eea';
        }, 1000);
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.displayParameters();
        });
        
        // Update when URL changes (for single-page apps)
        window.addEventListener('popstate', () => {
            this.displayParameters();
        });
    }

    /**
     * Log parameters to console for debugging
     */
    logParameters() {
        console.log('Box Integration App - Query Parameters:');
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.toString() === '') {
            console.log('No query parameters found');
            return;
        }
        
        for (const [key, value] of urlParams.entries()) {
            console.log(`${key}: ${value}`);
        }
    }

    /**
     * Get all parameters as an object
     */
    getParametersObject() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    }

    /**
     * Get a specific parameter value
     */
    getParameter(key) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
    }

    /**
     * Check if a parameter exists
     */
    hasParameter(key) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(key);
    }
}

// Initialize the app when the script loads
let boxApp;
if (typeof window !== 'undefined') {
    boxApp = new BoxIntegrationApp();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoxIntegrationApp;
} 