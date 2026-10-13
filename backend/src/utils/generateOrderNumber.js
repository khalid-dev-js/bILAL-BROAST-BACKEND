function generateOrderNumber() {
  // Example: BB-<6 digits>
  const n = Date.now().toString().slice(-6)
  return `BB-${n}`
}

module.exports = generateOrderNumber
