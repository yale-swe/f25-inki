'use client';

import { useState } from 'react';
import { AnnotationWithUser } from '@/lib/types/annotation';

interface CommentThreadProps {
  highlight: AnnotationWithUser;
  comments: AnnotationWithUser[];
  isSelected: boolean;
  canCreate: boolean;
  canDelete: (annotation: AnnotationWithUser) => boolean;
  onAddComment: (parentId: string, content: string) => Promise<void>;
  onDeleteAnnotation: (annotationId: string) => Promise<void>;
  onHighlightClick: (annotationId: string) => void;
}

export default function CommentThread({
  highlight,
  comments,
  isSelected,
  canCreate,
  canDelete,
  onAddComment,
  onDeleteAnnotation,
  onHighlightClick
}: CommentThreadProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddComment(parentId, replyContent.trim());
      setReplyContent('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (annotationId: string) => {
    try {
      await onDeleteAnnotation(annotationId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // show relative time for recent stuff
    if (diffMins < 1) {
      return 'just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  const buildCommentTree = () => {
    // group comments by parent_id so we can render nested replies
    const commentMap = new Map<string, AnnotationWithUser[]>();
    
    comments.forEach(comment => {
      const parentId = comment.parent_id || '';
      if (!commentMap.has(parentId)) {
        commentMap.set(parentId, []);
      }
      commentMap.get(parentId)?.push(comment);
    });

    return commentMap;
  };

  const commentTree = buildCommentTree();
  // directly under the highlight
  const topLevelComments = commentTree.get(highlight.id) || [];

  // render comments and replies with indent
  const renderComment = (comment: AnnotationWithUser, depth: number = 0) => {
    const replies = commentTree.get(comment.id) || [];
    const isDeleting = deleteConfirm === comment.id;
    const showReplyForm = replyTo === comment.id;

    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 mt-2' : 'mt-3'}`}>
        <div className="flex gap-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            {comment.user.username?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">
                    {comment.user.full_name || comment.user.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                {canDelete(comment) && !isDeleting && (
                  <button
                    onClick={() => setDeleteConfirm(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{comment.content}</p>
            </div>

            {isDeleting && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-gray-600">Delete this comment?</span>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {canCreate && !showReplyForm && !isDeleting && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-xs text-gray-500 hover:text-gray-700 mt-1"
              >
                Reply
              </button>
            )}

            {showReplyForm && (
              <div className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Reply'}
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {replies.length > 0 && (
              <div className="mt-2">
                {replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isSelected ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="cursor-pointer" onClick={() => onHighlightClick(highlight.id)}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-700 italic bg-yellow-100 px-2 py-1 rounded flex-1">
            &quot;{highlight.selection_text}&quot;
          </p>
          {canDelete(highlight) && deleteConfirm !== highlight.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(highlight.id);
              }}
              className="text-gray-400 hover:text-red-600 transition-colors shrink-0"
              title="Delete highlight"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {deleteConfirm === highlight.id && (
          <div 
            className="flex items-center gap-2 mt-2 text-sm" 
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-gray-600">Delete this highlight and all comments?</span>
            <button
              onClick={() => handleDelete(highlight.id)}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {topLevelComments.length > 0 && (
        <div className="mt-2">
          {topLevelComments.map(comment => renderComment(comment, 0))}
        </div>
      )}

      {canCreate && replyTo !== highlight.id && deleteConfirm !== highlight.id && (
        <button
          onClick={() => setReplyTo(highlight.id)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add comment
        </button>
      )}

      {replyTo === highlight.id && (
        <div className="mt-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSubmitReply(highlight.id)}
              disabled={!replyContent.trim() || isSubmitting}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Comment'}
            </button>
            <button
              onClick={() => {
                setReplyTo(null);
                setReplyContent('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

