'use client';

import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('merchant');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/transaction-upload/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      showNotification('success', 'File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      showNotification('error', 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMerchantAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${baseUrl}/transfer-normalizer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const data = await response.json();
      console.log('Merchant analysis result:', data);
      showNotification('success', 'Merchant analysis completed');
    } catch (error) {
      console.error('Error during merchant analysis:', error);
      showNotification('error', 'Failed to analyze merchants');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePatternDetection = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch(`${baseUrl}/pattern-analyzer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Pattern detection failed');
      }
      
      const data = await response.json();
      console.log('Pattern detection result:', data);
      showNotification('success', 'Pattern detection completed');
    } catch (error) {
      console.error('Error during pattern detection:', error);
      showNotification('error', 'Failed to detect patterns');
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {notification.message}
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Transaction Analyzer</h1>
          <div className="flex items-center space-x-4">
            <label className={`px-4 py-2 rounded-md bg-blue-600 text-white cursor-pointer hover:bg-blue-700 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              {isUploading ? 'Uploading...' : 'Upload CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('merchant')}
              className={`${
                activeTab === 'merchant'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Merchant Analysis
            </button>
            <button
              onClick={() => setActiveTab('pattern')}
              className={`${
                activeTab === 'pattern'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pattern Detection
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'merchant' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Merchant Analysis</h2>
              <p className="text-sm text-gray-500 mb-4">
                Analyze and normalize merchant names and categories.
              </p>
              <button
                onClick={handleMerchantAnalysis}
                disabled={isAnalyzing}
                className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 ${
                  isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Merchant Analysis'}
              </button>
            </div>
          )}

          {activeTab === 'pattern' && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pattern Detection</h2>
              <p className="text-sm text-gray-500 mb-4">
                Detect recurring payments and subscription patterns.
              </p>
              <button
                onClick={handlePatternDetection}
                disabled={isDetecting}
                className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 ${
                  isDetecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDetecting ? 'Detecting...' : 'Run Pattern Detection'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
