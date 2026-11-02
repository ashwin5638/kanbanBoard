const prisma = require('../config/db');

// Get organization details and team members
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
        tenants: true,
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

module.exports = {
  getOrganizationDetails,
};