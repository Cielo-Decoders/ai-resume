import React, { useState } from 'react';
import { Link, FileText } from 'lucide-react';

interface JobUrlInputProps {
  jobUrl: string;
  jobDescription: string;
  scrapingStatus: string;
  onUrlChange: (url: string) => void;
  onDescriptionChange: (description: string) => void;
  inputMode: 'url' | 'paste';
  onInputModeChange: (mode: 'url' | 'paste') => void;
}

const JobUrlInput: React.FC<JobUrlInputProps> = ({
  jobUrl,
  jobDescription,
  scrapingStatus,
  onUrlChange,
  onDescriptionChange,
  inputMode,
  onInputModeChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Job Details
      </label>

      {/* Toggle Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onInputModeChange('paste')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            inputMode === 'paste'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Paste Description
        </button>
        <button
          onClick={() => onInputModeChange('url')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            inputMode === 'url'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Link className="w-4 h-4" />
          Job URL
        </button>
      </div>

      {/* Paste Text Area */}
      {inputMode === 'paste' && (
        <div>
          <textarea
            value={jobDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;• Job title&#10;• Company name&#10;• Requirements&#10;• Responsibilities&#10;• Skills&#10;• Qualifications&#10;&#10;Our AI will automatically extract and structure this information!"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            rows={12}
          />
          <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
            <div className="mt-0.5">💡</div>
            <div>
              <strong>Recommended:</strong> Copy the entire job posting from LinkedIn, Indeed, or any job site.
              Our AI will extract all the important details automatically!
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      {inputMode === 'url' && (
        <div>
          <div className="relative">
            <Link className="absolute left-3 top-3 text-gray-400" />
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://company.com/jobs/position"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            ⚠️ Note: URL scraping may not work on all job sites. We recommend using "Paste Description" instead.
          </p>
        </div>
      )}

      {scrapingStatus && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
            {scrapingStatus}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobUrlInput;
