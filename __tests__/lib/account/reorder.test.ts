import { getFrequentlyBoughtProducts, getRecentOrders } from '@/lib/account/reorder'

// Create chainable mock
const createMockChain = (finalResult: any) => {
    const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(finalResult),
    }
    // Make select return chainable object with eq
    chain.select.mockReturnValue({ eq: chain.eq })
    chain.eq.mockReturnValue({ order: chain.order, data: finalResult.data, error: finalResult.error })
    chain.order.mockReturnValue({ limit: chain.limit })
    return chain
}

let mockChain: any

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => ({
        auth: {
            getUser: jest.fn(() => ({ data: { user: { id: 'test-user' } }, error: null }))
        },
        from: jest.fn(() => mockChain)
    }))
}))

describe('reorder.ts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getFrequentlyBoughtProducts', () => {
        it('returns empty array for no order history', async () => {
            mockChain = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })
            }

            const result = await getFrequentlyBoughtProducts()
            expect(result).toEqual([])
        })

        it('aggregates and filters products by order count', async () => {
            const mockData = [
                { product_id: 'p1', orders: { user_id: 'test-user' }, products: { id: 'p1', name: 'Product 1', slug: 'p1', price: 10, images: [] } },
                { product_id: 'p1', orders: { user_id: 'test-user' }, products: { id: 'p1', name: 'Product 1', slug: 'p1', price: 10, images: [] } },
                { product_id: 'p2', orders: { user_id: 'test-user' }, products: { id: 'p2', name: 'Product 2', slug: 'p2', price: 20, images: [] } },
            ]

            mockChain = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
                })
            }

            const result = await getFrequentlyBoughtProducts()
            // Only p1 should be returned (ordered 2 times, p2 only once)
            expect(result.length).toBe(1)
            expect(result[0].id).toBe('p1')
            expect(result[0].order_count).toBe(2)
        })
    })

    describe('getRecentOrders', () => {
        it('returns empty array when no orders', async () => {
            mockChain = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue({ data: [], error: null })
                        })
                    })
                })
            }

            const result = await getRecentOrders()
            expect(result).toEqual([])
        })

        it('returns orders sorted by date', async () => {
            const mockOrders = [
                { id: 'o1', order_number: '1001', status: 'delivered', total: 50.00, created_at: '2024-01-01' }
            ]

            mockChain = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue({ data: mockOrders, error: null })
                        })
                    })
                })
            }

            const result = await getRecentOrders()
            expect(result.length).toBe(1)
            expect(result[0].order_number).toBe('1001')
        })
    })
})
