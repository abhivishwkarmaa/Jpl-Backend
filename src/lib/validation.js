/**
 * Backend Validation Utility for JPL Portfolio API
 * Enforces server-side data integrity and blocks malicious / invalid inputs.
 */

function validatePhone(phone, required = true) {
  const trimmed = (phone || '').trim();

  if (!trimmed) {
    if (required) return { isValid: false, error: 'Phone number is required.' };
    return { isValid: true };
  }

  // Check if any alphabet is present
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Phone number cannot contain letters or alphabets.' };
  }

  // Count total digits
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, error: 'Phone number must contain between 7 and 15 digits.' };
  }

  // Check character set: only optional leading +, digits, space, hyphen
  if (!/^\+?[\d\s-]{7,20}$/.test(trimmed)) {
    return { isValid: false, error: 'Phone number contains invalid characters.' };
  }

  return { isValid: true };
}

function validateName(name, fieldName = 'Name', required = true) {
  const trimmed = (name || '').trim();

  if (!trimmed) {
    if (required) return { isValid: false, error: `${fieldName} is required.` };
    return { isValid: true };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long.` };
  }

  if (trimmed.length > 70) {
    return { isValid: false, error: `${fieldName} cannot exceed 70 characters.` };
  }

  if (/\d/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} cannot contain numbers.` };
  }

  // Allow letters (including unicode), spaces, dots, hyphens, and apostrophes
  if (!/^[a-zA-Z\u00C0-\u024F\s.'-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid special characters.` };
  }

  return { isValid: true };
}

function validateEmail(email, required = true) {
  const trimmed = (email || '').trim();

  if (!trimmed) {
    if (required) return { isValid: false, error: 'Email address is required.' };
    return { isValid: true };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }

  return { isValid: true };
}

function validateUrl(url, required = true) {
  const trimmed = (url || '').trim();

  if (!trimmed) {
    if (required) return { isValid: false, error: 'URL link is required.' };
    return { isValid: true };
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must begin with http:// or https://' };
    }
    if (!parsed.hostname.includes('.')) {
      return { isValid: false, error: 'Please provide a valid website domain.' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please provide a valid URL.' };
  }
}

function validateText(text, min = 2, max = 3000, fieldName = 'Message', required = true) {
  const trimmed = (text || '').trim();

  if (!trimmed) {
    if (required) return { isValid: false, error: `${fieldName} is required.` };
    return { isValid: true };
  }

  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters.` };
  }

  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters.` };
  }

  return { isValid: true };
}

module.exports = {
  validatePhone,
  validateName,
  validateEmail,
  validateUrl,
  validateText,
};
