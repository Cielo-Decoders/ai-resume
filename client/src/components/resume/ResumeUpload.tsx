import React from 'react';
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
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {baseResume ? 'Base Resume Loaded ✓' : 'Upload Base Resume (PDF)'}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileUpload}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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
