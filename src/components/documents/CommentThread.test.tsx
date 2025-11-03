import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentThread from './CommentThread';
import type { AnnotationWithUser } from '@/lib/types/annotation';

describe('CommentThread', () => {
  const mockHighlight: AnnotationWithUser = {
    id: 'highlight-1',
    document_id: 'doc-1',
    user_id: 'user-1',
    type: 'highlight',
    parent_id: null,
    content: null,
    selection_start: 0,
    selection_end: 10,
    selection_text: 'Highlighted text',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    user: {
      id: 'user-1',
      username: 'user1',
      full_name: 'User One'
    }
  };

  const mockComment: AnnotationWithUser = {
    id: 'comment-1',
    document_id: 'doc-1',
    user_id: 'user-2',
    type: 'comment',
    parent_id: 'highlight-1',
    content: 'This is a comment',
    selection_start: null,
    selection_end: null,
    selection_text: null,
    created_at: '2024-01-01T11:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
    user: {
      id: 'user-2',
      username: 'user2',
      full_name: 'User Two'
    }
  };

  const defaultProps = {
    highlight: mockHighlight,
    comments: [],
    documentId: 'doc-1',
    isSelected: false,
    canCreate: true,
    canDelete: jest.fn(() => true),
    onAddComment: jest.fn().mockResolvedValue(undefined),
    onDeleteAnnotation: jest.fn().mockResolvedValue(undefined),
    onHighlightClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render highlight text', () => {
    render(<CommentThread {...defaultProps} />);

    expect(screen.getByText('"Highlighted text"')).toBeInTheDocument();
  });

  it('should apply selected styling when isSelected is true', () => {
    render(<CommentThread {...defaultProps} isSelected={true} />);

    const container = screen.getByText('"Highlighted text"').closest('.border');
    expect(container).toHaveClass('border-yellow-400');
    expect(container).toHaveClass('bg-yellow-50/50');
  });

  it('should call onHighlightClick when highlight is clicked', async () => {
    const user = userEvent.setup();
    const onHighlightClick = jest.fn();

    render(<CommentThread {...defaultProps} onHighlightClick={onHighlightClick} />);

    const highlightElement = screen.getByText('"Highlighted text"').closest('.cursor-pointer');
    await user.click(highlightElement!);

    expect(onHighlightClick).toHaveBeenCalledWith('highlight-1');
  });

  it('should render comments', () => {
    render(<CommentThread {...defaultProps} comments={[mockComment]} />);

    expect(screen.getByText('This is a comment')).toBeInTheDocument();
    expect(screen.getByText('User Two')).toBeInTheDocument();
  });

  it('should render nested comments', () => {
    const nestedComment: AnnotationWithUser = {
      id: 'comment-2',
      document_id: 'doc-1',
      user_id: 'user-3',
      type: 'comment',
      parent_id: 'comment-1',
      content: 'This is a reply',
      selection_start: null,
      selection_end: null,
      selection_text: null,
      created_at: '2024-01-01T12:00:00Z',
      updated_at: '2024-01-01T12:00:00Z',
      user: {
        id: 'user-3',
        username: 'user3',
        full_name: 'User Three'
      }
    };

    render(<CommentThread {...defaultProps} comments={[mockComment, nestedComment]} />);

    expect(screen.getByText('This is a comment')).toBeInTheDocument();
    expect(screen.getByText('This is a reply')).toBeInTheDocument();
  });

  it('should show add comment button when canCreate is true', () => {
    render(<CommentThread {...defaultProps} />);

    expect(screen.getByText('+ Add comment')).toBeInTheDocument();
  });

  it('should not show add comment button when canCreate is false', () => {
    render(<CommentThread {...defaultProps} canCreate={false} />);

    expect(screen.queryByText('+ Add comment')).not.toBeInTheDocument();
  });

  it('should show comment form when add comment is clicked', async () => {
    const user = userEvent.setup();
    render(<CommentThread {...defaultProps} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
  });

  it('should call onAddComment when comment is submitted', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn().mockResolvedValue(undefined);

    render(<CommentThread {...defaultProps} onAddComment={onAddComment} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    await user.type(textarea, 'My comment');

    const submitButton = screen.getByText('Comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('highlight-1', 'My comment');
    });
  });

  it('should not submit empty comment', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn();

    render(<CommentThread {...defaultProps} onAddComment={onAddComment} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    const submitButton = screen.getByText('Comment');
    expect(submitButton).toBeDisabled();
    
    await user.click(submitButton);
    expect(onAddComment).not.toHaveBeenCalled();
  });

  it('should not submit reply when isSubmitting is true', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn(() => new Promise<void>(() => {}));

    render(<CommentThread {...defaultProps} comments={[mockComment]} onAddComment={onAddComment} />);

    const replyButton = screen.getByText('Reply');
    await user.click(replyButton);

    const textarea = screen.getByPlaceholderText('Write a reply...');
    await user.type(textarea, 'My reply');

    const submitButton = screen.getByText('Reply');
    await user.click(submitButton);

    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledTimes(1);
    });
  });

  it('should not submit when reply content is only whitespace', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn();

    render(<CommentThread {...defaultProps} comments={[mockComment]} onAddComment={onAddComment} />);

    const replyButton = screen.getByText('Reply');
    await user.click(replyButton);

    const textarea = screen.getByPlaceholderText('Write a reply...');
    await user.type(textarea, '   ');

    const submitButton = screen.getByText('Reply');
    expect(submitButton).toBeDisabled();
    
    await user.click(submitButton);
    expect(onAddComment).not.toHaveBeenCalled();
  });

  it('should cancel comment form', async () => {
    const user = userEvent.setup();
    render(<CommentThread {...defaultProps} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
  });

  it('should cancel reply form', async () => {
    const user = userEvent.setup();
    render(<CommentThread {...defaultProps} comments={[mockComment]} />);

    const replyButton = screen.getByText('Reply');
    await user.click(replyButton);

    const textarea = screen.getByPlaceholderText('Write a reply...');
    await user.type(textarea, 'Some text');

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByPlaceholderText('Write a reply...')).not.toBeInTheDocument();
  });

  it('should show delete button for highlight when canDelete returns true', () => {
    const canDelete = jest.fn((annotation) => annotation.id === 'highlight-1');
    render(<CommentThread {...defaultProps} canDelete={canDelete} />);

    const deleteButton = screen.getByTitle('Delete highlight');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should not show delete button when canDelete returns false', () => {
    const canDelete = jest.fn(() => false);
    render(<CommentThread {...defaultProps} canDelete={canDelete} />);

    expect(screen.queryByTitle('Delete highlight')).not.toBeInTheDocument();
  });

  it('should show delete confirmation for highlight', async () => {
    const user = userEvent.setup();
    render(<CommentThread {...defaultProps} />);

    const deleteButton = screen.getByTitle('Delete highlight');
    await user.click(deleteButton);

    expect(screen.getByText('Delete this highlight and all comments?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onDeleteAnnotation when delete is confirmed', async () => {
    const user = userEvent.setup();
    const onDeleteAnnotation = jest.fn().mockResolvedValue(undefined);

    render(<CommentThread {...defaultProps} onDeleteAnnotation={onDeleteAnnotation} />);

    const deleteButton = screen.getByTitle('Delete highlight');
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onDeleteAnnotation).toHaveBeenCalledWith('highlight-1');
    });
  });

  it('should show delete button for comments when canDelete returns true', () => {
    const canDelete = jest.fn((annotation) => annotation.id === 'comment-1');
    render(<CommentThread {...defaultProps} comments={[mockComment]} canDelete={canDelete} />);

    const deleteButton = screen.getByTitle('Delete comment');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should show delete confirmation for comments', async () => {
    const user = userEvent.setup();
    const canDelete = jest.fn((annotation) => annotation.id === 'comment-1');
    
    render(<CommentThread {...defaultProps} comments={[mockComment]} canDelete={canDelete} />);

    const deleteButton = screen.getByTitle('Delete comment');
    await user.click(deleteButton);

    expect(screen.getByText('Delete this comment?')).toBeInTheDocument();
  });

  it('should format date as relative time', () => {
    const recentComment: AnnotationWithUser = {
      ...mockComment,
      created_at: new Date(Date.now() - 30000).toISOString()
    };

    render(<CommentThread {...defaultProps} comments={[recentComment]} />);

    expect(screen.getByText(/just now|1m ago/)).toBeInTheDocument();
  });

  it('should format date as minutes ago', () => {
    const recentComment: AnnotationWithUser = {
      ...mockComment,
      created_at: new Date(Date.now() - 120000).toISOString()
    };

    render(<CommentThread {...defaultProps} comments={[recentComment]} />);

    expect(screen.getByText(/2m ago/)).toBeInTheDocument();
  });

  it('should format date as hours ago', () => {
    const recentComment: AnnotationWithUser = {
      ...mockComment,
      created_at: new Date(Date.now() - 3600000).toISOString()
    };

    render(<CommentThread {...defaultProps} comments={[recentComment]} />);

    expect(screen.getByText(/1h ago/)).toBeInTheDocument();
  });

  it('should format date as days ago', () => {
    const recentComment: AnnotationWithUser = {
      ...mockComment,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    };

    render(<CommentThread {...defaultProps} comments={[recentComment]} />);

    expect(screen.getByText(/3d ago/)).toBeInTheDocument();
  });

  it('should show reply button for comments when canCreate is true', () => {
    render(<CommentThread {...defaultProps} comments={[mockComment]} />);

    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('should show reply form when reply is clicked', async () => {
    const user = userEvent.setup();
    render(<CommentThread {...defaultProps} comments={[mockComment]} />);

    const replyButton = screen.getByText('Reply');
    await user.click(replyButton);

    expect(screen.getByPlaceholderText('Write a reply...')).toBeInTheDocument();
  });

  it('should submit reply to comment', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn().mockResolvedValue(undefined);

    render(<CommentThread {...defaultProps} comments={[mockComment]} onAddComment={onAddComment} />);

    const replyButton = screen.getByText('Reply');
    await user.click(replyButton);

    const textarea = screen.getByPlaceholderText('Write a reply...');
    await user.type(textarea, 'My reply');

    const submitButton = screen.getByText('Reply');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('comment-1', 'My reply');
    });
  });

  it('should use username when full_name is not available', () => {
    const commentWithoutFullName: AnnotationWithUser = {
      ...mockComment,
      user: {
        id: 'user-2',
        username: 'user2',
        full_name: null
      }
    };

    render(<CommentThread {...defaultProps} comments={[commentWithoutFullName]} />);

    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('should use first letter of username for avatar when full_name is not available', () => {
    const commentWithoutFullName: AnnotationWithUser = {
      ...mockComment,
      user: {
        id: 'user-2',
        username: 'user2',
        full_name: null
      }
    };

    render(<CommentThread {...defaultProps} comments={[commentWithoutFullName]} />);

    const avatar = screen.getByText('U');
    expect(avatar).toBeInTheDocument();
  });

  it('should handle error when deleting annotation', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const onDeleteAnnotation = jest.fn().mockRejectedValue(new Error('Delete failed'));

    render(<CommentThread {...defaultProps} onDeleteAnnotation={onDeleteAnnotation} />);

    const deleteButton = screen.getByTitle('Delete highlight');
    await user.click(deleteButton);

    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onDeleteAnnotation).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith('Failed to delete annotation:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should handle error when adding comment', async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    const onAddComment = jest.fn().mockRejectedValue(new Error('Add failed'));

    render(<CommentThread {...defaultProps} onAddComment={onAddComment} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    await user.type(textarea, 'My comment');

    const submitButton = screen.getByText('Comment');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith('Failed to submit reply:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    const onAddComment = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));

    render(<CommentThread {...defaultProps} onAddComment={onAddComment} />);

    const addButton = screen.getByText('+ Add comment');
    await user.click(addButton);

    const textarea = screen.getByPlaceholderText('Write a comment...');
    await user.type(textarea, 'My comment');

    const submitButton = screen.getByText('Comment');
    await user.click(submitButton);

    expect(screen.getByText('Posting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

