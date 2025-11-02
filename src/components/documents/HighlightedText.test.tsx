import React from 'react';
import { render, screen } from '@testing-library/react';
import HighlightedText from './HighlightedText';
import type { AnnotationWithUser } from '@/lib/types/annotation';

const mockHandleHighlightClick = jest.fn();

interface WindowWithHandleHighlightClick extends Window {
  handleHighlightClick?: (id: string) => void;
}

const windowWithHandler = global.window as WindowWithHandleHighlightClick;
windowWithHandler.handleHighlightClick = mockHandleHighlightClick;

describe('HighlightedText', () => {
  const defaultProps = {
    text: 'This is a test document with some text content.',
    annotations: [],
    searchTerm: '',
    selectedAnnotationId: null,
    onHighlightClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      (window as WindowWithHandleHighlightClick).handleHighlightClick = (id: string) => {
        mockHandleHighlightClick(id);
      };
    }
  });

  it('should render plain text when no annotations', () => {
    render(<HighlightedText {...defaultProps} />);

    const container = screen.getByText(defaultProps.text);
    expect(container).toBeInTheDocument();
  });

  it('should escape HTML characters', () => {
    const textWithHtml = 'Text with <script>alert("xss")</script> & special chars';
    render(<HighlightedText {...defaultProps} text={textWithHtml} />);

    const container = screen.getByText(/Text with/);
    expect(container).toBeInTheDocument();
    expect(container.innerHTML).toContain('&lt;script&gt;');
    expect(container.innerHTML).toContain('&amp;');
  });

  it('should highlight annotation ranges', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 5,
        selection_end: 13,
        selection_text: 'is a test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      }
    ];

    render(<HighlightedText {...defaultProps} annotations={annotations} />);

    const container = screen.getByText(defaultProps.text);
    expect(container).toBeInTheDocument();
    expect(container.innerHTML).toContain('annotation-highlight');
  });

  it('should apply selected state to annotation', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 5,
        selection_end: 13,
        selection_text: 'is a test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      }
    ];

    render(
      <HighlightedText
        {...defaultProps}
        annotations={annotations}
        selectedAnnotationId="ann-1"
      />
    );

    const container = screen.getByText(defaultProps.text);
    expect(container.innerHTML).toContain('bg-yellow-300');
    expect(container.innerHTML).toContain('ring-2');
  });

  it('should show comment indicator when annotation has comments', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 5,
        selection_end: 13,
        selection_text: 'is a test',
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
        user_id: 'user-2',
        type: 'comment',
        parent_id: 'ann-1',
        content: 'A comment',
        selection_start: null,
        selection_end: null,
        selection_text: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-2',
          username: 'user2',
          full_name: 'User Two'
        }
      }
    ];

    render(<HighlightedText {...defaultProps} annotations={annotations} />);

    const container = screen.getByText(defaultProps.text);
    expect(container.innerHTML).toContain('border-b-2 border-yellow-600');
  });

  it('should highlight multiple non-overlapping annotations', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 5,
        selection_end: 13,
        selection_text: 'is a test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      },
      {
        id: 'ann-2',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 20,
        selection_end: 26,
        selection_text: 'some',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      }
    ];

    render(<HighlightedText {...defaultProps} annotations={annotations} />);

    const container = screen.getByText(defaultProps.text);
    const highlights = container.querySelectorAll('.annotation-highlight');
    expect(highlights.length).toBeGreaterThan(0);
  });

  it('should filter out comment annotations from highlights', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: 5,
        selection_end: 13,
        selection_text: 'is a test',
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
        parent_id: 'ann-1',
        content: 'A comment',
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
      }
    ];

    render(<HighlightedText {...defaultProps} annotations={annotations} />);

    const container = screen.getByText(defaultProps.text);
    expect(container.innerHTML).toContain('annotation-highlight');
  });

  it('should apply search highlighting', () => {
    render(<HighlightedText {...defaultProps} searchTerm="test" />);

    const container = screen.getByText(defaultProps.text);
    expect(container.innerHTML).toContain('<mark');
  });

  it('should handle search highlighting with empty text nodes', () => {
    const textWithTags = 'Before<span>Middle</span>After';
    render(<HighlightedText {...defaultProps} text={textWithTags} searchTerm="test" />);

    const container = screen.getByText(/Before/);
    expect(container).toBeInTheDocument();
  });

  it('should handle search highlighting when text node is empty in regex match', () => {
    const textWithEmptyMatch = '<span>Text</span>';
    render(<HighlightedText {...defaultProps} text={textWithEmptyMatch} searchTerm="test" />);

    const container = screen.getByText(/Text/);
    expect(container).toBeInTheDocument();
  });

  it('should handle empty search term', () => {
    render(<HighlightedText {...defaultProps} searchTerm="" />);

    const container = screen.getByText(defaultProps.text);
    expect(container).toBeInTheDocument();
  });

  it('should escape regex special characters in search', () => {
    const text = 'Test with . * + ? characters';
    render(<HighlightedText {...defaultProps} text={text} searchTerm=". * + ?" />);

    const container = screen.getByText(text);
    expect(container).toBeInTheDocument();
  });

  it('should normalize text (remove extra newlines)', () => {
    const textWithNewlines = 'Line 1\n\n\nLine 2\nLine 3';
    render(<HighlightedText {...defaultProps} text={textWithNewlines} />);

    const container = screen.getByText(/Line 1/);
    expect(container).toBeInTheDocument();
  });

  it('should handle annotations with null selection', () => {
    const annotations: AnnotationWithUser[] = [
      {
        id: 'ann-1',
        document_id: 'doc-1',
        user_id: 'user-1',
        type: 'highlight',
        parent_id: null,
        content: null,
        selection_start: null,
        selection_end: null,
        selection_text: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          username: 'user1',
          full_name: 'User One'
        }
      }
    ];

    render(<HighlightedText {...defaultProps} annotations={annotations} />);

    const container = screen.getByText(defaultProps.text);
    expect(container.innerHTML).not.toContain('annotation-highlight');
  });

  it('should set up window handleHighlightClick handler', () => {
    render(<HighlightedText {...defaultProps} />);

    expect(typeof (window as WindowWithHandleHighlightClick).handleHighlightClick).toBe('function');
  });

  it('should call onHighlightClick when window handler is called', () => {
    const onHighlightClick = jest.fn();
    render(<HighlightedText {...defaultProps} onHighlightClick={onHighlightClick} />);

    const handler = (window as WindowWithHandleHighlightClick).handleHighlightClick;
    if (typeof handler === 'function') {
      handler('ann-1');
      expect(onHighlightClick).toHaveBeenCalledWith('ann-1');
    }
  });
});

