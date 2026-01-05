'use client';

import React from 'react';
import { useScraperEditorStore } from '@/lib/admin/scrapers/store';
import YAML from 'yaml';

export function YamlPreview() {
  const { config } = useScraperEditorStore();
  
  const yamlString = React.useMemo(() => {
    return YAML.stringify(config);
  }, [config]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-muted p-4 border-b">
        <p className="text-sm text-muted-foreground">
          This is a live preview of the generated YAML configuration.
        </p>
      </div>
      <div className="flex-1 bg-slate-950 p-4 overflow-auto">
        <pre className="font-mono text-sm text-green-400">
          {yamlString}
        </pre>
      </div>
    </div>
  );
}
