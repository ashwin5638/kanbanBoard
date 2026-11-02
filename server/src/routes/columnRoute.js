const express = require('express');
const router = express.Router();

const { createColumn, updateColumn, deleteColumn } = require('../controllers/columnController');
const authenticateToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authenticateToken);

router.post('/createColumn', requireRole(['ORG_ADMIN', 'TENANT_ADMIN', 'MEMBER']), createColumn);
router.put('/updateColumn/:columnId', updateColumn);
router.delete('/deleteColumn/:columnId', requireRole(['ORG_ADMIN', 'TENANT_ADMIN']), deleteColumn);

module.exports = router;
