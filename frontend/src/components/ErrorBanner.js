import React from 'react';

function ErrorBanner({ error, onClose }) {
  if (!error) return null;

  return (
    <div className="w-full" style={{ fontFamily: "'Oswald', sans-serif" }}>
      <div className="border border-black bg-black text-white px-6 py-5 flex items-start justify-between gap-5">
        <div className="flex items-start gap-4 flex-1">
          {/* Warning icon */}
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs tracking-widest uppercase font-semibold text-white opacity-50">
                Error
              </span>
              <span className="text-xs tracking-widest uppercase font-bold text-white border border-white border-opacity-30 px-2 py-0.5">
                {error.code || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-sm tracking-wide font-medium text-white leading-snug">
              {error.message || 'An unexpected error occurred.'}
            </p>
            {error.details && (
              <p className="text-xs tracking-wider font-light text-white opacity-50 mt-1.5 leading-relaxed">
                {error.details}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white opacity-40 hover:opacity-100 transition-opacity mt-0.5"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ErrorBanner;
