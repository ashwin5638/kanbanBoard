const prisma = require('../config/db');

const verifyTenantAccess = async (req, res, next) => {
  try {
    let tenantId = req.headers['x-tenant-id'] || req.params.tenantId;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User context missing from token' });
    }

    // If tenantId header was omitted, resolve from boardId if present in route params
    if (!tenantId && req.params.boardId) {
      const board = await prisma.board.findUnique({
        where: { id: req.params.boardId },
        select: { tenantId: true }
      });
      if (board) {
        tenantId = board.tenantId;
      }
    }

    // Fall back to user's first tenant workspace if not specified
    if (!tenantId) {
      const firstMembership = await prisma.membership.findFirst({
        where: { userId },
        select: { tenantId: true, role: true }
      });
      if (firstMembership) {
        tenantId = firstMembership.tenantId;
      }
    }

    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required in headers (x-tenant-id)' });
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (!membership && req.user?.role !== 'ORG_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not have access to this tenant workspace' });
    }

    req.tenantId = tenantId;
    req.membershipRole = membership?.role || (req.user?.role === 'ORG_ADMIN' ? 'TENANT_ADMIN' : 'MEMBER');
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during tenant validation' });
  }
};

module.exports = verifyTenantAccess;
