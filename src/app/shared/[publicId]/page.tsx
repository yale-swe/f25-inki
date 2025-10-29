// This document viewer is to show to non authenticated users 

'use client';
import { useState, useEffect, use } from 'react';
import { Document } from '@/lib/types/document';
import { DocumentService } from '@/services/documentService';
import { formatFileSize, formatDate } from '@/lib/utils/helpers';

interface SharedDocumentPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export default function SharedDocumentPage({ params }: SharedDocumentPageProps) {
  const { publicId } = use(params);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    loadDocument();
  }, [publicId]);
  const loadDocument = async () => {
    try {
      setLoading(true);
      const doc = await DocumentService.getDocumentByPublicId(publicId);
      if (!doc) {
        setError('Document not found or link is invalid');
        return;
      }
      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');};


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shared document...</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h3>
          <p className="text-gray-600">{error || 'This document link is invalid or has been removed.'}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{document.title || 'Untitled Document'}</h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Shared Document
                </span>
              </div>
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
            <div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            {document.raw_text ? (
              <div
                className="document-text prose prose-lg max-w-none whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: highlightText(document.raw_text, searchTerm)
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
                <p className="text-gray-500">This document doesn't have any text content to display.</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          This document is being shared publicly via a link. Anyone with the link can view it.
        </div>
      </div>
    </div>
  );
}
