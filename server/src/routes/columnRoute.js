const express = require('express')

const router = express.Router()

const { createColumn, updateColumn, deleteColumn } = require('../controllers/columnController')
const authenticateToken = require('../middleware/authMiddleware')

router.use(authenticateToken);

router.post('/createColumn', createColumn);
router.put('/updateColumn/:columnId', updateColumn);
router.delete('/deleteColumn/:columnId', deleteColumn);

module.exports  = router