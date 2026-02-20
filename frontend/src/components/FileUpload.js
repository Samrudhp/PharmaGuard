import React, { useState } from 'react';

function FileUpload({ onFileSelect, selectedFile }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const maxSizeBytes = 5 * 1024 * 1024;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const validateFile = (file) => {
    setFileError('');
    if (!file.name.endsWith('.vcf')) {
      setFileError('Invalid file type. Only .vcf files are accepted.');
      return false;
    }
    if (file.size > maxSizeBytes) {
      setFileError(`File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum is 5 MB.`);
      return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) onFileSelect(file);
    }
  };

  return (
    <div className="w-full" style={{ fontFamily: "'Oswald', sans-serif" }}>
      <form onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
        <input type="file" id="file-upload" accept=".vcf" onChange={handleChange} className="hidden" />
        <label
          htmlFor="file-upload"
          className={`relative flex flex-col items-center justify-center w-full h-48 cursor-pointer transition-all ${
            dragActive ? 'bg-black bg-opacity-5' : 'bg-white hover:bg-black hover:bg-opacity-3'
          }`}
          style={{ border: '1.5px dashed #111' }}
        >
          {/* Corner accents */}
          {['-top-px -left-px','−top-px -right-px','−bottom-px -left-px','-bottom-px -right-px'].map((pos, i) => (
            <span key={i} className={`absolute w-3 h-3 border-black ${
              i===0 ? 'top-0 left-0 border-t-2 border-l-2' :
              i===1 ? 'top-0 right-0 border-t-2 border-r-2' :
              i===2 ? 'bottom-0 left-0 border-b-2 border-l-2' :
                      'bottom-0 right-0 border-b-2 border-r-2'
            }`} />
          ))}
          <svg className="w-9 h-9 text-black mb-3" style={{ opacity: dragActive ? 1 : 0.35 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs tracking-widest uppercase font-semibold text-black" style={{ opacity: dragActive ? 1 : 0.6 }}>
            {dragActive ? 'Release to Upload' : 'Drop VCF File or Click to Browse'}
          </p>
          <p className="text-xs tracking-wider text-black font-light mt-1.5" style={{ opacity: 0.35 }}>
            VCF v4.2&nbsp;&nbsp;/&nbsp;&nbsp;Max 5 MB
          </p>
        </label>
      </form>

      {selectedFile && !fileError && (
        <div className="mt-3 bg-black text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-4 h-4 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs tracking-widest uppercase font-semibold">{selectedFile.name}</p>
              <p className="text-xs font-light mt-0.5 opacity-50 tracking-wider">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button onClick={() => onFileSelect(null)} className="opacity-40 hover:opacity-100 transition-opacity" aria-label="Remove">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {fileError && (
        <div className="mt-3 border-l-4 border-black bg-black bg-opacity-5 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs tracking-wider uppercase font-semibold text-black">{fileError}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
