// Displays the document for authenticated users 


'use client';
import { useState, useEffect } from 'react';
import { Document } from '@/lib/types/document';
import { DocumentService } from '@/services/documentService';
import { formatFileSize, formatDate } from '@/lib/utils/helpers';
interface DocumentViewerProps {
  documentId: string;
}

export default function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  useEffect(() => {
    loadDocument();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await DocumentService.getDocument(documentId);
      if (!doc) {
        setError('Document not found');
        return;
      }
      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!document?.raw_text || !term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    const text = document.raw_text.toLowerCase();
    const searchTermLower = term.toLowerCase();
    const results: number[] = [];
    let index = text.indexOf(searchTermLower);

    while (index !== -1) {
      results.push(index);
      index = text.indexOf(searchTermLower, index + 1);
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
  };

  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!));

  const prepareHtml = (text: string, term: string) => {
    const normalized = text
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n(?!\n)/g, " ")
      .replace(/\n\n/g, "<br/><br/>");

    const safe = escapeHtml(normalized);
    if (!term.trim()) return safe;

    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return safe.replace(re, '<mark class="bg-yellow-200">$1</mark>');
  };

  const scrollToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToResult(nextIndex);
  };

  const scrollToPrevResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToResult(prevIndex);
  };

  const scrollToResult = (index: number) => {
    const startIndex = searchResults[index];

    const textElement = window.document.querySelector('.document-text');
    if (textElement) {
      const textContent = textElement.textContent || '';
      const beforeText = textContent.substring(0, startIndex);
      const lines = beforeText.split('\n');
      const lineNumber = lines.length - 1;

      const lineHeight = 24;
      const scrollTop = lineNumber * lineHeight;
      textElement.scrollTop = scrollTop;
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">{error || 'Document not found'}</p>
        </div>
      </div>
    );
  }

  if (document.status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Processing Document</h3>
          <p className="text-gray-600">Your document is being processed. Please wait...</p>
        </div>
      </div>
    );
  }

  if (document.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto text-red-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Error</h3>
          <p className="text-gray-600">There was an error processing this document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{document.title || 'Untitled Document'}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{document.mime_type}</span>
                <span>•</span>
                <span>{formatFileSize(document.bytes)}</span>
                <span>•</span>
                <span>{document.page_count} {document.page_count === 1 ? 'page' : 'pages'}</span>
                <span>•</span>
                <span>{formatDate(document.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-6 lg:px-10 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search in document..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <button
                  onClick={scrollToPrevResult}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={scrollToNextResult}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            {document.raw_text ? (
              <div
                className="document-text w-full whitespace-normal text-gray-900 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: prepareHtml(document.raw_text, searchTerm)
                }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
                <p className="text-gray-500">This document doesn&apos;t have any text content to display.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

