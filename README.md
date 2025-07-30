# Box Integration App

A static HTML/JavaScript application that displays query parameters from the URL and fetches file metadata from the Box API. This is designed to be used as the app URL for Box integrations.

## Features

- **Query Parameter Display**: Shows all query parameters from the URL in a clean, organized format
- **Box API Integration**: Fetches and displays file metadata using Box API
- **Copy to Clipboard**: One-click copying of individual parameters, metadata values, or the full URL
- **Modern UI**: Beautiful, responsive design with gradient backgrounds and smooth animations
- **Console Logging**: All parameters are logged to the browser console for debugging
- **XSS Protection**: HTML escaping to prevent cross-site scripting attacks
- **Mobile Responsive**: Works well on all device sizes
- **File Size Formatting**: Human-readable file size display
- **Error Handling**: Comprehensive error handling for API calls

## Files

- `index.html` - The main HTML file that serves as the app URL
- `app.js` - JavaScript file containing all the application logic and Box API integration
- `README.md` - This documentation file

## Usage

### For Box Integration

1. **Deploy the files**: Upload `index.html` and `app.js` to your web server
2. **Set the app URL**: Use the URL to your `index.html` file as the app URL in your Box integration
3. **Add required parameters**: Include `file_id`, `client_id`, and `client_secret` in the URL
4. **Test the functionality**: The app will display parameters and allow fetching file metadata

### Required Parameters

The app expects these parameters in the URL:

- `file_id` - The Box file ID to fetch metadata for
- `client_id` - Your Box application client ID (hardcoded for security)
- `client_secret` - Your Box application client secret (hardcoded for security)

### Optional Parameters

- `user_id` - The ID of the user accessing the integration
- `file_extension` - The file extension
- Any other parameters Box may pass

### Example URLs

```
https://your-domain.com/index.html?file_id=123456789&client_id=your_client_id&client_secret=your_client_secret
https://your-domain.com/index.html?file_id=123456789&client_id=your_client_id&client_secret=your_client_secret&user_id=987654321&file_extension=pdf
```

### Testing Locally

1. Open `index.html` in a web browser
2. Add the required parameters to the URL manually
3. Click "Fetch File Metadata" to test the Box API integration

## Box API Integration

The app uses Box's Client Credentials OAuth flow to:

1. **Authenticate**: Get an access token using your client credentials
2. **Fetch Metadata**: Retrieve comprehensive file metadata from Box API
3. **Display Results**: Show formatted metadata in a user-friendly interface

### Metadata Fields Displayed

The app displays all available metadata fields including:

- **Basic Info**: File ID, Name, Type, Size, Extension
- **Timestamps**: Created At, Modified At, Expires At
- **Ownership**: Owned By, Parent Folder, Item Status
- **Sharing**: Shared Link, Permissions, Collaborations
- **Security**: Lock Status, Classification, Watermark Info
- **Technical**: ETag, Sequence ID, SHA1, File Version
- **Content**: Description, Tags, Comments Count
- **Advanced**: Representations, Metadata, Fields

### File Size Formatting

File sizes are automatically converted to human-readable format:
- Bytes → KB → MB → GB → TB

## JavaScript API

The app provides a global `boxApp` object with the following methods:

```javascript
// Get all parameters as an object
const params = boxApp.getParametersObject();

// Get a specific parameter
const fileId = boxApp.getParameter('file_id');

// Check if a parameter exists
if (boxApp.hasParameter('file_id')) {
    // Do something
}

// Fetch file metadata (async)
await boxApp.fetchFileMetadata();

// Get access token (async)
const token = await boxApp.getAccessToken(clientId, clientSecret);

// Get file metadata (async)
const metadata = await boxApp.getFileMetadata(fileId, accessToken);
```

## Box API Authentication

The app uses Box's Client Credentials OAuth flow:

1. **Endpoint**: `https://api.box.com/oauth2/token`
2. **Method**: POST
3. **Grant Type**: `client_credentials`
4. **Subject Type**: `enterprise`

This allows the app to access files on behalf of the enterprise without user-specific authentication.

## Security Considerations

- **Client Credentials**: Store client_id and client_secret securely
- **HTTPS Required**: Use HTTPS for production to protect credentials
- **CORS**: Ensure your server allows requests from Box domains
- **Input Validation**: All user input is HTML-escaped
- **Error Handling**: Sensitive information is not exposed in error messages

## Error Handling

The app handles various error scenarios:

- **Missing Parameters**: Clear error messages for required parameters
- **Authentication Failures**: Detailed error messages for token issues
- **API Errors**: Proper error handling for Box API responses
- **Network Issues**: Graceful handling of network failures

## Styling

The app uses a modern design with:
- Gradient backgrounds
- Card-based layout
- Smooth hover effects
- Copy buttons with visual feedback
- Loading states and error styling
- Responsive design for mobile devices

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires `URLSearchParams` API
- Requires `navigator.clipboard` API for copy functionality
- Requires `fetch` API for HTTP requests

## Deployment

### Static Hosting
Upload the files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

### CORS Configuration
Ensure your hosting provider allows CORS requests to Box API endpoints.

### Local Development
Simply open `index.html` in a web browser for local testing.

## Customization

You can customize the app by:
- Modifying the CSS in `index.html`
- Adding additional functionality in `app.js`
- Changing the color scheme in the CSS variables
- Adding more metadata fields to display
- Implementing additional Box API endpoints

## Troubleshooting

1. **Parameters not showing**: Check that the URL contains query parameters
2. **Copy not working**: Ensure you're using HTTPS (required for clipboard API)
3. **API errors**: Check browser console for detailed error messages
4. **CORS issues**: Ensure your server allows requests to Box API
5. **Authentication failures**: Verify client_id and client_secret are correct
6. **File not found**: Ensure the file_id exists and is accessible

## Box API Rate Limits

Be aware of Box API rate limits:
- **Client Credentials**: 100 requests per minute
- **File Metadata**: 1000 requests per minute
- **Enterprise-wide**: 10000 requests per minute

## License

This project is open source and available under the MIT License. 