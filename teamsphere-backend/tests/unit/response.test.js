const { describe, it, expect } = require('@jest/globals')
const { sendSuccess, sendError, paginate } = require('../../src/utils/response')

// Mock Express response object
const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('Response Utility', () => {
  describe('sendSuccess', () => {
    it('sends 200 with success:true by default', () => {
      const res = mockRes()
      sendSuccess(res, { data: [1, 2] })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: [1, 2] })
      )
    })

    it('uses custom status code', () => {
      const res = mockRes()
      sendSuccess(res, {}, 201, 'Created')
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'Created' })
      )
    })
  })

  describe('sendError', () => {
    it('sends 500 by default', () => {
      const res = mockRes()
      sendError(res, 'Oops')
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Oops' })
      )
    })

    it('includes errors array when provided', () => {
      const res = mockRes()
      const errs = [{ field: 'email', message: 'required' }]
      sendError(res, 'Validation failed', 400, errs)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ errors: errs })
      )
    })
  })

  describe('paginate', () => {
    it('calculates totalPages correctly', () => {
      expect(paginate(100, 1, 10)).toEqual({
        total: 100, page: 1, limit: 10, totalPages: 10,
      })
    })

    it('rounds up totalPages', () => {
      expect(paginate(11, 1, 10).totalPages).toBe(2)
    })

    it('returns 0 totalPages for empty result', () => {
      expect(paginate(0, 1, 10).totalPages).toBe(0)
    })
  })
})
