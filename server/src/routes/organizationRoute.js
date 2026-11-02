const express = require('express');
const router = express.Router();

const {
  getOrganizationDetails,
  updateOrganization,
  getActivityLogs,
} = require('../controllers/organizationalControllers');

const authentication = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(authentication);

router.get('/details', getOrganizationDetails);
router.put('/update', requireRole(['ORG_ADMIN']), updateOrganization);
router.get('/activities', getActivityLogs);

module.exports = router;
