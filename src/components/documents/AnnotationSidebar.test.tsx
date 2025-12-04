import React from 'react';
import { render, screen } from '@testing-library/react';
import AnnotationSidebar from './AnnotationSidebar';
import type { AnnotationWithUser } from '@/lib/types/annotation';

jest.mock('./CommentThread', () => {
  return function MockCommentThread({ highlight, isSelected }: { highlight: AnnotationWithUser; isSelected: boolean }) {
    return (
      <div data-testid={`comment-thread-${highlight.id}`} data-selected={isSelected}>
        {highlight.selection_text}
      </div>
    );
  };
});

describe('AnnotationSidebar', () => {
  const mockAnnotations: AnnotationWithUser[] = [
    {
      id: 'highlight-1',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'highlight',
      parent_id: null,
      content: null,
      selection_start: 0,
      selection_end: 10,
      selection_text: 'First highlight',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      user: {
        id: 'user-1',
        username: 'user1',
        full_name: 'User One'
      }
    },
    {
      id: 'highlight-2',
      document_id: 'doc-1',
      user_id: 'user-2',
      type: 'highlight',
      parent_id: null,
      content: null,
      selection_start: 20,
      selection_end: 30,
      selection_text: 'Second highlight',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-2',
        username: 'user2',
        full_name: 'User Two'
      }
    },
    {
      id: 'comment-1',
      document_id: 'doc-1',
      user_id: 'user-1',
      type: 'comment',
      parent_id: 'highlight-1',
      content: 'This is a comment',
      selection_start: null,
      selection_end: null,
      selection_text: null,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      user: {
        id: 'user-1',
        username: 'user1',
        full_name: 'User One'
      }
    },
    {
      id: 'comment-2',
      document_id: 'doc-1',
      user_id: 'user-2',
      type: 'comment',
      parent_id: 'comment-1',
      content: 'This is a reply',
      selection_start: null,
      selection_end: null,
      selection_text: null,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z',
      user: {
        id: 'user-2',
        username: 'user2',
        full_name: 'User Two'
      }
    }
  ];

  const defaultProps = {
    annotations: [],
    selectedAnnotationId: null,
    canCreate: true,
    canDelete: jest.fn(() => true),
    onAddComment: jest.fn(),
    onDeleteAnnotation: jest.fn(),
    onHighlightClick: jest.fn()
  };

  it('should render empty state when no annotations', () => {
    render(<AnnotationSidebar {...defaultProps} />);

    expect(screen.getByText('Annotations (0)')).toBeInTheDocument();
    expect(screen.getByText('No annotations yet')).toBeInTheDocument();
    expect(screen.getByText(/Select text in the document to create a highlight/)).toBeInTheDocument();
  });

  it('should render empty state with different message when cannot create', () => {
    render(<AnnotationSidebar {...defaultProps} canCreate={false} />);

    expect(screen.getByText(/Annotations will appear here when others add them/)).toBeInTheDocument();
  });

  it('should group annotations into threads', () => {
    render(<AnnotationSidebar {...defaultProps} annotations={mockAnnotations} />);

    expect(screen.getByText('Annotations (2)')).toBeInTheDocument();
    expect(screen.getByTestId('comment-thread-highlight-1')).toBeInTheDocument();
    expect(screen.getByTestId('comment-thread-highlight-2')).toBeInTheDocument();
  });

  it('should sort highlights by creation date (newest first)', () => {
    render(<AnnotationSidebar {...defaultProps} annotations={mockAnnotations} />);

    const threads = screen.getAllByTestId(/comment-thread-/);
    expect(threads[0]).toHaveAttribute('data-testid', 'comment-thread-highlight-1');
    expect(threads[1]).toHaveAttribute('data-testid', 'comment-thread-highlight-2');
  });

  it('should pass comments to thread components', () => {
    render(<AnnotationSidebar {...defaultProps} annotations={mockAnnotations} />);

    const thread1 = screen.getByTestId('comment-thread-highlight-1');
    expect(thread1).toBeInTheDocument();
  });

  it('should mark selected thread', () => {
    render(
      <AnnotationSidebar
        {...defaultProps}
        annotations={mockAnnotations}
        selectedAnnotationId="highlight-1"
      />
    );

    const thread1 = screen.getByTestId('comment-thread-highlight-1');
    expect(thread1).toHaveAttribute('data-selected', 'true');
  });

  it('should handle nested comment chains correctly', () => {
    const nestedAnnotations: AnnotationWithUser[] = [
      {
        id: 'highlight-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 0,
        selection_end: 10,
        selection_text: 'Highlight',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      },
      {
        id: 'comment-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'comment',
        parent_id: 'highlight-1',
        content: 'Comment 1',
        selection_start: null,
        selection_end: null,
        selection_text: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      },
      {
        id: 'comment-2',
        document_id: 'doc-1',
        user_id: 'user-2',
        type: 'comment',
        parent_id: 'comment-1',
        content: 'Reply to comment 1',
        selection_start: null,
        selection_end: null,
        selection_text: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        user: {
          id: 'user-2',
          username: 'user2',
          full_name: 'User Two'
        }
      }
    ];

    render(<AnnotationSidebar {...defaultProps} annotations={nestedAnnotations} />);

    expect(screen.getByTestId('comment-thread-highlight-1')).toBeInTheDocument();
  });

  it('should update when annotations change', () => {
    const { rerender } = render(<AnnotationSidebar {...defaultProps} annotations={[]} />);

    expect(screen.getByText('Annotations (0)')).toBeInTheDocument();

    rerender(<AnnotationSidebar {...defaultProps} annotations={mockAnnotations.slice(0, 1)} />);

    expect(screen.getByText('Annotations (1)')).toBeInTheDocument();
  });
});

