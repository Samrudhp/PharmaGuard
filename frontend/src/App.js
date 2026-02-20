import React, { useState } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import DrugInput from './components/DrugInput';
import ResultDisplay from './components/ResultDisplay';
import ErrorBanner from './components/ErrorBanner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!selectedFile || selectedDrugs.length === 0) {
      setError({
        code: 'MISSING_INPUT',
        message: 'Please select both a VCF file and at least one drug',
        details: 'Both inputs are required to perform the analysis'
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('drug', selectedDrugs.join(','));

      const response = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.detail) {
        const detail = err.response.data.detail;
        if (detail.error) {
          setError(detail.error);
        } else {
          setError({
            code: 'API_ERROR',
            message: typeof detail === 'string' ? detail : 'Analysis failed',
            details: JSON.stringify(detail)
          });
        }
      } else {
        setError({
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          details: err.message || 'Please ensure the backend server is running'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedDrugs([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PharmaGuard</h1>
                <p className="text-sm text-gray-600">Personalized Drug Safety Analysis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Powered by Pharmacogenomics</p>
              <p className="text-xs text-gray-500">CPIC Guidelines</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!result ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Upload VCF File for Analysis
              </h2>

              <div className="space-y-8">
                {/* File Upload Section */}
                <div>
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                </div>

                {/* Drug Selection Section */}
                <div>
                  <DrugInput
                    onDrugsChange={setSelectedDrugs}
                    selectedDrugs={selectedDrugs}
                  />
                </div>

                {/* Error Display */}
                <ErrorBanner error={error} onClose={() => setError(null)} />

                {/* Analyze Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || selectedDrugs.length === 0 || loading}
                    className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${!selectedFile || selectedDrugs.length === 0 || loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-blue-600 hover:shadow-lg'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </div>
                    ) : (
                      'Analyze Pharmacogenomics'
                    )}
                  </button>
                </div>

                {/* Info Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Upload your VCF file (max 5MB)</li>
                    <li>Select one or more drugs to analyze</li>
                    <li>Our system analyzes 6 key pharmacogenomic genes</li>
                    <li>Receive personalized drug safety recommendations</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result Display — result is now List[AnalysisResponse] */}
            <ResultDisplay results={result} />

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Analyze Another Sample
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600">
            © 2026 PharmaGuard | For research and educational purposes only |
            Always consult healthcare professionals for medical decisions
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
