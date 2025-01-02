/**
 * Generates a unique ID with a given prefix
 * @param {string} prefix - The prefix to use for the ID (e.g., 'SRV', 'PRJ', etc.)
 * @returns {string} The generated ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}${timestamp}${random}`
}

/**
 * Formats a date to a readable string
 * @param {Date|string} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formats a currency value
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'USD')
 * @returns {string} The formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Truncates a string to a specified length
 * @param {string} str - The string to truncate
 * @param {number} length - The maximum length
 * @returns {string} The truncated string
 */
export function truncateString(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
export function capitalizeWords(str) {
  if (!str) return ''
  return str.replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - The size in bytes
 * @returns {string} The formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Checks if a string is a valid email address
 * @param {string} email - The email address to validate
 * @returns {boolean} Whether the email is valid
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Removes duplicate items from an array
 * @param {Array} array - The array to remove duplicates from
 * @param {string} key - The key to use for comparison (for arrays of objects)
 * @returns {Array} The array with duplicates removed
 */
export function removeDuplicates(array, key) {
  if (!Array.isArray(array)) return array
  if (key) {
    return Array.from(new Map(array.map(item => [item[key], item])).values())
  }
  return [...new Set(array)]
} 