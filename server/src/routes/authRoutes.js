const express = require('express')

const route = express.Router()

const {register, login} = require('../controllers/authControllers')
//const authMiddleware = require('../middleware/authMiddleware')


route.post('/register', register)
route.post('/login', login)


module.exports = route