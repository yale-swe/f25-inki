// Displays the document for authenticated users 


'use client';
import { useState, useEffect } from 'react';
import { Document } from '@/lib/types/document';
import { DocumentService } from '@/services/documentService';
import { AnnotationService } from '@/services/annotationService';
import { formatFileSize, formatDate } from '@/lib/utils/helpers';
import { AnnotationWithUser } from '@/lib/types/annotation';
import { supabase } from '@/lib/supabaseClient';
import HighlightedText from './HighlightedText';
import AnnotationSidebar from './AnnotationSidebar';
import AnnotationToolbar from './AnnotationToolbar';
import { generateAnnotatedPDF } from '@/services/pdfExportService';
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
  const [annotations, setAnnotations] = useState<AnnotationWithUser[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadDocument();
    loadCurrentUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  useEffect(() => {
    if (!document) {
      return;
    }

    loadAnnotations();
    
    // supabase realtime channel for live updates when others annotate
    const channel = AnnotationService.subscribeToAnnotations(
      documentId,
      handleAnnotationInsert,
      handleAnnotationUpdate,
      handleAnnotationDelete
    );

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, documentId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);
  };

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

  const loadAnnotations = async () => {
    try {
      const annotationsData = await AnnotationService.getAnnotations(documentId);
      setAnnotations(annotationsData);
    } catch (err) {
      console.error('Failed to load annotations:', err);
    }
  };

  const handleAnnotationInsert = async () => {
    // refetch everything since realtime payload doesn't include user data
    const annotationsData = await AnnotationService.getAnnotations(documentId);
    setAnnotations(annotationsData);
  };

  const handleAnnotationUpdate = async () => {
    const annotationsData = await AnnotationService.getAnnotations(documentId);
    setAnnotations(annotationsData);
  };

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    if (selectedAnnotationId === annotationId) {
      setSelectedAnnotationId(null);
    }
  };

  const handleCreateHighlight = async (selection: { start: number; end: number; text: string }) => {
    if (!document) {
      return;
    }

    try {
      await AnnotationService.createHighlight({
        document_id: documentId,
        selection_start: selection.start,
        selection_end: selection.end,
        selection_text: selection.text
      });
      await loadAnnotations();
    } catch (err) {
      console.error('Failed to create highlight:', err);
      alert('Failed to create highlight. Please try again.');
    }
  };

  const handleAddComment = async (parentId: string, content: string) => {
    try {
      await AnnotationService.createComment({
        document_id: documentId,
        parent_id: parentId,
        content
      });
      await loadAnnotations();
    } catch (err) {
      console.error('Failed to add comment:', err);
      throw err;
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await AnnotationService.deleteAnnotation(annotationId);
      await loadAnnotations();
    } catch (err) {
      console.error('Failed to delete annotation:', err);
      throw err;
    }
  };

  const handleHighlightClick = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    
    // small delay to ensure dom has updated before scrolling
    setTimeout(() => {
      const element = window.document.querySelector(`[data-annotation-id="${annotationId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const getAnnotationPermissions = () => {
    if (!document) {
      return { canView: false, canCreate: false, canDelete: () => false };
    }

    return AnnotationService.getAnnotationPermissions(
      document.permission_level || null,
      currentUserId,
      document.owner_id
    );
  };

  const permissions = getAnnotationPermissions();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!document?.raw_text || !term.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }

    // find all occurrences of search term in the document
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

  const scrollToNextResult = () => {
    if (searchResults.length === 0) {
      return;
    }
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToResult(nextIndex);
  };

  const scrollToPrevResult = () => {
    if (searchResults.length === 0) {
      return;
    }
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToResult(prevIndex);
  };

  const scrollToResult = (index: number) => {
    const startIndex = searchResults[index];

    // calculate approximate scroll position based on line numbers
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

  const handleExportPDF = async () => {
    if (!document) {
      return;
    }

    try {
      await generateAnnotatedPDF(document, annotations);
    } catch (err) {
      console.error('Failed to export PDF:', err);
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
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col min-w-0">
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
              <button
                onClick={handleExportPDF}
                disabled={!document.raw_text}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
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

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8">
                {document.raw_text ? (
                  <HighlightedText
                    text={document.raw_text}
                    annotations={annotations}
                    searchTerm={searchTerm}
                    selectedAnnotationId={selectedAnnotationId}
                    onHighlightClick={handleHighlightClick}
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
      </div>

      {permissions.canView && (
        <AnnotationSidebar
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          canCreate={permissions.canCreate}
          canDelete={permissions.canDelete}
          onAddComment={handleAddComment}
          onDeleteAnnotation={handleDeleteAnnotation}
          onHighlightClick={handleHighlightClick}
        />
      )}

      <AnnotationToolbar
        canCreate={permissions.canCreate}
        onCreateHighlight={handleCreateHighlight}
      />
    </div>
  );
}

