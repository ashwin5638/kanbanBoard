const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const register = async (req, res) => {
  try {
    const { name, email, password, organizationName, tenantName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: organizationName || `${name}'s Organization` },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: tenantName || 'Default Workspace',
          organizationId: org.id,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          organizationId: org.id,
          role: 'ORG_ADMIN', // Creator of organization is ORG_ADMIN
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'TENANT_ADMIN', // Creator of workspace is TENANT_ADMIN
        },
      });

      await tx.activityLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'ORGANIZATION_CREATED',
          entityType: 'ORGANIZATION',
          entityId: org.id,
          details: `Created organization "${org.name}" and workspace "${tenant.name}"`,
        },
      });

      return { user, org, tenant };
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.org.id,
        tenantId: result.tenant.id,
      },
    });
  } catch (err) {
    console.error('Error during registration:', err);
    if (err.code === 'P1001' || err.message?.includes("Can't reach database server")) {
      return res.status(503).json({ success: false, error: 'Database temporarily unavailable' });
    }
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const primaryTenantId = user.memberships?.[0]?.tenantId || null;

    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        tenantId: primaryTenantId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        tenantId: primaryTenantId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          tenantId: primaryTenantId,
          memberships: user.memberships,
        },
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    if (err.code === 'P1001' || err.message?.includes("Can't reach database server")) {
      return res.status(503).json({ success: false, error: 'Database temporarily unavailable' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { register, login };
