'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/types/database.types';

type CrawledPage = Database['public']['Tables']['crawled_pages']['Row'];

interface URLGroup {
  url: string;
  chunks: CrawledPage[];
  totalChunks: number;
  createdAt: string;
  sourceId: string;
}

export default function CrawledPagesPage() {
  const [urlGroups, setUrlGroups] = useState<URLGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'url' | 'date' | 'chunks'>('date');

  useEffect(() => {
    const fetchCrawledPages = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('crawled_pages')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Group by URL
        const grouped = new Map<string, URLGroup>();

        data?.forEach((page) => {
          if (!grouped.has(page.url)) {
            grouped.set(page.url, {
              url: page.url,
              chunks: [],
              totalChunks: 0,
              createdAt: page.created_at,
              sourceId: page.source_id,
            });
          }

          const group = grouped.get(page.url)!;
          group.chunks.push(page);
          group.totalChunks = group.chunks.length;

          // Update created_at to the earliest chunk
          if (page.created_at < group.createdAt) {
            group.createdAt = page.created_at;
          }
        });

        setUrlGroups(Array.from(grouped.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch crawled pages');
        console.error('Error fetching crawled pages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrawledPages();
  }, []);

  // Filter and sort
  const filteredAndSorted = urlGroups
    .filter((group) =>
      group.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'url':
          return a.url.localeCompare(b.url);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'chunks':
          return b.totalChunks - a.totalChunks;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading crawled pages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Crawled Procore Documentation
        </h1>
        <p className="text-gray-600">
          View all crawled documentation pages to identify what still needs to be crawled
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'url' | 'date' | 'chunks')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="date">Sort by Date</option>
              <option value="url">Sort by URL</option>
              <option value="chunks">Sort by Chunks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredAndSorted.length} of {urlGroups.length} URLs
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chunks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crawled At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.map((group) => (
                <tr
                  key={group.url}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      {group.url}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">{group.totalChunks}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {group.sourceId}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(group.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No URLs match your search' : 'No crawled pages found'}
          </div>
        )}
      </div>
    </div>
  );
}
