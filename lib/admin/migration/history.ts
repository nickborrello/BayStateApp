/**
 * Migration History Utilities
 * 
 * Functions for logging and retrieving migration sync history.
 */

import { createClient } from '@/lib/supabase/server';
import { SyncResult } from './types';

export interface MigrationLogEntry {
    id: string;
    sync_type: string;
    started_at: string;
    completed_at: string | null;
    status: 'running' | 'completed' | 'failed';
    processed: number;
    created: number;
    updated: number;
    failed: number;
    duration_ms: number | null;
    errors: Array<{ record: string; error: string; timestamp: string }>;
}

/**
 * Log the start of a migration sync.
 */
export async function startMigrationLog(syncType: 'products' | 'customers' | 'orders'): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('migration_log')
        .insert({
            sync_type: syncType,
            status: 'running',
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create migration log:', error);
        return null;
    }

    return data?.id || null;
}

/**
 * Complete a migration log entry with the results.
 */
export async function completeMigrationLog(logId: string, result: SyncResult): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('migration_log')
        .update({
            completed_at: new Date().toISOString(),
            status: result.success ? 'completed' : 'failed',
            processed: result.processed,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            duration_ms: result.duration,
            errors: result.errors,
        })
        .eq('id', logId);

    if (error) {
        console.error('Failed to update migration log:', error);
    }
}

/**
 * Get recent migration logs for display.
 */
export async function getRecentMigrationLogs(limit: number = 10): Promise<MigrationLogEntry[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('migration_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch migration logs:', error);
        return [];
    }

    return data || [];
}
