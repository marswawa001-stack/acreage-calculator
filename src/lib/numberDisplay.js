export function normalizeNumericInput(input) {
  if (input == null) return '';
  const str = String(input);
  // allow digits, one leading '-', and one '.'
  let out = '';
  let hasDot = false;
  let hasSign = false;

  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !hasDot) {
      hasDot = true;
      out += ch;
      continue;
    }
    if (ch === '-' && i === 0 && !hasSign) {
      hasSign = true;
      out += ch;
      continue;
    }
  }

  return out;
}

export function formatWithThousandsSeparators(value) {
  if (value == null) return '';
  const str = String(value);
  if (!str) return '';

  // keep trailing dot while typing (e.g. "12.")
  if (/^-?\d+\.$/.test(str)) return str;

  const num = Number(str.replace(/,/g, ''));
  if (!Number.isFinite(num)) return str;

  // preserve decimals length if provided
  const parts = str.replace(/,/g, '').split('.');
  const decimals = parts[1];
  const formattedInt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(
    Number(parts[0] || 0)
  );

  if (decimals != null) return `${formattedInt}.${decimals}`;
  return formattedInt;
}
