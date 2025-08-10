/**
 * Generates a random code using Crockford's Base32 alphabet.
 * @param {number} [length=4]
 * @returns {string}
 */
export function generate_code(length = 4) {
  const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += crockford[Math.floor(Math.random() * crockford.length)];
  }
  return code;
}

/**
 * Converts a string to sentence case.
 * @param {string} str
 * @returns {string}
 */
export function sentence_case(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Returns a random integer between min and max, inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function rand_between(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}