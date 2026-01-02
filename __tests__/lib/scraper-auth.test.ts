/**
 * @jest-environment node
 */
import { 
    validateRunnerJWT, 
    validateAPIKey, 
    validateHMAC, 
    validateRunnerAuth,
    generateAPIKey 
} from '@/lib/scraper-auth';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('scraper-auth', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
            SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
            SCRAPER_WEBHOOK_SECRET: 'test-webhook-secret',
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('generateAPIKey', () => {
        it('generates a key with correct format', () => {
            const { key, hash, prefix } = generateAPIKey();
            
            expect(key).toMatch(/^bsr_[A-Za-z0-9_-]+$/);
            expect(hash).toMatch(/^[a-f0-9]{64}$/);
            expect(prefix).toBe(key.substring(0, 12));
        });

        it('generates unique keys', () => {
            const key1 = generateAPIKey();
            const key2 = generateAPIKey();
            
            expect(key1.key).not.toBe(key2.key);
            expect(key1.hash).not.toBe(key2.hash);
        });
    });

    describe('validateAPIKey', () => {
        it('returns null for null key', async () => {
            const result = await validateAPIKey(null);
            expect(result).toBeNull();
        });

        it('returns null for key without bsr_ prefix', async () => {
            const result = await validateAPIKey('invalid-key');
            expect(result).toBeNull();
        });

        it('returns runner info for valid key', async () => {
            const mockRpc = jest.fn().mockResolvedValue({
                data: [{ runner_name: 'test-runner', key_id: 'key-123', is_valid: true }],
                error: null,
            });

            mockCreateClient.mockReturnValue({ rpc: mockRpc } as never);

            const result = await validateAPIKey('bsr_valid-test-key');

            expect(result).toEqual({
                runnerName: 'test-runner',
                keyId: 'key-123',
                authMethod: 'api_key',
            });
        });

        it('returns null for invalid key', async () => {
            const mockRpc = jest.fn().mockResolvedValue({
                data: [{ is_valid: false }],
                error: null,
            });

            mockCreateClient.mockReturnValue({ rpc: mockRpc } as never);

            const result = await validateAPIKey('bsr_invalid-key');
            expect(result).toBeNull();
        });
    });

    describe('validateHMAC', () => {
        it('returns null for null signature', async () => {
            const result = await validateHMAC('payload', null);
            expect(result).toBeNull();
        });

        it('returns null when secret is not configured', async () => {
            delete process.env.SCRAPER_WEBHOOK_SECRET;
            const result = await validateHMAC('payload', 'signature');
            expect(result).toBeNull();
        });

        it('returns runner info for valid signature', async () => {
            const crypto = await import('crypto');
            const payload = '{"test": "data"}';
            const signature = crypto
                .createHmac('sha256', 'test-webhook-secret')
                .update(payload)
                .digest('hex');

            const result = await validateHMAC(payload, signature, 'my-runner');

            expect(result).toEqual({
                runnerName: 'my-runner',
                authMethod: 'hmac',
            });
        });

        it('returns null for invalid signature', async () => {
            const result = await validateHMAC('payload', 'invalid-signature', 'runner');
            expect(result).toBeNull();
        });
    });

    describe('validateRunnerJWT (legacy)', () => {
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
                runnerName: 'test-runner',
                authMethod: 'jwt_legacy',
            });
        });
    });

    describe('validateRunnerAuth', () => {
        it('prefers API key over other methods', async () => {
            const mockRpc = jest.fn().mockResolvedValue({
                data: [{ runner_name: 'api-key-runner', key_id: 'key-123', is_valid: true }],
                error: null,
            });

            mockCreateClient.mockReturnValue({ rpc: mockRpc } as never);

            const result = await validateRunnerAuth({
                apiKey: 'bsr_valid-key',
                authorization: 'Bearer jwt-token',
            });

            expect(result?.authMethod).toBe('api_key');
            expect(result?.runnerName).toBe('api-key-runner');
        });

        it('falls back to HMAC if API key fails', async () => {
            const crypto = await import('crypto');
            const payload = '{"runner_name": "hmac-runner"}';
            const signature = crypto
                .createHmac('sha256', 'test-webhook-secret')
                .update(payload)
                .digest('hex');

            const result = await validateRunnerAuth(
                { webhookSignature: signature },
                payload,
                'hmac-runner'
            );

            expect(result?.authMethod).toBe('hmac');
        });

        it('returns null if all methods fail', async () => {
            const result = await validateRunnerAuth({});
            expect(result).toBeNull();
        });
    });
});
