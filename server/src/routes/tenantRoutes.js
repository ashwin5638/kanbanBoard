const express = require('express')
const route = express.Router()

const {getTenants,createTenant} = require('../controllers/tenentControllers');

const authentication = require('../middleware/authMiddleware')



route.get('/', authentication, getTenants)
route.post('/', authentication, createTenant)

module.exports = route