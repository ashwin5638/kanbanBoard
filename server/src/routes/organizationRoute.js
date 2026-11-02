const  express = require('express')
const route = express.Router()

const {getOrganizationDetails} = require('../controllers/organizationalControllers')
const authentication  = require('../middleware/authMiddleware')


route.get('/details', authentication, getOrganizationDetails)

module.exports = route