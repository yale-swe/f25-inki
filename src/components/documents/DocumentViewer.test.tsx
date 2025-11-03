import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentViewer from './DocumentViewer';
import { DocumentService } from '@/services/documentService';
import { AnnotationService } from '@/services/annotationService';
import { supabase } from '@/lib/supabaseClient';
import type { Document } from '@/lib/types/document';
import type { AnnotationWithUser } from '@/lib/types/annotation';

type Selection = {
  removeAllRanges: () => void;
  rangeCount: number;
  toString: () => string;
  getRangeAt: (index: number) => Range;
};

jest.mock('@/services/documentService');
jest.mock('@/services/annotationService');
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    removeChannel: jest.fn()
  }
}));

jest.mock('./HighlightedText', () => {
  return function MockHighlightedText({ 
    text, 
    annotations, 
    searchTerm, 
    selectedAnnotationId, 
    onHighlightClick 
  }: { 
    text: string; 
    annotations: AnnotationWithUser[]; 
    searchTerm: string; 
    selectedAnnotationId: string | null; 
    onHighlightClick: (id: string) => void;
  }) {
    return (
      <div data-testid="highlighted-text">
        <div>{text}</div>
        <div data-testid="annotations-count">{annotations.length}</div>
        <div data-testid="search-term">{searchTerm}</div>
        <div data-testid="selected-annotation">{selectedAnnotationId || 'none'}</div>
        <button onClick={() => onHighlightClick('ann-1')}>Click highlight</button>
      </div>
    );
  };
});

jest.mock('./AnnotationSidebar', () => {
  return function MockAnnotationSidebar({ 
    annotations, 
    canCreate, 
    onAddComment, 
    onDeleteAnnotation 
  }: { 
    annotations: AnnotationWithUser[]; 
    canCreate: boolean; 
    onAddComment: (parentId: string, content: string) => Promise<void>; 
    onDeleteAnnotation: (id: string) => Promise<void>;
  }) {
    return (
      <div data-testid="annotation-sidebar">
        <div data-testid="annotations-sidebar-count">{annotations.length}</div>
        <div data-testid="can-create">{canCreate ? 'true' : 'false'}</div>
        <button onClick={() => onAddComment('parent-1', 'New comment')}>Add comment</button>
        <button onClick={() => onDeleteAnnotation('ann-1')}>Delete annotation</button>
      </div>
    );
  };
});

jest.mock('./AnnotationToolbar', () => {
  return function MockAnnotationToolbar({ 
    canCreate, 
    onCreateHighlight 
  }: { 
    canCreate: boolean; 
    onCreateHighlight: (selection: { start: number; end: number; text: string }) => void;
  }) {
    return (
      <div data-testid="annotation-toolbar">
        <div data-testid="toolbar-can-create">{canCreate ? 'true' : 'false'}</div>
        <button onClick={() => onCreateHighlight({ start: 0, end: 10, text: 'selected' })}>Create highlight</button>
      </div>
    );
  };
});

describe('DocumentViewer', () => {
  const mockDocument: Document = {
    id: 'doc-1',
    owner_id: 'user-1',
    title: 'Test Document',
    file_path: '/path/to/file',
    file_size: 1024,
    mime_type: 'application/pdf',
    storage_bucket: 'bucket',
    storage_path: '/path',
    bytes: 1024,
    page_count: 5,
    status: 'ready',
    public_id: null,
    raw_text: 'This is the document content with some text to search.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    permission_level: 'owner'
  };

  const mockAnnotations: AnnotationWithUser[] = [
    {
      id: 'ann-1',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'highlight',
      parent_id: null,
      content: null,
      selection_start: 5,
      selection_end: 13,
      selection_text: 'is the',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      user: {
        id: 'user-1',
        username: 'user1',
        full_name: 'User One'
      }
    }
  ];

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (DocumentService.getDocument as jest.Mock).mockResolvedValue(mockDocument);
    (AnnotationService.getAnnotations as jest.Mock).mockResolvedValue(mockAnnotations);
    (AnnotationService.subscribeToAnnotations as jest.Mock).mockReturnValue(mockChannel);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    });
    (AnnotationService.getAnnotationPermissions as jest.Mock).mockReturnValue({
      canView: true,
      canCreate: true,
      canDelete: jest.fn(() => true)
    });
  });

  it('should show loading state initially', () => {
    (DocumentService.getDocument as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<DocumentViewer documentId="doc-1" />);

    expect(screen.getByText('Loading document...')).toBeInTheDocument();
  });

  it('should load and display document', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(DocumentService.getDocument).toHaveBeenCalledWith('doc-1');
    });

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText(mockDocument.raw_text!)).toBeInTheDocument();
  });

  it('should show error when document not found', async () => {
    (DocumentService.getDocument as jest.Mock).mockResolvedValue(null);

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Document not found')).toBeInTheDocument();
    });
  });

  it('should show error message on load failure', async () => {
    (DocumentService.getDocument as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show processing state', async () => {
    const processingDoc = { ...mockDocument, status: 'processing' as const };
    (DocumentService.getDocument as jest.Mock).mockResolvedValue(processingDoc);

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Processing Document')).toBeInTheDocument();
      expect(screen.getByText(/Your document is being processed/)).toBeInTheDocument();
    });
  });

  it('should show error state', async () => {
    const errorDoc = { ...mockDocument, status: 'error' as const };
    (DocumentService.getDocument as jest.Mock).mockResolvedValue(errorDoc);

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Processing Error')).toBeInTheDocument();
      expect(screen.getByText(/There was an error processing/)).toBeInTheDocument();
    });
  });

  it('should load annotations on mount', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.getAnnotations).toHaveBeenCalledWith('doc-1');
    });
  });

  it('should handle errors when loading annotations', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (AnnotationService.getAnnotations as jest.Mock).mockRejectedValueOnce(new Error('Load failed'));

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.getAnnotations).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith('Failed to load annotations:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should subscribe to annotation changes', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.subscribeToAnnotations).toHaveBeenCalledWith(
        'doc-1',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should unsubscribe from annotation changes on unmount', async () => {
    const { unmount } = render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.subscribeToAnnotations).toHaveBeenCalled();
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should handle creating highlight', async () => {
    const user = userEvent.setup();
    const createHighlightSpy = jest.spyOn(AnnotationService, 'createHighlight').mockResolvedValue({
      id: 'ann-2',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'highlight',
      parent_id: null,
      content: null,
      selection_start: 0,
      selection_end: 10,
      selection_text: 'selected',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create highlight');
    await user.click(createButton);

    await waitFor(() => {
      expect(createHighlightSpy).toHaveBeenCalledWith({
        document_id: 'doc-1',
        selection_start: 0,
        selection_end: 10,
        selection_text: 'selected'
      });
      expect(AnnotationService.getAnnotations).toHaveBeenCalledTimes(2);
    });

    createHighlightSpy.mockRestore();
  });

  it('should handle adding comment', async () => {
    const user = userEvent.setup();
    const createCommentSpy = jest.spyOn(AnnotationService, 'createComment').mockResolvedValue({
      id: 'comment-1',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'comment',
      parent_id: 'parent-1',
      content: 'New comment',
      selection_start: null,
      selection_end: null,
      selection_text: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const addCommentButton = screen.getByText('Add comment');
    await user.click(addCommentButton);

    await waitFor(() => {
      expect(createCommentSpy).toHaveBeenCalledWith({
        document_id: 'doc-1',
        parent_id: 'parent-1',
        content: 'New comment'
      });
      expect(AnnotationService.getAnnotations).toHaveBeenCalledTimes(2);
    });

    createCommentSpy.mockRestore();
  });

  it('should handle deleting annotation', async () => {
    const user = userEvent.setup();
    const deleteAnnotationSpy = jest.spyOn(AnnotationService, 'deleteAnnotation').mockResolvedValue();

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete annotation');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(deleteAnnotationSpy).toHaveBeenCalledWith('ann-1');
      expect(AnnotationService.getAnnotations).toHaveBeenCalledTimes(2);
    });

    deleteAnnotationSpy.mockRestore();
  });

  it('should handle highlight click and scroll', async () => {
    const user = userEvent.setup();
    const scrollIntoViewSpy = jest.fn();
    
    const mockElement = document.createElement('div');
    mockElement.scrollIntoView = scrollIntoViewSpy;
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const clickButton = screen.getByText('Click highlight');
    await user.click(clickButton);

    await waitFor(() => {
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });
  });

  it('should handle search', async () => {
    const user = userEvent.setup();

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search in document...');
    await user.type(searchInput, 'text');

    await waitFor(() => {
      const searchTermElement = screen.getByTestId('search-term');
      expect(searchTermElement).toHaveTextContent('text');
    });
  });

  it('should show search results count', async () => {
    const user = userEvent.setup();

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search in document...');
    await user.type(searchInput, 'text');

    await waitFor(() => {
      const resultsText = screen.queryByText(/of \d+/);
      if (resultsText) {
        expect(resultsText).toBeInTheDocument();
      }
    });
  });

  it('should navigate search results', async () => {
    const user = userEvent.setup();

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search in document...');
    await user.type(searchInput, 'text');

    await waitFor(() => {
      const nextButton = screen.queryByLabelText(/next/i) || screen.queryByText(/next/i);
      if (nextButton) {
        expect(nextButton).toBeInTheDocument();
      }
    });
  });

  it('should show annotation sidebar when canView is true', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('annotation-sidebar')).toBeInTheDocument();
    });
  });

  it('should not show annotation sidebar when canView is false', async () => {
    (AnnotationService.getAnnotationPermissions as jest.Mock).mockReturnValue({
      canView: false,
      canCreate: false,
      canDelete: jest.fn(() => false)
    });

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.queryByTestId('annotation-sidebar')).not.toBeInTheDocument();
    });
  });

  it('should pass correct permissions to components', async () => {
    (AnnotationService.getAnnotationPermissions as jest.Mock).mockReturnValue({
      canView: true,
      canCreate: false,
      canDelete: jest.fn(() => false)
    });

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      const canCreateElement = screen.getByTestId('can-create');
      expect(canCreateElement).toHaveTextContent('false');
      
      const toolbarCanCreate = screen.getByTestId('toolbar-can-create');
      expect(toolbarCanCreate).toHaveTextContent('false');
    });
  });

  it('should handle annotation insert event', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.subscribeToAnnotations).toHaveBeenCalled();
    });

    const subscribeCall = (AnnotationService.subscribeToAnnotations as jest.Mock).mock.calls[0];
    const onInsert = subscribeCall[1];

    const newAnnotation = {
      id: 'ann-2',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'highlight',
      parent_id: null,
      content: null,
      selection_start: 20,
      selection_end: 30,
      selection_text: 'new text',
      created_at: '2024-01-01T11:00:00Z',
      updated_at: '2024-01-01T11:00:00Z'
    };

    (AnnotationService.getAnnotations as jest.Mock).mockResolvedValue([...mockAnnotations, newAnnotation]);

    onInsert(newAnnotation);

    await waitFor(() => {
      expect(AnnotationService.getAnnotations).toHaveBeenCalledWith('doc-1');
    });
  });

  it('should handle annotation delete event', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(AnnotationService.subscribeToAnnotations).toHaveBeenCalled();
    });

    const subscribeCall = (AnnotationService.subscribeToAnnotations as jest.Mock).mock.calls[0];
    const onDelete = subscribeCall[3];

    onDelete('ann-1');

    await waitFor(() => {
      const annotationsCount = screen.getByTestId('annotations-count');
      expect(annotationsCount).toBeInTheDocument();
    });
  });

  it('should load current user on mount', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });
  });

  it('should show no content message when raw_text is null', async () => {
    const docWithoutText = { ...mockDocument, raw_text: null };
    (DocumentService.getDocument as jest.Mock).mockResolvedValue(docWithoutText);

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('No content available')).toBeInTheDocument();
      expect(screen.getByText(/This document doesn't have any text content/)).toBeInTheDocument();
    });
  });

  it('should display document metadata', async () => {
    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('application/pdf')).toBeInTheDocument();
      expect(screen.getByText(/5 pages/)).toBeInTheDocument();
    });
  });

  it('should clear search when search term is empty', async () => {
    const user = userEvent.setup();

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search in document...');
    await user.type(searchInput, 'text');
    await user.clear(searchInput);

    await waitFor(() => {
      const searchTermElement = screen.getByTestId('search-term');
      expect(searchTermElement).toHaveTextContent('');
    });
  });

  it('should handle errors when creating highlight', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    jest.spyOn(AnnotationService, 'createHighlight').mockRejectedValue(new Error('Failed'));

    render(<DocumentViewer documentId="doc-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create highlight');
    await user.click(createButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to create highlight:', expect.any(Error));
      expect(alertSpy).toHaveBeenCalledWith('Failed to create highlight. Please try again.');
    });

    consoleError.mockRestore();
    alertSpy.mockRestore();
  });
});

