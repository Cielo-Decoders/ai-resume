import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

interface ResumeUploadProps {
  resumeFile: File | null;
  baseResume: File | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({
  resumeFile,
  baseResume,
  onFileUpload,
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
    <div className="mt-6">
      <label
        className={`block text-sm font-semibold mb-3 ${
          baseResume ? 'text-green-600' : 'text-gray-700'
        }`}
      >
        {baseResume ? 'Base Resume Loaded ✓' : 'Upload Base Resume (PDF)'}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg py-20 px-8 text-center transition-colors cursor-pointer ${
          isDragging
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
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
          <p className="text-gray-600 font-medium">
            {resumeFile ? resumeFile.name : 'Click to upload or drag & drop'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Upload once, optimize for every job
          </p>
        </label>
      </div>
    </div>
  );
};

export default ResumeUpload;
