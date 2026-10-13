const express = require('express')
const router = express.Router()
const { createCustomer, listCustomers, deleteCustomer } = require('../controllers/customer.controller')

router.post('/', createCustomer)
router.get('/', listCustomers)
router.delete('/:id', deleteCustomer)

module.exports = router
