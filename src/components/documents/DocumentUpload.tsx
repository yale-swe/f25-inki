// Upload the pdf file to the database and storage bucket
// shows the progress bar

'use client';

import { useState, useCallback, useRef } from 'react';
import { parseDocument } from '@/lib/pdf/pdfParser';
import { DocumentService } from '@/services/documentService';
import { uploadUserPdf } from '@/lib/supabase/storage';
import { supabase } from '@/lib/supabaseClient';

interface DocumentUploadProps {
  onUploadSuccess?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

export default function DocumentUpload({ onUploadSuccess, onUploadError }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError?.('Please upload a PDF or text file.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      onUploadError?.('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let documentId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Login required');
      }

      let storageInfo = null;
      if (file.type === 'application/pdf') {
        setUploadProgress(25);
        storageInfo = await uploadUserPdf(user.id, file);
      }

      setUploadProgress(50);
      const document = await DocumentService.createProcessingDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
        storage_bucket: storageInfo?.bucket || '',
        storage_path: storageInfo?.path || '',
        mime_type: file.type,
        bytes: file.size
      });

      documentId = document.id;

      setUploadProgress(75);
      const parseResult = await parseDocument(file);

      if (!parseResult.success) {
        throw new Error(parseResult.error || 'Failed to parse document');
      }

      await DocumentService.finalizeDocument(documentId, {
        raw_text: parseResult.text,
        page_count: parseResult.pageCount
      });

      setUploadProgress(100);
      onUploadSuccess?.(documentId);

    } catch (error) {
      console.error('Upload error:', error);

      if (documentId) {
        try {
          await DocumentService.updateDocumentStatus(documentId, 'error');
        } catch (updateError) {
          console.error('Error updating document status:', updateError);
        }
      }

      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {uploadProgress >= 75 ? 'Parsing...' : 'Processing document...'}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your document here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF and text files up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
