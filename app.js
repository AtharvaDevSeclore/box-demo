/**
 * Box Integration App - Query Parameter Display
 * This script handles parsing and displaying all query parameters from the URL
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
        const clientId = this.getParameter('client_id');
        const clientSecret = this.getParameter('client_secret');
        const fileId = this.getParameter('file_id');
        
        if (!clientId || !clientSecret) {
            this.showFilesError('Client ID and Client Secret are required. Please add client_id and client_secret parameters to the URL.');
            return;
        }

        if (!fileId) {
            this.showFilesError('File ID is required. Please add file_id parameter to the URL.');
            return;
        }

        const button = document.getElementById('fetch-files-btn');
        const container = document.getElementById('files-container');
        
        // Show loading state
        button.disabled = true;
        button.textContent = '⏳ Fetching...';
        container.innerHTML = '<div class="loading">Fetching file metadata from Box API...</div>';

        try {
            // Get an access token using client credentials
            const tokenResponse = await this.getAccessToken(clientId, clientSecret);
            
            if (!tokenResponse.access_token) {
                throw new Error('Failed to get access token: ' + (tokenResponse.error_description || 'Unknown error'));
            }

            console.log('Successfully obtained access token');
            
            // Get file metadata
            const response = await fetch(`${this.boxApiBase}/files/${fileId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
            }

            const fileData = await response.json();
            console.log('Successfully retrieved file metadata:', fileData);
            this.displayFileMetadata(fileData);
            
        } catch (error) {
            console.error('Error fetching file metadata:', error);
            let errorMessage = error.message;
            
            // Provide more helpful error messages
            if (errorMessage.includes('box_subject_id')) {
                errorMessage = 'Authentication error: Please check your Box application configuration.';
            } else if (errorMessage.includes('401')) {
                errorMessage = 'Authentication failed: Please verify your client_id and client_secret are correct.';
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Access denied: The application may not have permission to access this file.';
            } else if (errorMessage.includes('404')) {
                errorMessage = 'File not found: The file may not exist or the application may not have access to it.';
            } else if (errorMessage.includes('400')) {
                errorMessage = 'Bad request: The API request format may be incorrect. Check console for details.';
            }
            
            this.showFilesError('Failed to fetch file metadata: ' + errorMessage);
        } finally {
            // Reset button state
            button.disabled = false;
            button.textContent = '📄 Get File Metadata';
        }
    }

    /**
     * Get access token using authorization code
     */
    async getAccessToken(clientId, clientSecret) {
        const authCode = this.getParameter('auth_code');
        
        if (!authCode) {
            throw new Error('Authorization code is required. Please ensure the auth_code parameter is present in the URL.');
        }

        const response = await fetch('https://api.box.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authCode,
                client_id: clientId,
                client_secret: clientSecret
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token request failed: ${response.status} - ${errorData.error_description || errorData.error}`);
        }

        return await response.json();
    }





    /**
     * Verify token permissions
     */
    async verifyTokenPermissions() {
        const clientId = this.getParameter('client_id');
        const clientSecret = this.getParameter('client_secret');
        
        if (!clientId || !clientSecret) {
            this.showFilesError('Client ID and Client Secret are required. Please add client_id and client_secret parameters to the URL.');
            return;
        }

        const button = document.getElementById('verify-permissions-btn');
        const container = document.getElementById('files-container');
        
        // Show loading state
        button.disabled = true;
        button.textContent = '⏳ Verifying...';
        container.innerHTML = '<div class="loading">Verifying token permissions...</div>';

        try {
            // Get an access token using client credentials
            const tokenResponse = await this.getAccessToken(clientId, clientSecret);
            
            if (!tokenResponse.access_token) {
                throw new Error('Failed to get access token: ' + (tokenResponse.error_description || 'Unknown error'));
            }

            console.log('Successfully obtained access token');
            
            // Get user info to validate token
            const userResponse = await fetch(`${this.boxApiBase}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokenResponse.access_token}`
                }
            });

            if (!userResponse.ok) {
                const errorData = await userResponse.json();
                throw new Error(`${userResponse.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
            }

            const userInfo = await userResponse.json();
            console.log('User info:', userInfo);

            // Display user info
            let permissionsHtml = `
                <div class="files-header">
                    <h3>✅ Token Verification</h3>
                    <p>Successfully verified access token</p>
                </div>
                <div class="files-header">
                    <h3>👤 User Information</h3>
                </div>
                <div class="file-item">
                    <div class="file-info">
                        <div class="file-details">
                            <span>Name: ${userInfo.name || 'N/A'}</span>
                            <span>Login: ${userInfo.login || 'N/A'}</span>
                            <span>ID: ${userInfo.id || 'N/A'}</span>
                            <span>Status: ${userInfo.status || 'N/A'}</span>
                            <span>Type: ${userInfo.type || 'N/A'}</span>
                            ${userInfo.enterprise ? `<span>Enterprise: ${userInfo.enterprise.name || 'N/A'}</span>` : ''}
                            ${userInfo.job_title ? `<span>Job Title: ${userInfo.job_title}</span>` : ''}
                            ${userInfo.phone ? `<span>Phone: ${userInfo.phone}</span>` : ''}
                            ${userInfo.address ? `<span>Address: ${userInfo.address}</span>` : ''}
                            ${userInfo.avatar_url ? `<img src="${userInfo.avatar_url}" alt="User avatar" style="max-width: 100px; margin-top: 10px;">` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = permissionsHtml;
            
        } catch (error) {
            console.error('Error verifying permissions:', error);
            let errorMessage = error.message;
            
            // Provide more helpful error messages
            if (errorMessage.includes('401')) {
                errorMessage = 'Authentication failed: Please verify your client_id and client_secret are correct.';
            } else if (errorMessage.includes('403')) {
                errorMessage = 'Access denied: The application may not have sufficient permissions.';
            }
            
            this.showFilesError('Failed to verify permissions: ' + errorMessage);
        } finally {
            // Reset button state
            button.disabled = false;
            button.textContent = '🔑 Verify Permissions';
        }
    }

    /**
     * Display file metadata
     */
    displayFileMetadata(file) {
        const container = document.getElementById('files-container');
        
        if (!file || !file.id) {
            container.innerHTML = '<div class="loading">No file metadata found or accessible.</div>';
            return;
        }

        const fileSize = file.size ? this.formatFileSize(file.size) : 'Unknown';
        const createdAt = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown';
        const modifiedAt = file.modified_at ? new Date(file.modified_at).toLocaleString() : 'Unknown';
        const owner = file.owned_by ? file.owned_by.name : 'Unknown';
        const fileType = file.type || 'Unknown';
        const description = file.description || 'No description';
        const version = file.file_version ? file.file_version.version_number : 'Unknown';
        const sha1 = file.sha1 || 'Unknown';
        const extension = file.extension || 'None';
        const commentCount = file.comment_count || 0;
        const hasCollaborations = file.has_collaborations ? 'Yes' : 'No';
        const isExternallyOwned = file.is_externally_owned ? 'Yes' : 'No';
        const tags = file.tags && file.tags.length > 0 ? file.tags.join(', ') : 'None';
        const sharedLink = file.shared_link ? file.shared_link.url : 'None';

        let metadataHtml = `
            <div class="files-header">
                <h3>📄 File Metadata</h3>
                <p>Detailed information about the file</p>
            </div>
            <div class="file-item">
                <div class="file-info">
                    <div class="file-name">📄 ${this.escapeHtml(file.name)}</div>
                    <div class="file-details">
                        <span class="file-id">ID: ${file.id}</span>
                        <span class="file-size">Size: ${fileSize}</span>
                        <span class="file-type">Type: ${fileType}</span>
                        <span class="file-extension">Extension: ${extension}</span>
                        <span class="file-version">Version: ${version}</span>
                        <span class="file-owner">Owner: ${this.escapeHtml(owner)}</span>
                        <span class="file-created">Created: ${createdAt}</span>
                        <span class="file-modified">Modified: ${modifiedAt}</span>
                        <span class="file-comments">Comments: ${commentCount}</span>
                        <span class="file-collaborations">Has Collaborations: ${hasCollaborations}</span>
                        <span class="file-external">Externally Owned: ${isExternallyOwned}</span>
                        <span class="file-sha1">SHA1: ${sha1}</span>
                        <span class="file-tags">Tags: ${tags}</span>
                        ${sharedLink !== 'None' ? `<span class="file-shared-link">Shared Link: ${sharedLink}</span>` : ''}
                    </div>
                    <div class="file-description">
                        <h4>Description:</h4>
                        <p>${this.escapeHtml(description)}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="copy-button" onclick="boxApp.copyToClipboard('file-id-${file.id}')" data-file-id="${file.id}">
                        Copy ID
                    </button>
                </div>
            </div>
        `;

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
     * Show files error
     */
    showFilesError(message) {
        const container = document.getElementById('files-container');
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