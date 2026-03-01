const sendSuccess = (res, data = {}, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  })
}

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message
  }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

const paginate = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
})

module.exports = {
  sendSuccess,
  sendError,
  paginate
}