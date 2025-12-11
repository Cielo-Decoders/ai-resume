import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

interface AppConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle: string;
  company: string;
  matchScore: number;
}

const AppConfirmationModal: React.FC<AppConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  company,
  matchScore,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Confirm Application</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <p className="text-gray-700 font-medium">
              Have you actually applied to this position?
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-indigo-600">Position:</span> {jobTitle}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-indigo-600">Company:</span> {company}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-indigo-600">Match Score:</span>{' '}
                <span className="text-green-600">{matchScore}%</span>
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Tracking your application helps you monitor your job search progress and stay organized.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            No, Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Yes, I Applied
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppConfirmationModal;

