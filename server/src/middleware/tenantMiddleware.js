const prisma = require('../config/db');

const verifyTenantAccess = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.params.tenantId;
    const userId = req.user?.id || req.user?.userId;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required in headers (x-tenant-id)' });
    }


    const userTenant = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!userTenant) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have access to this tenant' });
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during tenant validation' });
  }
};

module.exports = verifyTenantAccess;