/**
 * Utility to inject Content Security Policy (CSP) headers into the HTML file during build
 * This script is used by the build process to add security headers
 */

const fs = require("fs");

/**
 * Injects CSP meta tag into HTML file
 * @param {string} htmlFilePath - Path to the HTML file
 */
function injectCSP(htmlFilePath = "./build/index.html") {
  try {
    // Read the HTML content
    const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

    // Define the CSP directives
    const cspContent = `
      default-src 'self';
      script-src 'self' https://*.firebaseio.com https://*.googleapis.com https://apis.google.com https://www.gstatic.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://*.googleapis.com https://lh3.googleusercontent.com https://*.gstatic.com;
      connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://tamohar-02.onrender.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com;
      frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self' https://identitytoolkit.googleapis.com;
    `
      .replace(/\s+/g, " ")
      .trim();

    // Create CSP meta tag
    const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`;

    // Insert CSP meta tag after the title
    const updatedHtmlContent = htmlContent.replace(
      /<\/title>/,
      "</title>\n    " + cspMetaTag
    );

    // Write the updated HTML back to the file
    fs.writeFileSync(htmlFilePath, updatedHtmlContent);

    console.log("CSP meta tag successfully injected into", htmlFilePath);
  } catch (error) {
    console.error("Error injecting CSP meta tag:", error);
  }
}

module.exports = injectCSP;

// Execute the function if this file is run directly
if (require.main === module) {
  injectCSP();
}
