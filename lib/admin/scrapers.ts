'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Scraper {
  id: string;
  name: string;
  display_name: string | null;
  base_url: string;
  url_template: string | null;
  requires_auth: boolean;
  status: 'healthy' | 'degraded' | 'broken' | 'unknown';
  disabled: boolean;
  last_tested: string | null;
  test_results: any | null;
  selectors: any | null;
  workflows: any | null;
  created_at: string;
  updated_at: string;
}

export async function getScrapers(): Promise<Scraper[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('scrapers')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching scrapers:', error);
    throw new Error('Failed to fetch scrapers');
  }
  
  return data as Scraper[];
}

export async function getScraperByName(name: string): Promise<Scraper | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('scrapers')
    .select('*')
    .eq('name', name)
    .single();
    
  if (error) {
    console.error(`Error fetching scraper ${name}:`, error);
    return null;
  }
  
  return data as Scraper;
}

export async function updateScraperStatus(name: string, disabled: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('scrapers')
    .update({ disabled })
    .eq('name', name);
    
  if (error) {
    console.error(`Error updating scraper status ${name}:`, error);
    throw new Error('Failed to update scraper status');
  }
  
  revalidatePath('/admin/scrapers');
}

export async function testScraper(name: string, sku: string) {
  const supabase = await createClient();
  
  // 1. Get scraper by name
  const scraper = await getScraperByName(name);
  if (!scraper) {
    return { error: 'Scraper not found' };
  }
  
  // 2. Create test run record
  const testRun = {
    scraper_id: scraper.id,
    test_type: 'manual',
    skus_tested: [sku],
    results: [],
    status: 'pending',
    started_at: new Date().toISOString(),
  };

  const { data: insertedRun, error: insertError } = await supabase
    .from('scraper_test_runs')
    .insert(testRun)
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create test run:', insertError);
    return { error: 'Failed to create test run' };
  }

  // 3. Get GitHub token
  const { data: settings } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'github_token')
    .single();

  const githubToken = settings?.value as string | undefined;

  // 4. Get Repo
  const { data: scraperRepo } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'scraper_repo')
    .single();

  const repoFullName = (scraperRepo?.value as string) || 'Bay-State-Pet-and-Garden-Supply/BayStateScraper';

  if (!githubToken) {
    await supabase
      .from('scraper_test_runs')
      .update({
        status: 'failed',
        error_message: 'GitHub token not configured',
        completed_at: new Date().toISOString(),
      })
      .eq('id', insertedRun.id);
    return { error: 'GitHub token not configured' };
  }

  // 5. Dispatch Workflow
  const workflowDispatchUrl = `https://api.github.com/repos/${repoFullName}/actions/workflows/scrape.yml/dispatches`;

  try {
    const dispatchResponse = await fetch(workflowDispatchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BayStateApp',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          job_id: insertedRun.id,
          scraper_name: scraper.name,
          skus: JSON.stringify([sku]),
          test_mode: 'true',
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/scraper-network/callback`,
        },
      }),
    });

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.error('GitHub dispatch failed:', errorText);
      
      await supabase
        .from('scraper_test_runs')
        .update({
          status: 'failed',
          error_message: `GitHub dispatch failed: ${dispatchResponse.status}`,
          completed_at: new Date().toISOString(),
        })
        .eq('id', insertedRun.id);
        
      return { error: `Failed to trigger GitHub workflow: ${dispatchResponse.status}` };
    }

    // 6. Update status to running
    await supabase
      .from('scraper_test_runs')
      .update({ status: 'running' })
      .eq('id', insertedRun.id);

    return { 
      success: true, 
      testRunId: insertedRun.id 
    };

  } catch (err) {
    console.error('Error dispatching workflow:', err);
    return { error: 'Internal server error during dispatch' };
  }
}
