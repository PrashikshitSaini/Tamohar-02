/**
 * Utility functions for input sanitization and validation
 * to prevent XSS attacks and ensure data integrity
 */

/**
 * Sanitization utilities for preventing XSS and injection attacks
 */

// Regular expression for validating email addresses
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Sanitizes a string by removing potentially dangerous HTML/JS content
 * @param {string} input - The string to sanitize
 * @returns {string} The sanitized string
 */
export const sanitizeString = (input) => {
  if (!input) return "";

  // Convert to string if not already
  const str = String(input);

  // Replace HTML special chars with their HTML entities
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Verifies if a string is a valid email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
};

/**
 * Sanitizes URL parameters to prevent injection attacks
 * @param {string} url - The URL to sanitize
 * @returns {string} The sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (!url) return "";

  try {
    // Try to parse the URL first
    const parsedUrl = new URL(url);

    // Only allow http and https protocols
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    // Return the sanitized URL
    return parsedUrl.toString();
  } catch (error) {
    // If URL parsing fails, return empty string
    return "";
  }
};

/**
 * Sanitizes a filename to prevent directory traversal attacks
 * @param {string} filename - The filename to sanitize
 * @returns {string} The sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return "";

  // Remove path traversal sequences and invalid characters
  return filename
    .replace(/[/\\?%*:|"<>]/g, "") // Remove invalid filename characters
    .replace(/^\.+/, ""); // Remove leading dots to prevent hidden files
};

/**
 * Sanitizes HTML content by removing all tags except allowed ones
 * @param {string} html - The HTML content to sanitize
 * @returns {string} The sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) return "";

  // Create a temporary DOM element
  const tempDiv = document.createElement("div");
  tempDiv.textContent = html; // This will encode HTML entities

  return tempDiv.innerHTML;
};

/**
 * Validates a time string in HH:MM format
 * @param {string} time - The time string to validate
 * @returns {boolean} - Whether the time is valid
 */
export const isValidTime = (time) => {
  if (!time || typeof time !== "string") return false;

  // Check format HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time.trim());
};

/**
 * Validates a URL string
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a safe display name by removing potentially dangerous characters
 * @param {string} name - The name to sanitize
 * @returns {string} - The sanitized name
 */
export const createSafeDisplayName = (name) => {
  if (!name || typeof name !== "string") return "";

  // Remove any HTML, script tags, or other potentially dangerous characters
  return name
    .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
    .replace(/[^\w\s.,'-]/g, "") // Allow only alphanumeric, spaces, and basic punctuation
    .trim();
};

/**
 * Recursively sanitizes all string properties in an object
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - The sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = { ...obj };

  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  });

  return sanitized;
};

/**
 * Validates and sanitizes user inputs
 * @param {Object} inputs - Object containing user inputs
 * @param {Object} validations - Object containing validation rules
 * @returns {Object} - Object containing validation results and sanitized inputs
 */
export const validateAndSanitizeInputs = (inputs, validations) => {
  const errors = {};
  const sanitizedInputs = {};

  Object.keys(inputs).forEach((field) => {
    const value = inputs[field];
    const rules = validations[field] || {};

    // Apply sanitization based on field type
    if (typeof value === "string") {
      sanitizedInputs[field] = sanitizeString(value);
    } else {
      sanitizedInputs[field] = value;
    }

    // Apply validations
    if (
      rules.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      errors[field] = `${field} is required`;
    } else if (rules.email && !isValidEmail(value)) {
      errors[field] = "Please enter a valid email address";
    } else if (rules.time && !isValidTime(value)) {
      errors[field] = "Please enter a valid time in HH:MM format";
    } else if (rules.url && !isValidUrl(value)) {
      errors[field] = "Please enter a valid URL";
    } else if (
      rules.minLength &&
      typeof value === "string" &&
      value.length < rules.minLength
    ) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    } else if (
      rules.maxLength &&
      typeof value === "string" &&
      value.length > rules.maxLength
    ) {
      errors[field] = `${field} cannot exceed ${rules.maxLength} characters`;
    } else if (
      rules.pattern &&
      typeof value === "string" &&
      !new RegExp(rules.pattern).test(value)
    ) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedInputs,
  };
};
