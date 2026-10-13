const Customer = require('../models/Customer')
const mongoose = require('mongoose')

async function createCustomer(req, res, next) {
  try {
    const { name, mobileNumber, address } = req.body
    if (![name, mobileNumber, address].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'name, mobileNumber, and address are required' })
    }

    const customer = await Customer.create({
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      address: address.trim(),
    })
    return res.status(201).json({ success: true, message: 'Customer created successfully', data: customer })
  } catch (err) { next(err) }
}

async function listCustomers(req, res, next) {
  try {
    const customers = await Customer.find().select('name mobileNumber address').sort({ createdAt: -1 })
    return res.json({ success: true, data: customers, total: customers.length })
  } catch (err) { next(err) }
}

async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer id' })
    }

    const customer = await Customer.findByIdAndDelete(id)
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' })

    return res.json({ success: true, message: 'Customer deleted successfully' })
  } catch (err) { next(err) }
}

module.exports = { createCustomer, listCustomers, deleteCustomer }
