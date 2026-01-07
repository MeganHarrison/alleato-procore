import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { mockProject } from '@/test-utils/mocks'

// Create a thenable mock that can be both chained and awaited
const createMockQuery = (resolveValue: { data: unknown; error: unknown; count: unknown }) => {
  // Create a base object that is thenable
  const mockObj = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    ilike: jest.fn(),
    not: jest.fn(),
    or: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    // Make the object thenable so it can be awaited
    then: jest.fn((resolve: (value: unknown) => void) => resolve(resolveValue)),
  }

  // Make all methods chainable and return the mock itself
  Object.keys(mockObj).forEach(key => {
    if (key !== 'then') {
      (mockObj as Record<string, jest.Mock>)[key].mockReturnValue(mockObj)
    }
  })

  return mockObj
}

type MockQuery = ReturnType<typeof createMockQuery>
let mockQuery: MockQuery

// Mock Supabase - the route uses createServiceClient from @/lib/supabase/service
jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(() => mockQuery),
}))

describe('/api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns projects with default pagination', async () => {
      mockQuery = createMockQuery({
        data: [mockProject],
        error: null,
        count: 1,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        data: [mockProject],
        meta: {
          page: 1,
          limit: 100,
          total: 1,
          totalPages: 1,
        },
      })

      expect(mockQuery.from).toHaveBeenCalledWith('projects')
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true })
      expect(mockQuery.range).toHaveBeenCalledWith(0, 99)
    })

    it('handles pagination parameters', async () => {
      mockQuery = createMockQuery({
        data: [],
        error: null,
        count: 50,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects?page=2&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.meta).toEqual({
        page: 2,
        limit: 20,
        total: 50,
        totalPages: 3,
      })

      expect(mockQuery.range).toHaveBeenCalledWith(20, 39)
    })

    it('applies search filter', async () => {
      mockQuery = createMockQuery({
        data: [mockProject],
        error: null,
        count: 1,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects?search=test')
      await GET(request)

      expect(mockQuery.or).toHaveBeenCalledWith(
        'name.ilike.%test%,"job number".ilike.%test%'
      )
    })

    it('applies state filter', async () => {
      mockQuery = createMockQuery({
        data: [mockProject],
        error: null,
        count: 1,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects?state=construction')
      await GET(request)

      expect(mockQuery.ilike).toHaveBeenCalledWith('state', 'construction')
    })

    it('excludes specific state', async () => {
      mockQuery = createMockQuery({
        data: [mockProject],
        error: null,
        count: 1,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects?excludeState=completed')
      await GET(request)

      expect(mockQuery.not).toHaveBeenCalledWith('state', 'ilike', 'completed')
    })

    it('handles database errors', async () => {
      mockQuery = createMockQuery({
        data: null,
        error: { message: 'Database error' },
        count: null,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Database error' })
    })

    it('handles unexpected errors', async () => {
      mockQuery = createMockQuery({ data: null, error: null, count: null })
      mockQuery.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'An unexpected error occurred' })
    })
  })

  describe('POST', () => {
    it('creates a new project successfully', async () => {
      const newProject = {
        name: 'New Project',
        client: 'New Client',
        state: 'pre-construction',
      }

      mockQuery = createMockQuery({
        data: { ...newProject, id: 2 },
        error: null,
        count: null,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({ ...newProject, id: 2 })

      expect(mockQuery.from).toHaveBeenCalledWith('projects')
      expect(mockQuery.insert).toHaveBeenCalledWith(newProject)
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('handles creation errors', async () => {
      mockQuery = createMockQuery({
        data: null,
        error: { message: 'Duplicate project name' },
        count: null,
      })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Duplicate' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Duplicate project name' })
    })

    it('handles invalid JSON', async () => {
      mockQuery = createMockQuery({ data: null, error: null, count: null })
      const { createServiceClient } = require('@/lib/supabase/service')
      createServiceClient.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'An unexpected error occurred' })
    })
  })
})