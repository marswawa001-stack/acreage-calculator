import { useEffect, useRef, useState } from 'react';

import ShareModal from '../components/ShareModal.jsx';
import ShareAndClearButtons from '../components/ShareAndClearButtons.jsx';
import { getExchangeRate } from '../lib/exchangeRate.js';
import { useCurrencySystem } from '../hooks/useCurrencySystem.js';
import {
  formatWithThousandsSeparators,
  normalizeNumericInput,
} from '../lib/numberDisplay.js';

export default function AcreageCalculatorContent() {
  // Width inputs - displayed values (converted)
  const [widthValue, setWidthValue] = useState('');
  const [widthUnit, setWidthUnit] = useState('ft');
  const [widthValueDisplay, setWidthValueDisplay] = useState('');
  const [widthValueFocused, setWidthValueFocused] = useState(false);

  // Length inputs - displayed values (converted)
  const [lengthValue, setLengthValue] = useState('');
  const [lengthUnit, setLengthUnit] = useState('ft');
  const [lengthValueDisplay, setLengthValueDisplay] = useState('');
  const [lengthValueFocused, setLengthValueFocused] = useState(false);

  // Original/base values for Width and Length (to avoid cumulative conversion errors)
  const baseWidthValue = useRef('');
  const baseWidthUnit = useRef('ft');
  const baseLengthValue = useRef('');
  const baseLengthUnit = useRef('ft');

  // Area result
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState('acre');

  // Price inputs - displayed values (converted)
  const [unitPriceDisplay, setUnitPriceDisplay] = useState('');
  const [unitPriceFocused, setUnitPriceFocused] = useState(false);
  const [unitPriceAreaUnit, setUnitPriceAreaUnit] = useState('acre');

  // Area unit when user input
  const baseUnitPriceAreaUnit = useRef('acre');

  // Total price with independent currency
  const [totalPrice, setTotalPrice] = useState('');

  // UI state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Length unit conversions to meters
  const lengthToMeters = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    inch: 0.0254,
    ft: 0.3048,
    yd: 0.9144,
    mi: 1609.344,
    nmi: 1852,
  };

  // Area unit conversions to square meters
  const areaToSqMeters = {
    mm2: 0.000001,
    cm2: 0.0001,
    dm2: 0.01,
    m2: 1,
    km2: 1000000,
    in2: 0.00064516,
    ft2: 0.092903,
    yd2: 0.836127,
    mi2: 2589988.11,
    are: 100,
    decare: 1000,
    hectare: 10000,
    acre: 4046.8564224,
    soccer_fields: 7140, // approximately 1.76 acres
  };

  const conversionFactor =
    baseUnitPriceAreaUnit.current && unitPriceAreaUnit
      ? areaToSqMeters[unitPriceAreaUnit] / areaToSqMeters[baseUnitPriceAreaUnit.current]
      : 1;

  const {
    price: unitPrice,
    setPrice: setUnitPriceHook,
    setDisplayPrice: setDisplayUnitPrice,
    priceCurrency: unitPriceCurrency,
    setPriceCurrency: setUnitPriceCurrency,
    resultCurrency: totalPriceCurrency,
    setResultCurrency: setTotalPriceCurrency,
    exchangeRate,
    rateInfo,
    isResultLoading,
    basePriceRef: baseUnitPrice,
    basePriceCurrencyRef: baseUnitPriceCurrency,
    isEquivalentConversionRef: isEquivalentConversion,
    currencies,
    reset: resetCurrencySystem,
    initialize: initializeCurrencySystem,
  } = useCurrencySystem({}, { conversionFactor });

  useEffect(() => {
    setWidthValueDisplay(formatWithThousandsSeparators(widthValue));
  }, [widthValue]);

  useEffect(() => {
    setLengthValueDisplay(formatWithThousandsSeparators(lengthValue));
  }, [lengthValue]);

  useEffect(() => {
    setUnitPriceDisplay(formatWithThousandsSeparators(unitPrice));
  }, [unitPrice]);

  // Load from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('data');

    if (shareData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(shareData));
        const loadedWidth = String(parsed.widthValue || '');
        const loadedWidthUnit = parsed.widthUnit || 'ft';
        const loadedLength = String(parsed.lengthValue || '');
        const loadedLengthUnit = parsed.lengthUnit || 'ft';
        setWidthValue(loadedWidth);
        setWidthUnit(loadedWidthUnit);
        setLengthValue(loadedLength);
        setLengthUnit(loadedLengthUnit);
        setAreaUnit(parsed.areaUnit || 'acre');

        baseWidthValue.current = loadedWidth;
        baseWidthUnit.current = loadedWidthUnit;
        baseLengthValue.current = loadedLength;
        baseLengthUnit.current = loadedLengthUnit;

        const loadedUnitPrice = String(parsed.unitPrice || '');
        const loadedAreaUnit = parsed.unitPriceAreaUnit || 'acre';
        const loadedCurrency = parsed.unitPriceCurrency || 'USD';

        setUnitPriceAreaUnit(loadedAreaUnit);
        baseUnitPriceAreaUnit.current = loadedAreaUnit;

        initializeCurrencySystem({
          price: loadedUnitPrice,
          priceCurrency: loadedCurrency,
          resultCurrency: parsed.totalPriceCurrency || 'USD',
        });
      } catch {
        // ignore
      }
    }
  }, [initializeCurrencySystem]);

  const calculateArea = () => {
    const width = parseFloat(widthValue);
    const length = parseFloat(lengthValue);

    if (isNaN(width) || isNaN(length) || width <= 0 || length <= 0) {
      setAreaValue('');
      return null;
    }

    const widthMeters = width * lengthToMeters[widthUnit];
    const lengthMeters = length * lengthToMeters[lengthUnit];
    const areaSqMeters = widthMeters * lengthMeters;
    const areaInUnit = areaSqMeters / areaToSqMeters[areaUnit];

    return areaInUnit;
  };

  const formatResult = (value) => {
    if (value === 0) return '0';
    const absVal = Math.abs(value);

    if (absVal < 0.0000001) return value.toExponential(4);
    if (absVal < 0.001) return parseFloat(value.toFixed(10)).toString();
    if (absVal < 1) return parseFloat(value.toFixed(6)).toString();

    return parseFloat(value.toFixed(4)).toString();
  };

  const formatCurrency = (value) => {
    if (value === 0) return '0.00';
    const absVal = Math.abs(value);

    if (absVal < 0.01) {
      if (absVal < 0.000001) return value.toExponential(4);
      return parseFloat(value.toFixed(10)).toString();
    }

    return value.toFixed(2);
  };

  useEffect(() => {
    const area = calculateArea();
    if (area !== null) {
      setAreaValue(formatResult(area));
    }
  }, [widthValue, widthUnit, lengthValue, lengthUnit, areaUnit]);

  useEffect(() => {
    let isMounted = true;

    if (isEquivalentConversion.current) {
      isEquivalentConversion.current = false;
      return;
    }

    const calculatePrices = async () => {
      const area = calculateArea();
      if (area === null || area <= 0 || !unitPrice) return;

      const widthMeters = parseFloat(widthValue) * lengthToMeters[widthUnit];
      const lengthMeters = parseFloat(lengthValue) * lengthToMeters[lengthUnit];
      const areaSqMeters = widthMeters * lengthMeters;
      const areaInPriceUnit = areaSqMeters / areaToSqMeters[unitPriceAreaUnit];

      const isBaseUnitMatch =
        baseUnitPriceCurrency.current === unitPriceCurrency &&
        baseUnitPriceAreaUnit.current === unitPriceAreaUnit;
      const priceToUse = isBaseUnitMatch && baseUnitPrice.current ? baseUnitPrice.current : unitPrice;

      const unitPriceNum = parseFloat(priceToUse);
      if (isNaN(unitPriceNum)) return;

      let total = unitPriceNum * areaInPriceUnit;

      if (unitPriceCurrency !== totalPriceCurrency) {
        if (exchangeRate) {
          total = total * exchangeRate;
        } else {
          try {
            const result = await getExchangeRate(unitPriceCurrency, totalPriceCurrency);
            if (isMounted) total = total * result.rate;
          } catch {
            // ignore
          }
        }
      }

      if (isMounted) setTotalPrice(formatCurrency(total));
    };

    calculatePrices();

    return () => {
      isMounted = false;
    };
  }, [
    widthValue,
    widthUnit,
    lengthValue,
    lengthUnit,
    unitPrice,
    unitPriceAreaUnit,
    unitPriceCurrency,
    totalPriceCurrency,
    exchangeRate,
    isEquivalentConversion,
    baseUnitPrice,
    baseUnitPriceCurrency,
  ]);

  const handleUnitPriceChange = (value) => {
    setUnitPriceHook(value);
    baseUnitPriceAreaUnit.current = unitPriceAreaUnit;
  };

  const handleUnitPriceAreaUnitChange = async (newUnit) => {
    if (newUnit === unitPriceAreaUnit) return;

    if (baseUnitPrice.current && !isNaN(parseFloat(baseUnitPrice.current))) {
      const baseAreaSizeInSqm = areaToSqMeters[baseUnitPriceAreaUnit.current];
      const newAreaSizeInSqm = areaToSqMeters[newUnit];
      const areaConversionFactor = newAreaSizeInSqm / baseAreaSizeInSqm;

      let currencyRate = 1;
      if (baseUnitPriceCurrency.current !== unitPriceCurrency) {
        try {
          const result = await getExchangeRate(baseUnitPriceCurrency.current, unitPriceCurrency);
          currencyRate = result.rate;
        } catch {
          // ignore
        }
      }

      const converted = parseFloat(baseUnitPrice.current) * areaConversionFactor * currencyRate;
      isEquivalentConversion.current = true;
      setDisplayUnitPrice(formatCurrency(converted));
    }
    setUnitPriceAreaUnit(newUnit);
  };

  const handleWidthUnitChange = (newUnit) => {
    if (newUnit === widthUnit) return;
    if (baseWidthValue.current && !isNaN(parseFloat(baseWidthValue.current))) {
      const meters = parseFloat(baseWidthValue.current) * lengthToMeters[baseWidthUnit.current];
      const converted = (meters / lengthToMeters[newUnit]).toFixed(6);
      setWidthValue(converted);
    }
    setWidthUnit(newUnit);
  };

  const handleLengthUnitChange = (newUnit) => {
    if (newUnit === lengthUnit) return;
    if (baseLengthValue.current && !isNaN(parseFloat(baseLengthValue.current))) {
      const meters = parseFloat(baseLengthValue.current) * lengthToMeters[baseLengthUnit.current];
      const converted = (meters / lengthToMeters[newUnit]).toFixed(6);
      setLengthValue(converted);
    }
    setLengthUnit(newUnit);
  };

  const handleAreaUnitChange = (newUnit) => {
    if (newUnit === areaUnit) return;
    setAreaUnit(newUnit);
  };

  const handleClear = () => {
    setWidthValue('');
    setWidthUnit('ft');
    setLengthValue('');
    setLengthUnit('ft');
    setAreaValue('');
    setAreaUnit('acre');

    setUnitPriceAreaUnit('acre');
    setTotalPrice('');

    resetCurrencySystem();

    baseWidthValue.current = '';
    baseWidthUnit.current = 'ft';
    baseLengthValue.current = '';
    baseLengthUnit.current = 'ft';

    baseUnitPriceAreaUnit.current = 'acre';
  };

  const generateShareUrl = (withParams = true) => {
    const baseUrl = `${window.location.origin}`;
    const url = new URL(baseUrl);
    url.pathname = '/';

    if (!withParams) return url.toString();

    const data = {
      widthValue: widthValue ? parseFloat(widthValue) : '',
      widthUnit,
      lengthValue: lengthValue ? parseFloat(lengthValue) : '',
      lengthUnit,
      areaUnit,
      unitPrice: unitPrice ? parseFloat(unitPrice) : '',
      unitPriceAreaUnit,
      unitPriceCurrency,
      totalPriceCurrency,
    };

    url.searchParams.set('data', encodeURIComponent(JSON.stringify(data)));
    return url.toString();
  };

  const generateShareText = () => {
    if (areaValue) {
      return `Acreage Calculator: ${areaValue} ${getAreaUnitLabel(areaUnit)} (${widthValue} ${widthUnit} × ${lengthValue} ${lengthUnit})`;
    }
    return 'Acreage Calculator - Calculate land area and property costs';
  };

  const getAreaUnitLabel = (unit) => {
    const labels = {
      mm2: 'mm²',
      cm2: 'cm²',
      dm2: 'dm²',
      m2: 'm²',
      km2: 'km²',
      in2: 'in²',
      ft2: 'ft²',
      yd2: 'yd²',
      mi2: 'mi²',
      are: 'a',
      decare: 'da',
      hectare: 'ha',
      acre: 'ac',
      soccer_fields: 'sf',
    };
    return labels[unit] || unit;
  };

  const getLengthUnitLabel = (unit) => {
    const labels = {
      mm: 'mm',
      cm: 'cm',
      m: 'm',
      km: 'km',
      inch: 'in',
      ft: 'ft',
      yd: 'yd',
      mi: 'mi',
      nmi: 'nmi',
    };
    return labels[unit] || unit;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Width</label>
          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-purple-500">
            <input
              type="text"
              inputMode="decimal"
              value={widthValueFocused ? widthValue : widthValueDisplay}
              onChange={(e) => {
                const val = normalizeNumericInput(e.target.value);
                setWidthValue(val);
                baseWidthValue.current = val;
                baseWidthUnit.current = widthUnit;
              }}
              onFocus={() => setWidthValueFocused(true)}
              onBlur={() => setWidthValueFocused(false)}
              className="flex-1 px-2 py-2 md:px-4 md:py-3 border-none focus:ring-0 text-gray-900 bg-transparent outline-none min-w-0 font-mono font-medium"
              step="any"
            />
            <div className="relative h-full flex items-center pr-2 md:pr-3">
              <span className="text-blue-500 font-medium pointer-events-none text-sm">
                {getLengthUnitLabel(widthUnit)}
              </span>
              <div className="pl-1 pointer-events-none flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
              <select
                value={widthUnit}
                onChange={(e) => handleWidthUnitChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="mm">millimeters (mm)</option>
                <option value="cm">centimeters (cm)</option>
                <option value="m">meters (m)</option>
                <option value="km">kilometers (km)</option>
                <option value="inch">inches (in)</option>
                <option value="ft">feet (ft)</option>
                <option value="yd">yards (yd)</option>
                <option value="mi">miles (mi)</option>
                <option value="nmi">nautical miles (nmi)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Length</label>
          <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-purple-500">
            <input
              type="text"
              inputMode="decimal"
              value={lengthValueFocused ? lengthValue : lengthValueDisplay}
              onChange={(e) => {
                const val = normalizeNumericInput(e.target.value);
                setLengthValue(val);
                baseLengthValue.current = val;
                baseLengthUnit.current = lengthUnit;
              }}
              onFocus={() => setLengthValueFocused(true)}
              onBlur={() => setLengthValueFocused(false)}
              className="flex-1 px-2 py-2 md:px-4 md:py-3 border-none focus:ring-0 text-gray-900 bg-transparent outline-none min-w-0 font-mono font-medium"
              step="any"
            />
            <div className="relative h-full flex items-center pr-2 md:pr-3">
              <span className="text-blue-500 font-medium pointer-events-none text-sm">
                {getLengthUnitLabel(lengthUnit)}
              </span>
              <div className="pl-1 pointer-events-none flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
              <select
                value={lengthUnit}
                onChange={(e) => handleLengthUnitChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="mm">millimeters (mm)</option>
                <option value="cm">centimeters (cm)</option>
                <option value="m">meters (m)</option>
                <option value="km">kilometers (km)</option>
                <option value="inch">inches (in)</option>
                <option value="ft">feet (ft)</option>
                <option value="yd">yards (yd)</option>
                <option value="mi">miles (mi)</option>
                <option value="nmi">nautical miles (nmi)</option>
              </select>
            </div>
          </div>
        </div>

        {areaValue && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">Area</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-4xl font-bold text-purple-600">{areaValue}</p>
                <div className="relative">
                  <div className="bg-purple-100 border border-purple-300 rounded px-2 py-1 pr-6 text-sm text-purple-700">
                    {getAreaUnitLabel(areaUnit)}
                  </div>
                  <select
                    value={areaUnit}
                    onChange={(e) => handleAreaUnitChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="mm2">square millimeters (mm²)</option>
                    <option value="cm2">square centimeters (cm²)</option>
                    <option value="dm2">square decimeters (dm²)</option>
                    <option value="m2">square meters (m²)</option>
                    <option value="km2">square kilometers (km²)</option>
                    <option value="in2">square inches (in²)</option>
                    <option value="ft2">square feet (ft²)</option>
                    <option value="yd2">square yards (yd²)</option>
                    <option value="mi2">square miles (mi²)</option>
                    <option value="are">ares (a)</option>
                    <option value="decare">decares (da)</option>
                    <option value="hectare">hectares (ha)</option>
                    <option value="acre">acres (ac)</option>
                    <option value="soccer_fields">soccer fields (sf)</option>
                  </select>
                  <svg
                    className="w-3 h-3 text-purple-600 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                {widthValue} {getLengthUnitLabel(widthUnit)} × {lengthValue} {getLengthUnitLabel(lengthUnit)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t-2 border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Unit and Total Price</h2>
        <p className="text-gray-500 text-sm mb-6">
          Input the unit price per acre to calculate the total property cost automatically.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Price</label>
            <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-purple-500">
              <input
                type="text"
                inputMode="decimal"
                value={unitPriceFocused ? unitPrice : unitPriceDisplay}
                onChange={(e) => handleUnitPriceChange(normalizeNumericInput(e.target.value))}
                onFocus={() => setUnitPriceFocused(true)}
                onBlur={() => setUnitPriceFocused(false)}
                className="flex-1 px-2 py-2 md:px-4 md:py-3 border-none focus:ring-0 text-gray-900 bg-transparent outline-none min-w-0 font-mono font-medium"
                step="0.01"
              />

              <div className="relative h-full flex items-center">
                <div className="px-1 pointer-events-none flex items-center justify-center">
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <select
                  value={unitPriceCurrency}
                  onChange={(e) => setUnitPriceCurrency(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {currencies.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="text-blue-500 font-medium pointer-events-none text-xs md:text-sm pr-1">
                  {unitPriceCurrency}
                </span>
              </div>

              <span className="text-gray-600 text-xs md:text-sm px-1">/</span>
              <div className="relative h-full flex items-center pr-2 md:pr-3">
                <span className="text-blue-500 font-medium pointer-events-none text-xs md:text-sm">
                  {getAreaUnitLabel(unitPriceAreaUnit)}
                </span>
                <div className="pl-1 pointer-events-none flex items-center justify-center">
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                <select
                  value={unitPriceAreaUnit}
                  onChange={(e) => handleUnitPriceAreaUnitChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="mm2">square millimeter (mm²)</option>
                  <option value="cm2">square centimeter (cm²)</option>
                  <option value="dm2">square decimeter (dm²)</option>
                  <option value="m2">square meter (m²)</option>
                  <option value="km2">square kilometer (km²)</option>
                  <option value="in2">square inch (in²)</option>
                  <option value="ft2">square foot (ft²)</option>
                  <option value="yd2">square yard (yd²)</option>
                  <option value="mi2">square mile (mi²)</option>
                  <option value="hectare">hectare (ha)</option>
                  <option value="acre">acre (ac)</option>
                </select>
              </div>
            </div>
          </div>

          {totalPrice && areaValue && (
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Unit Price</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-semibold text-gray-700">{totalPriceCurrency}</span>
                    {isResultLoading ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin ml-2"></div>
                    ) : (
                      <span className="text-2xl font-semibold text-gray-700">
                        {unitPriceCurrency === totalPriceCurrency
                          ? unitPrice
                          : (parseFloat(unitPrice) * (exchangeRate || 1)).toFixed(4)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs mt-1">/ {getAreaUnitLabel(unitPriceAreaUnit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-1">Total Price</p>
                  <div className="flex items-center justify-center gap-2">
                    {isResultLoading ? (
                      <div className="w-6 h-6 border-3 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <p className="text-3xl font-bold text-green-600">{totalPrice}</p>
                    )}
                    <div className="relative">
                      <div className="bg-green-100 border border-green-300 rounded px-2 py-1 pr-6 text-sm text-green-700">
                        {totalPriceCurrency}
                      </div>
                      <select
                        value={totalPriceCurrency}
                        onChange={(e) => setTotalPriceCurrency(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="w-3 h-3 text-green-600 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {unitPriceCurrency !== totalPriceCurrency && exchangeRate && exchangeRate !== 1 && (
                <div className="mt-4 pt-4 border-t border-green-200 text-center">
                  <div className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    <span>1 {unitPriceCurrency} =</span>
                    <span>{exchangeRate.toFixed(4)}</span>
                    <span>{totalPriceCurrency}</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Rates provider: {rateInfo?.provider || 'mock'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ShareAndClearButtons
        onShare={() => setIsShareModalOpen(true)}
        onClear={handleClear}
        canClear={!!widthValue || !!lengthValue || !!unitPrice || !!totalPrice}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        calculatorTitle="Acreage Calculator"
        shareUrl={generateShareUrl(false)}
        result={areaValue ? { area: areaValue, unit: areaUnit } : null}
        generateShareUrl={generateShareUrl}
        generateShareText={generateShareText}
      />
    </div>
  );
}
