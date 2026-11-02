const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const userOrgRole = req.user?.role;
    const userTenantRole = req.membershipRole;

    // ORG_ADMIN always has super-admin permissions across all resources
    if (userOrgRole === 'ORG_ADMIN') {
      return next();
    }

    const hasOrgPermission = allowedRoles.includes(userOrgRole);
    const hasTenantPermission = userTenantRole && allowedRoles.includes(userTenantRole);

    if (!hasOrgPermission && !hasTenantPermission) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of the following roles: [${allowedRoles.join(', ')}]. Current roles: Org [${userOrgRole || 'None'}], Workspace [${userTenantRole || 'None'}]`,
      });
    }

    next();
  };
};

module.exports = requireRole;
