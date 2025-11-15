import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Must be 32 characters
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
  try {
    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted text
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

export function decrypt(text: string): string {
  try {
    // Check if text is encrypted (should have format: iv:encryptedText)
    if (!text || !text.includes(':')) {
      // Text is not encrypted, return as is (backward compatibility)
      return text;
    }
    
    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const parts = text.split(':');
    
    if (parts.length !== 2) {
      // Invalid format, return original text
      return text;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      return text;
    }
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original text if decryption fails (for backward compatibility)
    return text;
  }
}
