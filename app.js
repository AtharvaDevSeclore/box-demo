/**
 * Box Integration App - Query Parameter Display and File Metadata
 * This script handles parsing and displaying all query parameters from the URL
 * and fetches file metadata from Box API
 */

class BoxIntegrationApp {
    constructor() {
        this.init();
        this.boxApiBase = 'https://api.box.com/2.0';
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

    /**
     * Fetch file metadata from Box API
     */
    async fetchFileMetadata() {
        const fileId = this.getParameter('file_id');
        const clientId = this.getParameter('client_id');
        const clientSecret = this.getParameter('client_secret');
        
        if (!fileId) {
            this.showMetadataError('File ID is required. Please add file_id parameter to the URL.');
            return;
        }

        if (!clientId || !clientSecret) {
            this.showMetadataError('Client ID and Client Secret are required. Please add client_id and client_secret parameters to the URL.');
            return;
        }

        const button = document.getElementById('fetch-metadata-btn');
        const container = document.getElementById('metadata-container');
        
        // Show loading state
        button.disabled = true;
        button.textContent = '⏳ Fetching...';
        container.innerHTML = '<div class="loading">Fetching file metadata from Box API...</div>';

        try {
            // First, get an access token using client credentials
            const tokenResponse = await this.getAccessToken(clientId, clientSecret);
            
            if (!tokenResponse.access_token) {
                throw new Error('Failed to get access token: ' + (tokenResponse.error_description || 'Unknown error'));
            }

            console.log('Successfully obtained access token');
            
            // Then fetch file metadata
            const metadata = await this.getFileMetadata(fileId, tokenResponse.access_token);
            this.displayFileMetadata(metadata);
            
        } catch (error) {
            console.error('Error fetching file metadata:', error);
            let errorMessage = error.message;
            
            // Provide more helpful error messages
            if (errorMessage.includes('box_subject_id')) {
                errorMessage = 'Authentication error: Please check your Box application configuration. The app may need enterprise access or different authentication settings.';
            } else if (errorMessage.includes('401')) {
                errorMessage = 'Authentication failed: Please verify your client_id and client_secret are correct.';
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Access denied: The application may not have permission to access this file or the Box API.';
            } else if (errorMessage.includes('404')) {
                errorMessage = 'File not found: The specified file_id does not exist or is not accessible.';
            }
            
            this.showMetadataError('Failed to fetch file metadata: ' + errorMessage);
        } finally {
            // Reset button state
            button.disabled = false;
            button.textContent = '🔍 Fetch File Metadata';
        }
    }

    /**
     * Get access token using client credentials
     */
    async getAccessToken(clientId, clientSecret) {
        // Try different authentication approaches
        const authMethods = [
            // Method 1: Basic client credentials
            {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            },
            // Method 2: With enterprise subject type
            {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
                box_subject_type: 'enterprise'
            }
        ];

        for (let i = 0; i < authMethods.length; i++) {
            try {
                console.log(`Trying authentication method ${i + 1}...`);
                
                const response = await fetch('https://api.box.com/oauth2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams(authMethods[i])
                });

                if (response.ok) {
                    const tokenData = await response.json();
                    console.log(`Authentication method ${i + 1} successful`);
                    return tokenData;
                } else {
                    const errorData = await response.json();
                    console.log(`Authentication method ${i + 1} failed:`, errorData);
                    
                    // If this is the last method, throw the error
                    if (i === authMethods.length - 1) {
                        throw new Error(`Token request failed: ${response.status} - ${errorData.error_description || errorData.error}`);
                    }
                }
            } catch (error) {
                // If this is the last method, throw the error
                if (i === authMethods.length - 1) {
                    throw error;
                }
            }
        }
    }

    /**
     * Get file metadata from Box API
     */
    async getFileMetadata(fileId, accessToken) {
        const response = await fetch(`${this.boxApiBase}/files/${fileId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`File metadata request failed: ${response.status} - ${errorData.message || errorData.error}`);
        }

        return await response.json();
    }

    /**
     * Display file metadata in the UI
     */
    displayFileMetadata(metadata) {
        const container = document.getElementById('metadata-container');
        
        const metadataFields = [
            { key: 'id', label: 'File ID' },
            { key: 'name', label: 'File Name' },
            { key: 'type', label: 'Type' },
            { key: 'size', label: 'Size (bytes)' },
            { key: 'created_at', label: 'Created At' },
            { key: 'modified_at', label: 'Modified At' },
            { key: 'description', label: 'Description' },
            { key: 'path_collection', label: 'Path Collection' },
            { key: 'owned_by', label: 'Owned By' },
            { key: 'shared_link', label: 'Shared Link' },
            { key: 'parent', label: 'Parent Folder' },
            { key: 'item_status', label: 'Item Status' },
            { key: 'version_number', label: 'Version Number' },
            { key: 'comment_count', label: 'Comment Count' },
            { key: 'permissions', label: 'Permissions' },
            { key: 'tags', label: 'Tags' },
            { key: 'lock', label: 'Lock Status' },
            { key: 'extension', label: 'Extension' },
            { key: 'is_package', label: 'Is Package' },
            { key: 'expires_at', label: 'Expires At' },
            { key: 'representations', label: 'Representations' },
            { key: 'classification', label: 'Classification' },
            { key: 'watermark_info', label: 'Watermark Info' },
            { key: 'is_externally_owned', label: 'Is Externally Owned' },
            { key: 'has_collaborations', label: 'Has Collaborations' },
            { key: 'metadata', label: 'Metadata' },
            { key: 'fields', label: 'Fields' },
            { key: 'etag', label: 'ETag' },
            { key: 'sequence_id', label: 'Sequence ID' },
            { key: 'sha1', label: 'SHA1' },
            { key: 'file_version', label: 'File Version' }
        ];

        let metadataHtml = '';
        
        metadataFields.forEach(field => {
            const value = metadata[field.key];
            if (value !== undefined && value !== null) {
                let displayValue = value;
                
                // Format dates
                if (field.key.includes('_at') && typeof value === 'string') {
                    displayValue = new Date(value).toLocaleString();
                }
                
                // Format size
                if (field.key === 'size' && typeof value === 'number') {
                    displayValue = this.formatFileSize(value);
                }
                
                // Format objects as JSON
                if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2);
                }
                
                metadataHtml += `
                    <div class="metadata-item">
                        <span class="metadata-name">${field.label}:</span>
                        <span class="metadata-value">${this.escapeHtml(displayValue.toString())}</span>
                        <button class="copy-button" onclick="boxApp.copyMetadataValue('${this.escapeHtml(displayValue.toString())}')">Copy</button>
                    </div>
                `;
            }
        });

        if (metadataHtml === '') {
            metadataHtml = '<div class="loading">No metadata available for this file.</div>';
        }

        container.innerHTML = metadataHtml;
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Copy metadata value to clipboard
     */
    copyMetadataValue(value) {
        navigator.clipboard.writeText(value).then(() => {
            this.showCopyFeedback(event.target);
        }).catch(err => {
            console.error('Failed to copy metadata value: ', err);
            this.showError('Failed to copy to clipboard');
        });
    }

    /**
     * Show metadata error
     */
    showMetadataError(message) {
        const container = document.getElementById('metadata-container');
        container.innerHTML = `<div class="error">${this.escapeHtml(message)}</div>`;
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