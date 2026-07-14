import crypto from "crypto";

const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"; // tanpa 0/O/1/l/i biar gak ambigu
const RESERVED = new Set(["api", "p", "admin", "_next", "favicon.ico", "index"]);

function randomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function isValidAlias(alias) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(alias) && !RESERVED.has(alias.toLowerCase());
}

export { randomCode, isValidAlias, RESERVED };
