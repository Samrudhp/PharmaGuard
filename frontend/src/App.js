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
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Oswald', sans-serif" }}>

      {/* Top accent bar */}
      <div className="h-1 bg-black w-full" />

      {/* Header */}
      <header className="bg-white border-b border-black">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase text-black opacity-40 mb-1 font-light">
              Precision Medicine Platform
            </p>
            <h1 className="text-5xl font-bold tracking-widest uppercase text-black leading-none">
              PharmaGuard
            </h1>
          </div>
          <div className="flex items-end gap-10 pb-0.5">
            {['CYP2D6','CYP2C19','CYP2C9','SLCO1B1','TPMT','DPYD'].map(g => (
              <span key={g} className="text-xs tracking-widest uppercase text-black opacity-30 font-light hidden lg:block">{g}</span>
            ))}
            <div className="text-right border-l border-black pl-8 ml-2">
              <p className="text-xs tracking-widest uppercase font-semibold text-black">CPIC&nbsp;Guidelines</p>
              <p className="text-xs tracking-wider text-black font-light mt-0.5 opacity-60">VCF · Pharmacogenomics</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-8 py-14">
        {!result ? (
          <div>
            {/* Page Title */}
            <div className="mb-14 flex items-end justify-between border-b border-black pb-6">
              <div>
                <p className="text-xs tracking-widest uppercase text-black opacity-40 font-light mb-2">Step-by-step</p>
                <h2 className="text-6xl font-bold uppercase tracking-tight text-black leading-none">
                  Genomic&nbsp;Analysis
                </h2>
              </div>
              <p className="text-sm tracking-widest uppercase text-black font-light opacity-50 pb-1 hidden md:block">
                Upload · Select · Analyze
              </p>
            </div>

            {/* Two-column input grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-black mb-10">
              {/* Left — File */}
              <div className="p-8 border-b border-black lg:border-b-0 lg:border-r lg:border-black">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-black opacity-10 leading-none select-none">01</span>
                  <p className="text-sm tracking-widest uppercase font-semibold text-black">
                    Genomic&nbsp;File
                  </p>
                </div>
                <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
              </div>

              {/* Right — Drugs */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-5xl font-bold text-black opacity-10 leading-none select-none">02</span>
                  <p className="text-sm tracking-widest uppercase font-semibold text-black">
                    Target&nbsp;Medications
                  </p>
                </div>
                <DrugInput onDrugsChange={setSelectedDrugs} selectedDrugs={selectedDrugs} />
              </div>
            </div>

            {/* Error */}
            <ErrorBanner error={error} onClose={() => setError(null)} />

            {/* Analyze Button */}
            <div className="mb-14">
              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || selectedDrugs.length === 0 || loading}
                className={`w-full py-5 text-sm tracking-widest uppercase font-semibold transition-all border-2 relative overflow-hidden group ${
                  !selectedFile || selectedDrugs.length === 0 || loading
                    ? 'bg-white text-black border-black opacity-25 cursor-not-allowed'
                    : 'bg-black text-white border-black hover:bg-white hover:text-black'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-4">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Running Analysis — Please Wait
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    Run Pharmacogenomic Analysis
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                )}
              </button>
              {(!selectedFile || selectedDrugs.length === 0) && (
                <p className="text-center text-xs tracking-widest uppercase text-black opacity-30 mt-3 font-light">
                  {!selectedFile && selectedDrugs.length === 0
                    ? 'VCF file and medication required'
                    : !selectedFile
                    ? 'VCF file required'
                    : 'At least one medication required'}
                </p>
              )}
            </div>

            {/* How it works */}
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-8 border-t border-black pt-8">
                How It Works
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-l border-black">
                {[
                  ['01', 'Upload', 'VCF genomic file up to 5 MB'],
                  ['02', 'Select', 'Choose one or more target medications'],
                  ['03', 'Analyze', '6 pharmacogenomic genes assessed via CPIC'],
                  ['04', 'Review', 'Receive personalized risk and dosing guidance'],
                ].map(([num, title, desc]) => (
                  <div key={num} className="border-r border-b border-black p-6 relative">
                    <p className="text-5xl font-bold text-black opacity-8 leading-none mb-4 select-none" style={{ opacity: 0.07 }}>{num}</p>
                    <p className="text-base font-bold uppercase tracking-widest text-black mb-2">{title}</p>
                    <p className="text-xs font-light text-black opacity-60 leading-relaxed tracking-wide">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <ResultDisplay results={result} />
            <div className="flex items-center justify-between pt-6 border-t-2 border-black">
              <div>
                <p className="text-xs tracking-widest uppercase text-black opacity-40 font-light">Analysis complete</p>
                <p className="text-sm tracking-wider text-black font-light mt-0.5">{result.length} medication{result.length > 1 ? 's' : ''} analyzed</p>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-3 px-10 py-4 bg-white text-black border-2 border-black text-xs tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Analysis
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black mt-24">
        <div className="max-w-7xl mx-auto px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <p className="text-xs tracking-widest uppercase text-black font-semibold">
              PharmaGuard
            </p>
            <p className="text-xs text-black opacity-30 font-light">&copy; 2026</p>
          </div>
          <p className="text-xs tracking-wider text-black font-light opacity-50">
            Research and educational use only. Always consult a licensed healthcare professional.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
