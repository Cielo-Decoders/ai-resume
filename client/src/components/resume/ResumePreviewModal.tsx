import React, { useEffect, useState } from 'react';
import { FileText, X, Download } from 'lucide-react';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
  oldScore: number;
  newScore: number;
  optimizedResumeText?: string;
  optimizedResumePdf?: Blob | null;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  isOpen,
  onClose,
  jobTitle,
  company,
  oldScore,
  newScore,
  optimizedResumeText,
  optimizedResumePdf,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (optimizedResumePdf) {
      const url = URL.createObjectURL(optimizedResumePdf);
      setPdfUrl(url);

      // Cleanup function to revoke the object URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [optimizedResumePdf]);

  const handleDownload = () => {
    if (!optimizedResumePdf) return;

    const url = URL.createObjectURL(optimizedResumePdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Optimized_Resume_${company.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">Optimized Resume Preview</h2>
              <p className="text-rose-100 text-sm">
                {jobTitle} at {company}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Score Comparison */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 border-b border-rose-200">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Original Score</div>
              <div className="text-3xl font-bold text-gray-500">{oldScore}%</div>
            </div>
            <div className="text-4xl text-gray-400">→</div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Optimized Score</div>
              <div className="text-3xl font-bold text-green-600">{newScore}%</div>
            </div>
            <div className="text-center bg-green-100 px-4 py-2 rounded-lg">
              <div className="text-sm text-green-700 mb-1">Improvement</div>
              <div className="text-2xl font-bold text-green-600">+{newScore - oldScore}%</div>
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden p-6 bg-gray-50">
          {optimizedResumePdf && pdfUrl ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 bg-white rounded-lg shadow-inner overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="Optimized Resume Preview"
                  style={{ minHeight: '500px' }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No optimized resume available yet</p>
                <p className="text-gray-400 text-sm">
                  Click "Optimize & Download for This Job" to generate your optimized resume
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-6 border-t border-gray-200 rounded-b-xl flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Note:</span> Your resume structure is preserved, only content is enhanced with ATS-friendly keywords
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!optimizedResumePdf}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-semibold hover:from-rose-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;
