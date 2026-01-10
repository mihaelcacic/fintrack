export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function txKey(userId) {
  return `transactions_${userId}`;
}

export function getTransactions(userId) {
  return readJSON(txKey(userId), []);
}

export function saveTransactions(userId, transactions) {
  writeJSON(txKey(userId), transactions);
}
