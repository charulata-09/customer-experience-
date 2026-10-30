// PII minimization patterns
const CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const SSN_REGEX = /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/**
 * Strips control characters and masks sensitive PII patterns before passing to LLM
 */
export const maskPii = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    // Replace non-printable ASCII control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Mask payment card numbers
    .replace(CARD_REGEX, '[CARD_MASKED]')
    // Mask SSN / National IDs
    .replace(SSN_REGEX, '[ID_MASKED]')
    // Mask phone numbers
    .replace(PHONE_REGEX, '[PHONE_MASKED]')
    // Mask emails
    .replace(EMAIL_REGEX, '[EMAIL_MASKED]');
};

/**
 * Wraps untrusted text in strict XML-style delimiters for prompt injection defense
 */
export const wrapUntrustedData = (tag, text) => {
  const sanitized = maskPii(text);
  return `<${tag}>\n${sanitized}\n</${tag}>`;
};
