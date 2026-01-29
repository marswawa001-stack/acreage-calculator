export default function ShareAndClearButtons({
  onShare,
  onClear,
  canClear,
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-3 justify-center">
      <button
        type="button"
        onClick={onShare}
        className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
      >
        Share
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        className={`px-5 py-2.5 rounded-lg font-semibold border ${
          canClear
            ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
            : 'border-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Clear
      </button>
    </div>
  );
}
