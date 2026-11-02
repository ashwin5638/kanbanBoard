const prisma = require('../config/db');

const createTenant = async (req, res) => {
  try {
    const { name } = req.body;
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id || req.user?.userId;

    if (!organizationId || !userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing user or organization context' });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: 'Tenant name is required' });
    }

    const tenant = await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name,
          organizationId,
        },
      });

      await tx.userTenant.create({
        data: {
          userId,
          tenantId: newTenant.id,
        },
      });

      return newTenant;
    });

    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ success: false, error: 'Failed to create tenant workspace' });
  }
};

const getTenants = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing user context' });
    }

    const userTenants = await prisma.userTenant.findMany({
      where: { userId },
      include: {
        tenant: {
          include: { _count: { select: { boards: true } } }
        }
      }
    });

    const tenants = userTenants.map(ut => ut.tenant);
    res.status(200).json({ success: true, data: tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
};

module.exports = {
  getTenants,
  createTenant,
};
