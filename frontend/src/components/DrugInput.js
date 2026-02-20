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
  'capecitabine'
];

function DrugInput({ onDrugsChange, selectedDrugs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Drugs not yet selected, matching search term
  const filteredDrugs = SUPPORTED_DRUGS.filter(
    drug =>
      drug.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedDrugs.includes(drug)
  );

  const handleAdd = (drug) => {
    onDrugsChange([...selectedDrugs, drug]);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleRemove = (drug) => {
    onDrugsChange(selectedDrugs.filter(d => d !== drug));
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Drug(s) for Analysis
        <span className="ml-2 text-xs text-gray-400 font-normal">
          (select one or more)
        </span>
      </label>

      {/* Selected drug chips */}
      {selectedDrugs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedDrugs.map(drug => (
            <span
              key={drug}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white"
            >
              <span className="capitalize">{drug}</span>
              <button
                onClick={() => handleRemove(drug)}
                className="ml-2 hover:text-gray-200 focus:outline-none"
                aria-label={`Remove ${drug}`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={
            selectedDrugs.length === 0
              ? 'Search for a drug...'
              : 'Add another drug...'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        {showDropdown && (searchTerm || filteredDrugs.length > 0) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-52 overflow-auto">
            {filteredDrugs.length > 0 ? (
              filteredDrugs.map(drug => (
                <div
                  key={drug}
                  onMouseDown={() => handleAdd(drug)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer capitalize flex items-center justify-between"
                >
                  <span>{drug}</span>
                  <span className="text-xs text-gray-400 ml-2">+ Add</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-400 text-sm">
                {SUPPORTED_DRUGS.every(d => selectedDrugs.includes(d))
                  ? 'All drugs selected'
                  : 'No matching drugs'}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {selectedDrugs.length === 0
          ? `${SUPPORTED_DRUGS.length} supported medications`
          : `${selectedDrugs.length} drug${selectedDrugs.length > 1 ? 's' : ''} selected — analysis will run for each`}
      </p>
    </div>
  );
}

export default DrugInput;
