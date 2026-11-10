const crypto = require('crypto');

/**
 * Generates a human-friendly unique PNR string
 * Example: PNR-NBX-8F3K9A
 */
function generatePNR(prefix = 'NBX') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0,1,I,O
  let randomPart = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    randomPart += chars[bytes[i] % chars.length];
  }
  return `PNR-${prefix}-${randomPart}`;
}

module.exports = { generatePNR };
