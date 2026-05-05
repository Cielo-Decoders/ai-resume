import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

interface ResumeUploadProps {
  resumeFile: File | null;
  baseResume: File | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError?: string | null;
  isValidating?: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  resumeFile,
  baseResume,
  onFileUpload,
  uploadError,
  isValidating,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        const input = document.getElementById('resume-upload') as HTMLInputElement;
        if (input) {
          input.files = dataTransfer.files;
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    },
    []
  );

  return (
    <div className="mt-0">
      <label
        className={`block text-sm font-semibold mb-3 ${
          uploadError ? 'text-red-600' : baseResume ? 'text-green-600' : 'text-gray-700'
        }`}
      >
        {baseResume && !uploadError ? `${baseResume.name} Loaded ✓` : 'Upload Your Resume (PDF)'}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg h-[300px] flex items-center justify-center px-4 text-center transition-colors cursor-pointer ${
          uploadError
            ? 'border-red-400 bg-red-50'
            : isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-500'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          className="hidden"
          id="resume-upload"
          disabled={isValidating}
        />
        <label htmlFor="resume-upload" className={`cursor-pointer ${isValidating ? 'pointer-events-none' : ''}`}>
          {isValidating ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-3 text-indigo-400 animate-spin" />
              <p className="text-indigo-600 font-medium">Checking resume…</p>
            </>
          ) : uploadError ? (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p className="text-red-600 font-medium text-sm">{uploadError}</p>
              <p className="text-sm text-gray-500 mt-2">Click to upload a different file</p>
            </>
          ) : (
            <>
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
              <p className="text-gray-600 font-medium">
                {resumeFile ? resumeFile.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                PDF only · max 2 pages · max 5 MB
              </p>
            </>
          )}
        </label>
      </div>
    </div>
  );
};

export default ResumeUpload;
