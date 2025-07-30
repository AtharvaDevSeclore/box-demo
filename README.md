# Box Integration App

A simple static HTML/JavaScript application that displays all query parameters from the URL. This is designed to be used as the app URL for Box integrations.

## Features

- **Query Parameter Display**: Shows all query parameters from the URL in a clean, organized format
- **Copy to Clipboard**: One-click copying of individual parameters or the full URL
- **Modern UI**: Beautiful, responsive design with gradient backgrounds and smooth animations
- **Console Logging**: All parameters are logged to the browser console for debugging
- **XSS Protection**: HTML escaping to prevent cross-site scripting attacks
- **Mobile Responsive**: Works well on all device sizes

## Files

- `index.html` - The main HTML file that serves as the app URL
- `app.js` - JavaScript file containing all the application logic
- `README.md` - This documentation file

## Usage

### For Box Integration

1. **Deploy the files**: Upload `index.html` and `app.js` to your web server
2. **Set the app URL**: Use the URL to your `index.html` file as the app URL in your Box integration
3. **Test with parameters**: Add query parameters to the URL to test the functionality

### Example URLs

```
https://your-domain.com/index.html
https://your-domain.com/index.html?param1=value1&param2=value2
https://your-domain.com/index.html?user_id=123&file_id=456&action=view
```

### Testing Locally

1. Open `index.html` in a web browser
2. Add query parameters to the URL manually
3. Refresh the page to see the parameters displayed

## Box Integration Parameters

When Box opens your app URL, it may pass various parameters such as:

- `user_id` - The ID of the user accessing the integration
- `file_id` - The ID of the file being accessed
- `folder_id` - The ID of the folder being accessed
- `action` - The action being performed (view, edit, etc.)
- `state` - OAuth state parameter for security
- `code` - Authorization code for OAuth flow

## JavaScript API

The app provides a global `boxApp` object with the following methods:

```javascript
// Get all parameters as an object
const params = boxApp.getParametersObject();

// Get a specific parameter
const userId = boxApp.getParameter('user_id');

// Check if a parameter exists
if (boxApp.hasParameter('file_id')) {
    // Do something
}
```

## Styling

The app uses a modern design with:
- Gradient backgrounds
- Card-based layout
- Smooth hover effects
- Copy buttons with visual feedback
- Responsive design for mobile devices

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires `URLSearchParams` API
- Requires `navigator.clipboard` API for copy functionality

## Security Considerations

- All user input is HTML-escaped to prevent XSS attacks
- No external dependencies or CDN resources
- Static files only - no server-side processing required

## Deployment

### Static Hosting
Upload the files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any web server

### Local Development
Simply open `index.html` in a web browser for local testing.

## Customization

You can customize the app by:
- Modifying the CSS in `index.html`
- Adding additional functionality in `app.js`
- Changing the color scheme in the CSS variables
- Adding more parameter processing logic

## Troubleshooting

1. **Parameters not showing**: Check that the URL contains query parameters
2. **Copy not working**: Ensure you're using HTTPS (required for clipboard API)
3. **Console errors**: Check browser console for any JavaScript errors
4. **Styling issues**: Ensure both `index.html` and `app.js` are in the same directory

## License

This project is open source and available under the MIT License. 