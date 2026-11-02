const express = require('express');
const router = express.Router();

const {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} = require('../controllers/tenentControllers');

const authentication = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authentication);

router.get('/', getTenants);
router.post('/', requireRole(['ORG_ADMIN', 'TENANT_ADMIN']), createTenant);
router.put('/:tenantId', requireRole(['ORG_ADMIN', 'TENANT_ADMIN']), updateTenant);
router.delete('/:tenantId', requireRole(['ORG_ADMIN']), deleteTenant);

module.exports = router;
