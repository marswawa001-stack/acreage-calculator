import { useMemo, useState } from 'react';

export default function ShareModal({
  isOpen,
  onClose,
  calculatorTitle,
  shareUrl,
  generateShareUrl,
  generateShareText,
}) {
  const [copied, setCopied] = useState('');

  const fullUrl = useMemo(() => {
    try {
      return generateShareUrl ? generateShareUrl(true) : shareUrl;
    } catch {
      return shareUrl;
    }
  }, [generateShareUrl, shareUrl]);

  if (!isOpen) return null;

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-xl font-bold text-gray-800">Share {calculatorTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Share link</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={fullUrl || ''}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => copy(fullUrl || '', 'URL')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Share text</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={(generateShareText && generateShareText()) || ''}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => copy((generateShareText && generateShareText()) || '', 'Text')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          </div>

          {copied ? (
            <p className="text-sm text-green-700">Copied {copied}.</p>
          ) : (
            <p className="text-sm text-gray-500">Tip: the full link includes your current inputs.</p>
          )}
        </div>
      </div>
    </div>
  );
}
