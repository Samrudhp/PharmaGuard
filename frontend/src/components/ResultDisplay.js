import React, { useState } from 'react';

function ResultDisplay({ results }) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // results is always an array of AnalysisResponse
  const result = results[activeTab];

  const getRiskColor = (riskLabel) => {
    switch (riskLabel) {
      case 'Safe': return 'bg-green-100 text-green-800 border-green-300';
      case 'Adjust Dosage': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Toxic': return 'bg-red-100 text-red-800 border-red-300';
      case 'Ineffective': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskDot = (riskLabel) => {
    switch (riskLabel) {
      case 'Safe': return 'bg-green-500';
      case 'Adjust Dosage': return 'bg-yellow-500';
      case 'Toxic': return 'bg-red-500';
      case 'Ineffective': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      none: 'bg-gray-200 text-gray-700',
      low: 'bg-blue-200 text-blue-800',
      moderate: 'bg-yellow-200 text-yellow-800',
      high: 'bg-orange-200 text-orange-800',
      critical: 'bg-red-200 text-red-800'
    };
    return colors[severity] || colors.none;
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmaguard_results_${result.patient_id}.json`;
    link.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    alert('Results copied to clipboard!');
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Drug Tab Bar — shown only when multiple drugs */}
      {results.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1 overflow-x-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { setActiveTab(i); setExpandedSection(null); setShowJson(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === i
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeTab === i ? 'bg-white' : getRiskDot(r.risk_assessment.risk_label)
                }`} />
              <span className="capitalize">{r.drug}</span>
            </button>
          ))}
        </div>
      )}

      {/* Risk Assessment Card */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor(result.risk_assessment.risk_label)}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Risk Assessment</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityBadge(result.risk_assessment.severity)}`}>
            {result.risk_assessment.severity.toUpperCase()}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Drug:</span>
            <span className="text-lg capitalize">{result.drug}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Risk Level:</span>
            <span className="text-lg font-bold">{result.risk_assessment.risk_label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Confidence:</span>
            <span className="text-lg">{(result.risk_assessment.confidence_score * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Clinical Recommendation */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Clinical Recommendation</h3>
        <div className="space-y-3">
          <div>
            <span className="font-semibold text-gray-700">Summary:</span>
            <p className="text-gray-600 mt-1">{result.clinical_recommendation.summary}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Dosing Guidance:</span>
            <p className="text-gray-600 mt-1">{result.clinical_recommendation.dosing_guidance}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Monitoring:</span>
            <p className="text-gray-600 mt-1">{result.clinical_recommendation.monitoring_requirements}</p>
          </div>
        </div>
      </div>

      {/* Pharmacogenomic Profile */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Pharmacogenomic Profile</h3>
        <div className="space-y-4">
          {result.pharmacogenomic_profile.map((gene, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(`gene-${activeTab}-${index}`)}
              >
                <div>
                  <h4 className="font-bold text-lg">{gene.gene}</h4>
                  <p className="text-sm text-gray-600">
                    Diplotype: {gene.diplotype} | Phenotype:{' '}
                    <span className="font-semibold">{gene.phenotype}</span>
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSection === `gene-${activeTab}-${index}` ? 'rotate-180' : ''
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>

              {expandedSection === `gene-${activeTab}-${index}` && (
                <div className="mt-4 pl-4 border-l-2 border-gray-300">
                  <p className="text-sm text-gray-600 mb-2">
                    Star Alleles: {gene.star_allele_1} / {gene.star_allele_2}
                  </p>
                  <p className="text-sm font-semibold mb-2">Detected Variants:</p>
                  {gene.detected_variants.length > 0 ? (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {gene.detected_variants.map((variant, vIndex) => (
                        <li key={vIndex}>
                          {variant.rsid}: {variant.ref} → {variant.alt} (GT: {variant.genotype})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No variants detected (reference allele)</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LLM Explanation */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
        <h3 className="text-xl font-bold mb-4 text-blue-900">Explanation</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Mechanism</h4>
            <p className="text-gray-700">{result.llm_generated_explanation.mechanism}</p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Clinical Context</h4>
            <p className="text-gray-700">{result.llm_generated_explanation.clinical_context}</p>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Patient-Friendly Summary</h4>
            <p className="text-gray-700">{result.llm_generated_explanation.patient_friendly_summary}</p>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Quality Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(result.quality_metrics).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={copyToClipboard}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Copy JSON
        </button>
        <button
          onClick={downloadJson}
          className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-semibold"
        >
          Download JSON
        </button>
      </div>

      {/* JSON View Toggle */}
      <button
        onClick={() => setShowJson(!showJson)}
        className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
      >
        {showJson ? 'Hide' : 'Show'} Raw JSON
      </button>

      {showJson && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}

      {/* Metadata */}
      <div className="text-center text-sm text-gray-500">
        <p>Patient ID: {result.patient_id}</p>
        <p>Analysis Time: {result.timestamp}</p>
      </div>
    </div>
  );
}

export default ResultDisplay;
