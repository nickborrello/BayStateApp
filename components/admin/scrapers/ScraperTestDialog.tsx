'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { testScraper } from '@/lib/admin/scrapers';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScraperTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scraperName: string;
}

export function ScraperTestDialog({ open, onOpenChange, scraperName }: ScraperTestDialogProps) {
  const [sku, setSku] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    if (!sku) return;
    
    setIsRunning(true);
    setResults(null);
    setError(null);
    setTestRunId(null);

    try {
      const response = await testScraper(scraperName, sku);
      
      if (response.error) {
        setError(response.error);
        setIsRunning(false);
        toast.error(response.error);
        return;
      }

      if (response.success && response.testRunId) {
        setTestRunId(response.testRunId);
        // Polling will start automatically via useEffect
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setIsRunning(false);
      console.error(err);
    }
  };

  // Polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (testRunId && isRunning) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/scraper-network/test?id=${testRunId}`);
          if (!res.ok) return;
          
          const data = await res.json();
          
          if (data.status === 'completed' || data.status === 'failed') {
            setIsRunning(false);
            setResults(data);
            if (data.status === 'failed') {
              setError(data.error_message || 'Test failed');
            } else {
              toast.success('Test completed successfully');
            }
            clearInterval(intervalId);
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 2000);
    }

    return () => clearInterval(intervalId);
  }, [testRunId, isRunning]);

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isRunning) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test {scraperName}</DialogTitle>
          <DialogDescription>
            Enter a product SKU to test the scraper configuration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sku">Product SKU</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. B08..."
              disabled={isRunning}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="rounded-md border p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium">
                {results.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                Test {results.status === 'completed' ? 'Passed' : 'Failed'}
              </div>
              <pre className="max-h-[200px] overflow-auto rounded bg-muted p-2 text-xs font-mono">
                {JSON.stringify(results.results || results.error_message, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>
            Close
          </Button>
          <Button onClick={handleRunTest} disabled={!sku || isRunning}>
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? 'Running...' : 'Run Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
