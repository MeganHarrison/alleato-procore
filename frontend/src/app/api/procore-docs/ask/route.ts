/**
 * PROCORE DOCS RAG API
 *
 * Semantic search over Procore documentation using OpenAI embeddings
 * and vector similarity search in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface SearchResult {
  id: number;
  url: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  query: string;
}

/**
 * POST /api/procore-docs/ask
 *
 * Query the Procore documentation using RAG
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK = 5 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 1: Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Step 2: Search for similar documents in Supabase
    const { data: searchResults, error: searchError } = await supabase.rpc(
      'match_crawled_pages',
      {
        query_embedding: queryEmbedding,
        match_count: topK,
      }
    );

    if (searchError) {
      console.error('Supabase search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search documents' },
        { status: 500 }
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the Procore documentation for your question.",
        sources: [],
        query,
      });
    }

    // Step 3: Build context from search results
    const context = searchResults
      .map((result: SearchResult, idx: number) => {
        return `[Source ${idx + 1}]\nURL: ${result.url}\n${result.content}`;
      })
      .join('\n\n---\n\n');

    // Step 4: Generate answer using OpenAI
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions about Procore construction management software.
Use the provided documentation excerpts to answer the user's question accurately.
If the answer isn't in the documentation, say so.
Always cite which source(s) you used by referencing [Source N].
Keep answers concise but complete.`,
        },
        {
          role: 'user',
          content: `Documentation:\n\n${context}\n\n---\n\nQuestion: ${query}\n\nAnswer:`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const answer = completionResponse.choices[0].message.content || 'No answer generated.';

    // Step 5: Return response with sources
    const response: RAGResponse = {
      answer,
      sources: searchResults.map((result: SearchResult) => ({
        id: result.id,
        url: result.url,
        content: result.content.substring(0, 200) + '...', // Truncate for display
        similarity: result.similarity,
      })),
      query,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('RAG error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
