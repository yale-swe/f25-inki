'use client';

import { useState, useEffect } from 'react';
import { AnnotationWithUser, AnnotationThread } from '@/lib/types/annotation';
import CommentThread from './CommentThread';

interface AnnotationSidebarProps {
  documentId: string;
  annotations: AnnotationWithUser[];
  selectedAnnotationId: string | null;
  canCreate: boolean;
  canDelete: (annotation: AnnotationWithUser) => boolean;
  onAddComment: (parentId: string, content: string) => Promise<void>;
  onDeleteAnnotation: (annotationId: string) => Promise<void>;
  onHighlightClick: (annotationId: string) => void;
}

export default function AnnotationSidebar({
  documentId,
  annotations,
  selectedAnnotationId,
  canCreate,
  canDelete,
  onAddComment,
  onDeleteAnnotation,
  onHighlightClick
}: AnnotationSidebarProps) {
  const [threads, setThreads] = useState<AnnotationThread[]>([]);

  useEffect(() => {
    const highlights = annotations.filter(a => a.type === 'highlight');
    const comments = annotations.filter(a => a.type === 'comment');

    const annotationThreads: AnnotationThread[] = highlights.map(highlight => ({
      highlight,
      comments: comments.filter(c => {
        // see if comment belongs to this highlight
        let current: AnnotationWithUser | undefined = c;
        while (current && current.parent_id) {
          if (current.parent_id === highlight.id) {
            return true;
          }
          current = annotations.find(a => a.id === current?.parent_id);
        }
        return false;
      })
    }));

    // newest highlights at the top
    annotationThreads.sort((a, b) => 
      new Date(b.highlight.created_at).getTime() - new Date(a.highlight.created_at).getTime()
    );

    setThreads(annotationThreads);
  }, [annotations]);

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Annotations ({threads.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No annotations yet</h3>
            {/* message changes based on user permissions */}
            <p className="text-sm text-gray-500">
              {canCreate 
                ? 'Select text in the document to create a highlight and start a discussion.'
                : 'Annotations will appear here when others add them.'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {threads.map(thread => (
              <CommentThread
                key={thread.highlight.id}
                highlight={thread.highlight}
                comments={thread.comments}
                documentId={documentId}
                isSelected={selectedAnnotationId === thread.highlight.id}
                canCreate={canCreate}
                canDelete={canDelete}
                onAddComment={onAddComment}
                onDeleteAnnotation={onDeleteAnnotation}
                onHighlightClick={onHighlightClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

