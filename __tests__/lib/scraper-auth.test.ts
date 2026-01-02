/**
 * @jest-environment node
 */
import { validateRunnerJWT } from '@/lib/scraper-auth';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('validateRunnerJWT', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns null if auth header is missing', async () => {
        const result = await validateRunnerJWT(null);
        expect(result).toBeNull();
    });

    it('returns null if auth header is not Bearer format', async () => {
        const result = await validateRunnerJWT('Basic abc123');
        expect(result).toBeNull();
    });

    it('returns null if token is empty', async () => {
        const result = await validateRunnerJWT('Bearer ');
        expect(result).toBeNull();
    });

    it('returns null if getUser fails', async () => {
        const mockGetUser = jest.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid token' },
        });
        const mockAuth = { getUser: mockGetUser };

        mockCreateClient.mockReturnValue({ auth: mockAuth } as never);

        const result = await validateRunnerJWT('Bearer invalid-token');
        expect(result).toBeNull();
    });

    it('returns null if runner not found for user', async () => {
        const mockGetUser = jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
        const mockAuth = { getUser: mockGetUser };

        const mockSingle = jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        mockCreateClient
            .mockReturnValueOnce({ auth: mockAuth } as never)
            .mockReturnValueOnce({ from: mockFrom } as never);

        const result = await validateRunnerJWT('Bearer valid-token');
        expect(result).toBeNull();
    });

    it('returns runner info on successful validation', async () => {
        const mockGetUser = jest.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
        const mockAuth = { getUser: mockGetUser };

        const mockUpdate = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
        });
        const mockSingle = jest.fn().mockResolvedValue({
            data: { name: 'test-runner' },
            error: null,
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = jest.fn()
            .mockReturnValueOnce({ select: mockSelect })
            .mockReturnValueOnce({ update: mockUpdate });

        mockCreateClient
            .mockReturnValueOnce({ auth: mockAuth } as never)
            .mockReturnValueOnce({ from: mockFrom } as never);

        const result = await validateRunnerJWT('Bearer valid-token');

        expect(result).toEqual({
            userId: 'user-123',
            runnerName: 'test-runner',
            runnerId: 'test-runner',
        });
    });
});
