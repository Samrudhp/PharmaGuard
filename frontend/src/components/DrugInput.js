import React, { useState } from 'react';

const SUPPORTED_DRUGS = [
  'codeine',
  'tramadol',
  'clopidogrel',
  'escitalopram',
  'warfarin',
  'phenytoin',
  'simvastatin',
  'atorvastatin',
  'azathioprine',
  'mercaptopurine',
  'fluorouracil',
  'capecitabine',
];

function DrugInput({ onDrugsChange, selectedDrugs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredDrugs = SUPPORTED_DRUGS.filter(
    (drug) =>
      drug.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedDrugs.includes(drug)
  );

  const handleAdd = (drug) => {
    onDrugsChange([...selectedDrugs, drug]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemove = (drug) => {
    onDrugsChange(selectedDrugs.filter((d) => d !== drug));
  };

  return (
    <div className="w-full" style={{ fontFamily: "'Oswald', sans-serif" }}>

      {/* Selected chips */}
      {selectedDrugs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedDrugs.map((drug) => (
            <span
              key={drug}
              className="inline-flex items-center gap-2 bg-black text-white text-xs tracking-widest uppercase font-semibold px-3 py-2"
            >
              {drug}
              <button
                onClick={() => handleRemove(drug)}
                className="opacity-50 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${drug}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input with icon */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-black opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={selectedDrugs.length === 0 ? 'Search medications...' : 'Add another medication...'}
          className="w-full pl-10 pr-4 py-3 border border-black bg-white text-black text-sm tracking-wider outline-none focus:bg-black focus:bg-opacity-5 transition-all"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        />

        {showDropdown && (searchTerm || filteredDrugs.length > 0) && (
          <div className="absolute z-10 w-full bg-white border border-black border-t-0 max-h-52 overflow-auto shadow-lg">
            {filteredDrugs.length > 0 ? (
              filteredDrugs.map((drug) => (
                <div
                  key={drug}
                  onMouseDown={() => handleAdd(drug)}
                  className="px-4 py-3 cursor-pointer text-sm tracking-wider text-black hover:bg-black hover:text-white transition-colors flex items-center justify-between group"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  <span className="capitalize">{drug}</span>
                  <span className="text-xs tracking-widest opacity-30 group-hover:opacity-60">+ ADD</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-xs tracking-widest uppercase text-black opacity-40">
                {SUPPORTED_DRUGS.every((d) => selectedDrugs.includes(d))
                  ? 'All medications selected'
                  : 'No matches'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status line */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs tracking-widest font-light text-black opacity-50">
          {selectedDrugs.length === 0
            ? `${SUPPORTED_DRUGS.length} supported medications`
            : `${selectedDrugs.length} of ${SUPPORTED_DRUGS.length} selected`}
        </p>
        {selectedDrugs.length > 0 && (
          <p className="text-xs tracking-widest font-light text-black opacity-50">
            Each analyzed independently
          </p>
        )}
      </div>
    </div>
  );
}

export default DrugInput;
