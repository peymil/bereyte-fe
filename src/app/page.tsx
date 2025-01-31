'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  _id: string;
  normalized: {
    merchant: string;
    category: string;
    sub_category: string;
    confidence: number;
    is_subscription: boolean;
    flags: string[];
  };
  amount: number;
  date: string;
}

interface Pattern {
  _id: string;
  type: string;
  merchant: string;
  amount: number;
  frequency: string;
  confidence: number;
  next_expected: string;
  last_occurrence: string;
  occurrence_count: number;
  is_active: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('merchant');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/analyze/merchant`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('error', 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatterns = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/analyze/patterns`);
      if (!response.ok) {
        throw new Error('Failed to fetch patterns');
      }
      const data = await response.json();
      setPatterns(data.patterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      showNotification('error', 'Failed to fetch patterns');
    }
  };

  useEffect(() => {
    if (activeTab === 'merchant') {
      fetchTransactions();
    } else {
      fetchPatterns();
    }
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      const response = await fetch(`${baseUrl}/api/transactions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      setTransactions(prev => prev.filter(t => t._id !== id));
      showNotification('success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('error', 'Failed to delete transaction');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      showNotification('success', 'File uploaded successfully');
      fetchTransactions();
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
      const response = await fetch(`${baseUrl}/api/analyze/merchant`, {
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
      fetchTransactions();
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
      const response = await fetch(`${baseUrl}/api/analyze/patterns`, {
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
      fetchPatterns();
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

              {/* Transactions List */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Normalized Transactions</h3>
                {isLoading ? (
                  <p className="text-gray-500">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500">No transactions found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.normalized.merchant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.normalized.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${transaction.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() => handleDelete(transaction._id)}
                                disabled={deletingIds.has(transaction._id)}
                                className={`text-red-600 hover:text-red-900 ${
                                  deletingIds.has(transaction._id) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {deletingIds.has(transaction._id) ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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

              {/* Patterns List */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detected Patterns</h3>
                {patterns.length === 0 ? (
                  <p className="text-gray-500">No patterns detected</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Merchant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Frequency
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Expected
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {patterns.map((pattern) => (
                          <tr key={pattern._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pattern.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pattern.merchant}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${pattern.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {pattern.frequency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(pattern.next_expected).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                pattern.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {pattern.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
