import { Metadata } from 'next';
import { ScraperEditor } from '@/components/admin/scrapers/editor/ScraperEditor';

export const metadata: Metadata = {
  title: 'Create Scraper | Admin',
  description: 'Create a new web scraper configuration',
};

export default function CreateScraperPage() {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ScraperEditor />
      </div>
    </div>
  );
}
