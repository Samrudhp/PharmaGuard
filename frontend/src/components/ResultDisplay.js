import React, { useState } from 'react';

const FONT = { fontFamily: "'Oswald', sans-serif" };

function ResultDisplay({ results }) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedGene, setExpandedGene] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const result = results[activeTab];

  const riskStyles = {
    Safe:           { border: '#16a34a', label: 'SAFE' },
    'Adjust Dosage':{ border: '#b45309', label: 'ADJUST DOSAGE' },
    Toxic:          { border: '#dc2626', label: 'TOXIC' },
    Ineffective:    { border: '#6b7280', label: 'INEFFECTIVE' },
    Unknown:        { border: '#9ca3af', label: 'UNKNOWN' },
  };

  const severityColors = {
    none:     '#9ca3af',
    low:      '#3b82f6',
    moderate: '#b45309',
    high:     '#ea580c',
    critical: '#dc2626',
  };

  const risk = riskStyles[result.risk_assessment.risk_label] || riskStyles.Unknown;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmaguard_${result.patient_id}.json`;
    a.click();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
  };

  return (
    <div style={FONT} className="w-full space-y-0">

      {/* Drug tab bar */}
      {results.length > 1 && (
        <div className="flex border-b-2 border-black overflow-x-auto mb-10">
          {results.map((r, i) => {
            const rStyle = riskStyles[r.risk_assessment.risk_label] || riskStyles.Unknown;
            return (
              <button
                key={i}
                onClick={() => { setActiveTab(i); setExpandedGene(null); setShowJson(false); }}
                className={`relative px-8 py-4 text-xs tracking-widest uppercase font-semibold border-r border-black whitespace-nowrap transition-colors ${
                  activeTab === i ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:bg-opacity-5'
                }`}
              >
                {r.drug}
                {activeTab === i && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: rStyle.border }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}  

      {/* Results Title */}
      <div className="border-b-2 border-black pb-6 mb-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-black opacity-40 font-light mb-2">Pharmacogenomic Report</p>
            <h2 className="text-6xl font-bold uppercase tracking-tight text-black leading-none">
              Analysis Results
            </h2>
          </div>
          <div className="text-right pb-1">
            <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-1">Patient ID</p>
            <p className="text-sm font-mono tracking-wider text-black">{result.patient_id}</p>
            <p className="text-xs font-light text-black opacity-40 tracking-wider mt-0.5">{result.timestamp}</p>
          </div>
        </div>
      </div>

      {/* Risk Assessment — Hero Card */}
      <div className="mb-10 border border-black" style={{ borderLeftWidth: '4px', borderLeftColor: risk.border }}>
        {/* Top row */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between gap-8 flex-wrap border-b border-black">
          <div>
            <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-2">Medication</p>
            <p className="text-4xl font-bold uppercase tracking-wide text-black capitalize mb-6 leading-none">
              {result.drug}
            </p>
            <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-2">Risk Assessment</p>
            <p className="text-7xl font-bold uppercase tracking-tight leading-none" style={{ color: risk.border }}>
              {risk.label}
            </p>
          </div>
          <div className="flex flex-col gap-5 text-right min-w-32">
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-1">Severity</p>
              <p className="text-3xl font-bold uppercase tracking-widest leading-none"
                style={{ color: severityColors[result.risk_assessment.severity] || '#111' }}>
                {result.risk_assessment.severity}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-1">Confidence</p>
              <p className="text-3xl font-bold text-black leading-none">
                {(result.risk_assessment.confidence_score * 100).toFixed(0)}<span className="text-lg opacity-50">%</span>
              </p>
            </div>
          </div>
        </div>
        {/* Confidence bar */}
        <div className="px-8 py-4 flex items-center gap-4">
          <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 whitespace-nowrap">Confidence Score</p>
          <div className="flex-1 h-1 bg-black bg-opacity-10 relative">
            <div
              className="absolute top-0 left-0 h-full transition-all"
              style={{ width: `${(result.risk_assessment.confidence_score * 100).toFixed(0)}%`, backgroundColor: risk.border }}
            />
          </div>
          <p className="text-xs tracking-widest font-semibold text-black opacity-60 w-10 text-right">
            {(result.risk_assessment.confidence_score * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Two-column layout: Recommendation + Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-black mb-10">
        {/* Clinical Recommendation */}
        <div className="p-8 border-b border-black md:border-b-0 md:border-r md:border-black">
          <div className="flex items-center gap-3 border-b border-black pb-4 mb-6">
            <span className="text-3xl font-bold text-black opacity-8 leading-none select-none" style={{ opacity: 0.08 }}>A</span>
            <p className="text-xs tracking-widest uppercase font-semibold text-black">
              Clinical Recommendation
            </p>
          </div>
          <div className="space-y-5">
            {[
              ['Summary', result.clinical_recommendation.summary],
              ['Dosing Guidance', result.clinical_recommendation.dosing_guidance],
              ['Monitoring', result.clinical_recommendation.monitoring_requirements],
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-black border-opacity-10 pl-4">
                <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-1.5">{label}</p>
                <p className="text-sm font-light text-black leading-relaxed tracking-wide">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LLM Explanation */}
        <div className="p-8">
          <div className="flex items-center gap-3 border-b border-black pb-4 mb-6">
            <span className="text-3xl font-bold text-black leading-none select-none" style={{ opacity: 0.08 }}>B</span>
            <p className="text-xs tracking-widest uppercase font-semibold text-black">
              AI-Generated Explanation
            </p>
          </div>
          <div className="space-y-5">
            {[
              ['Mechanism', result.llm_generated_explanation.mechanism],
              ['Clinical Context', result.llm_generated_explanation.clinical_context],
              ['Patient Summary', result.llm_generated_explanation.patient_friendly_summary],
            ].map(([label, value]) => (
              <div key={label} className="border-l-2 border-black border-opacity-10 pl-4">
                <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-1.5">{label}</p>
                <p className="text-sm font-light text-black leading-relaxed tracking-wide">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pharmacogenomic Profile */}
      <div className="border border-black mb-8">
        <div className="border-b border-black px-6 py-4">
          <p className="text-xs tracking-widest uppercase font-semibold text-black">
            Pharmacogenomic Profile
          </p>
        </div>

        {result.pharmacogenomic_profile.map((gene, index) => (
          <div key={index} className="border-b border-black last:border-b-0">
            <div
              className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-black hover:bg-opacity-5 transition-colors"
              onClick={() => setExpandedGene(expandedGene === `${activeTab}-${index}` ? null : `${activeTab}-${index}`)}
            >
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-lg font-bold uppercase tracking-wider text-black">{gene.gene}</p>
                  <p className="text-xs tracking-wider font-light text-black opacity-60">
                    {gene.diplotype}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-40 mb-0.5">Phenotype</p>
                  <p className="text-sm font-semibold tracking-wider text-black">{gene.phenotype}</p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-black transition-transform ${expandedGene === `${activeTab}-${index}` ? 'rotate-180' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd" />
              </svg>
            </div>

            {expandedGene === `${activeTab}-${index}` && (
              <div className="px-6 pb-5 bg-black bg-opacity-5">
                <div className="flex gap-8 pt-4 mb-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-50 mb-0.5">Allele 1</p>
                    <p className="text-sm font-semibold text-black">{gene.star_allele_1}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-50 mb-0.5">Allele 2</p>
                    <p className="text-sm font-semibold text-black">{gene.star_allele_2}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-50 mb-0.5">Phenotype</p>
                    <p className="text-sm font-semibold text-black">{gene.phenotype}</p>
                  </div>
                </div>
                <p className="text-xs tracking-widest uppercase font-semibold text-black opacity-50 mb-2">Detected Variants</p>
                {gene.detected_variants.length > 0 ? (
                  <div className="space-y-1">
                    {gene.detected_variants.map((v, vi) => (
                      <p key={vi} className="text-xs font-light text-black tracking-wider font-mono">
                        {v.rsid} &nbsp; {v.ref} &rarr; {v.alt} &nbsp; GT: {v.genotype}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs tracking-wider font-light text-black opacity-40">
                    No variants detected — reference allele
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quality Metrics */}
      <div className="border border-black mb-10">
        <div className="border-b border-black px-6 py-4 flex items-center justify-between">
          <p className="text-xs tracking-widest uppercase font-semibold text-black">Quality Metrics</p>
          <p className="text-xs tracking-wider text-black opacity-30 font-light">
            {Object.values(result.quality_metrics).filter(Boolean).length} / {Object.values(result.quality_metrics).length} passed
          </p>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
          {Object.entries(result.quality_metrics).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${value ? 'text-black' : 'text-black opacity-20'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                {value ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
              <span className={`text-xs tracking-wider ${
                value ? 'text-black font-medium' : 'text-black opacity-30 font-light'
              }`}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t-2 border-black pt-6">
        <div className="flex gap-3 mb-4">
          <button
            onClick={copyToClipboard}
            className="flex items-center justify-center gap-2 flex-1 py-4 border border-black text-xs tracking-widest uppercase font-semibold text-black hover:bg-black hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy JSON
          </button>
          <button
            onClick={downloadJson}
            className="flex items-center justify-center gap-2 flex-1 py-4 bg-black text-white text-xs tracking-widest uppercase font-semibold hover:bg-white hover:text-black border-2 border-black transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download JSON
          </button>
        </div>

        {/* Raw JSON toggle */}
        <button
          onClick={() => setShowJson(!showJson)}
          className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold text-black opacity-30 hover:opacity-70 transition-opacity"
        >
          <svg className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {showJson ? 'Hide Raw JSON' : 'Show Raw JSON'}
        </button>
        {showJson && (
          <div className="mt-3 border border-black bg-black overflow-auto max-h-96">
            <pre className="p-5 text-xs text-green-400 font-mono leading-relaxed">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultDisplay;
