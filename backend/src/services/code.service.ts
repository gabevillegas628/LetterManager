import { customAlphabet } from 'nanoid';

// Exclude ambiguous characters (0/O, 1/l/I)
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// Generate 8-character codes (~40 bits of entropy)
const generateCode = customAlphabet(alphabet, 8);

export function createAccessCode(): string {
  return generateCode();
}
