import AcreageCalculatorContent from './calculator/AcreageCalculatorContent.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-1">Acreage Calculator</h1>
          <p className="text-gray-600 text-lg mb-2">Calculate land area and estimate property costs</p>
          <p className="text-gray-500 text-sm">
            Check the official online version: <a className="text-blue-600 hover:underline" href="https://www.calculatorvast.com/acreage-calculator" target="_blank" rel="noreferrer">https://www.calculatorvast.com/acreage-calculator</a>
          </p>
        </header>

        <AcreageCalculatorContent />
      </div>
    </div>
  );
}
