/**
 * WebResearchService
 * Provides web search and content fetching capabilities for the builder
 */

import axios from 'axios';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface FetchResult {
  url: string;
  content: string;
  title?: string;
  success: boolean;
  error?: string;
}

export class WebResearchService {
  private readonly timeout: number = 10000; // 10 seconds
  private readonly maxContentLength: number = 50000; // 50KB max content

  /**
   * Search the web using DuckDuckGo Instant Answer API (no API key required)
   */
  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Searching web for: "${query}"`);

      // Use DuckDuckGo HTML search (no API key required)
      const response = await axios.get('https://html.duckduckgo.com/html/', {
        params: { q: query },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Parse HTML results (basic extraction)
      const results: SearchResult[] = [];
      const html = response.data;

      // Extract result links and snippets using regex
      const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      let match;
      let count = 0;

      while ((match = resultRegex.exec(html)) !== null && count < maxResults) {
        results.push({
          url: this.cleanUrl(match[1]),
          title: this.cleanText(match[2]),
          snippet: this.cleanText(match[3])
        });
        count++;
      }

      console.log(`✅ Found ${results.length} search results`);
      return results;

    } catch (error: any) {
      console.error('❌ Web search error:', error.message);
      
      // Fallback: Return empty results instead of throwing
      return [];
    }
  }

  /**
   * Fetch content from a URL
   */
  async fetch(url: string): Promise<FetchResult> {
    try {
      console.log(`📥 Fetching content from: ${url}`);

      const response = await axios.get(url, {
        timeout: this.timeout,
        maxContentLength: this.maxContentLength,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: (status) => status < 500 // Accept 4xx errors
      });

      if (response.status >= 400) {
        return {
          url,
          content: '',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      // Extract text content (remove HTML tags for simplicity)
      const content = this.extractTextContent(response.data);
      const title = this.extractTitle(response.data);

      console.log(`✅ Fetched ${content.length} characters from ${url}`);

      return {
        url,
        content,
        title,
        success: true
      };

    } catch (error: any) {
      console.error(`❌ Fetch error for ${url}:`, error.message);
      
      return {
        url,
        content: '',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract text content from HTML
   */
  private extractTextContent(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit length
    return text.substring(0, this.maxContentLength);
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string | undefined {
    if (typeof html !== 'string') {
      return undefined;
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? this.cleanText(titleMatch[1]) : undefined;
  }

  /**
   * Clean URL (decode DuckDuckGo redirect)
   */
  private cleanUrl(url: string): string {
    // DuckDuckGo uses redirect URLs, extract the actual URL
    const match = url.match(/uddg=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return url;
  }

  /**
   * Clean text (decode HTML entities, trim)
   */
  private cleanText(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

