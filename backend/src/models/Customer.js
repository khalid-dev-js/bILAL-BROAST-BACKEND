const mongoose = require('mongoose')

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
}, { timestamps: true })

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)
