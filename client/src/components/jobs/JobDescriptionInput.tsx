import React from 'react';

interface JobDescriptionInputProps {
  jobDescription: string;
  scrapingStatus: string;
  onDescriptionChange: (description: string) => void;
  inputMode: 'paste';
  onInputModeChange: (mode:'paste') => void;
}

const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  jobDescription,
  scrapingStatus,
  onDescriptionChange,
  inputMode,
  onInputModeChange,
}) => {
  return (
    <div className="mt-0">
      {/* Recommendation text */}
      <div className="mb-2 flex items-start gap-2 text-sm text-gray-600">
         <div className="mt-0.5">💡</div>
           <div>
              <strong>Recommended:</strong> Copy the entire job posting from any job site.
           </div>
         </div>

      {/* Paste Text Area */}
      {inputMode === 'paste' && (
        <textarea
          value={jobDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Paste the complete job description here...\n\nInclude:\n• Job title\n• Company name\n• Requirements\n• Responsibilities\n• Skills\n• Qualifications\n\nOur AI will automatically extract and structure this information!"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={12}
        />
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

export default JobDescriptionInput;
