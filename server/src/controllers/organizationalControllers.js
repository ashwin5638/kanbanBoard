const prisma = require('../config/db');

// Get organization details, workspaces, and team members
const getOrganizationDetails = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;

    if (!organizationId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing organization context' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true }
        },
        tenants: {
          include: {
            _count: { select: { boards: true, memberships: true } }
          }
        },
      }
    });

    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch organization details' });
  }
};

// Update organization name (Org Admin only)
const updateOrganization = async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Organization name is required' });
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { name: name.trim() }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ success: false, error: 'Failed to update organization' });
  }
};

// Fetch activity logs for the current tenant workspace
const getActivityLogs = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'x-tenant-id header is required' });
    }

    const logs = await prisma.activityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  getOrganizationDetails,
  updateOrganization,
  getActivityLogs,
};
