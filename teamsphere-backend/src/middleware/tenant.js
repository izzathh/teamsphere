const Tenant = require('../models/Tenant')
const {
  sendError
} = require('../utils/response')

const requireTenant = async (req, res, next) => {
  try {
    const headerTenantId = req.headers['x-tenant-id']

    if (!headerTenantId) {
      return sendError(res, 'X-Tenant-ID header is required', 400)
    }

    if (headerTenantId !== req.tenantId) {
      return sendError(res, 'Tenant ID mismatch', 403)
    }

    const tenant = await Tenant.findOne({
      _id: req.tenantId,
      isActive: true,
      isDeleted: false,
    })

    if (!tenant) {
      return sendError(res, 'Tenant not found or inactive', 403)
    }

    req.tenant = tenant
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = {
  requireTenant
}