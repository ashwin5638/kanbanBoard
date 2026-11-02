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

      await tx.membership.create({
        data: {
          userId,
          tenantId: newTenant.id,
          role: 'TENANT_ADMIN',
        },
      });

      await tx.activityLog.create({
        data: {
          tenantId: newTenant.id,
          userId,
          action: 'TENANT_CREATED',
          entityType: 'TENANT',
          entityId: newTenant.id,
          details: `Created workspace "${name}"`,
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

    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        tenant: {
          include: { _count: { select: { boards: true } } },
        },
      },
    });

    const tenants = memberships.map((m) => ({
      ...m.tenant,
      membershipRole: m.role,
    }));

    res.status(200).json({ success: true, data: tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Tenant name is required' });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: name.trim() },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tenant' });
  }
};

const deleteTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    res.status(200).json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete tenant' });
  }
};

module.exports = {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
};
