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
        } else if (elementId.startsWith('file-id-')) {
            // Handle file ID copying
            const fileId = elementId.replace('file-id-', '');
            textToCopy = fileId;
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
        
        if (!clientId || !clientSecret) {
            this.showMetadataError('Client ID and Client Secret are required. Please add client_id and client_secret parameters to the URL.');
            return;
        }

        const button = document.getElementById('fetch-metadata-btn');
        const container = document.getElementById('metadata-container');
        
        // Show loading state
        button.disabled = true;
        button.textContent = '⏳ Fetching...';
        container.innerHTML = '<div class="loading">Fetching files from Box API...</div>';

        try {
            // First, get an access token using client credentials
            const tokenResponse = await this.getAccessToken(clientId, clientSecret);
            
            if (!tokenResponse.access_token) {
                throw new Error('Failed to get access token: ' + (tokenResponse.error_description || 'Unknown error'));
            }

            console.log('Successfully obtained access token');
            
            // Always list all files first
            await this.listAllFiles(tokenResponse.access_token);
            
            // If file_id is provided, also show metadata for that specific file
            if (fileId) {
                console.log('File ID provided, also fetching metadata for specific file:', fileId);
                // Add a small delay to ensure the files list is displayed first
                setTimeout(async () => {
                    try {
                        const metadata = await this.getFileMetadata(fileId, tokenResponse.access_token);
                        this.displayFileMetadata(metadata);
                    } catch (error) {
                        console.error('Error fetching specific file metadata:', error);
                        // Don't show error in UI since files list is already displayed
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error fetching files:', error);
            let errorMessage = error.message;
            
            // Provide more helpful error messages
            if (errorMessage.includes('box_subject_id')) {
                errorMessage = 'Authentication error: Please check your Box application configuration. The app may need enterprise access or different authentication settings.';
            } else if (errorMessage.includes('401')) {
                errorMessage = 'Authentication failed: Please verify your client_id and client_secret are correct.';
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Access denied: The application may not have permission to access files or the Box API.';
            } else if (errorMessage.includes('404')) {
                errorMessage = 'Files not found: The application may not have access to any files.';
            }
            
            this.showMetadataError('Failed to fetch files: ' + errorMessage);
        } finally {
            // Reset button state
            button.disabled = false;
            button.textContent = '🔍 Fetch Files & Metadata';
        }
    }

    /**
     * List all files accessible to the application
     */
    async listAllFiles(accessToken) {
        console.log('Fetching all files...');
        
        const response = await fetch(`${this.boxApiBase}/files?limit=100&fields=id,name,size,created_at,modified_at,owned_by,type`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Files API Response Status: ${response.status}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Box API Error Response:', errorData);
            throw new Error(`Failed to fetch files: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
        }

        const filesData = await response.json();
        console.log('Successfully retrieved files:', filesData);
        this.displayFilesList(filesData.entries, accessToken);
    }

    /**
     * Display list of files with metadata buttons
     */
    displayFilesList(files, accessToken) {
        const container = document.getElementById('metadata-container');
        
        if (!files || files.length === 0) {
            container.innerHTML = '<div class="loading">No files found or accessible to the application.</div>';
            return;
        }

        let filesHtml = `
            <div class="files-header">
                <h3>📁 Files List (${files.length} files)</h3>
                <p>Click "Get Metadata" to view detailed information for each file</p>
            </div>
        `;
        
        files.forEach((file, index) => {
            const fileSize = file.size ? this.formatFileSize(file.size) : 'Unknown';
            const createdAt = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown';
            const modifiedAt = file.modified_at ? new Date(file.modified_at).toLocaleDateString() : 'Unknown';
            const owner = file.owned_by ? file.owned_by.name : 'Unknown';
            
            filesHtml += `
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-name">📄 ${this.escapeHtml(file.name)}</div>
                        <div class="file-details">
                            <span class="file-id">ID: ${file.id}</span>
                            <span class="file-size">Size: ${fileSize}</span>
                            <span class="file-type">Type: ${file.type}</span>
                            <span class="file-owner">Owner: ${this.escapeHtml(owner)}</span>
                            <span class="file-created">Created: ${createdAt}</span>
                            <span class="file-modified">Modified: ${modifiedAt}</span>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="metadata-button" onclick="boxApp.getFileMetadataForDisplay('${file.id}', '${accessToken}')">
                            🔍 Get Metadata
                        </button>
                        <button class="copy-button" onclick="boxApp.copyToClipboard('file-id-${file.id}')" data-file-id="${file.id}">
                            Copy ID
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = filesHtml;
    }

    /**
     * Get and display metadata for a specific file
     */
    async getFileMetadataForDisplay(fileId, accessToken) {
        const container = document.getElementById('metadata-container');
        
        // Show loading state
        container.innerHTML = '<div class="loading">Fetching metadata for file ID: ' + fileId + '...</div>';
        
        try {
            const metadata = await this.getFileMetadata(fileId, accessToken);
            this.displayFileMetadata(metadata);
        } catch (error) {
            console.error('Error fetching file metadata:', error);
            this.showMetadataError('Failed to fetch metadata for file ' + fileId + ': ' + error.message);
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