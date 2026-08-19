export function evaluateAmountExpression(input: string): number {
  const expression = input.replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/,/g, '').replace(/\s+/g, '');
  if (!expression) return NaN;
  if (!/^[0-9+\-*/().]+$/.test(expression)) return NaN;
  let i = 0;
  function parseExpression(): number {
    let value = parseTerm();
    while (i < expression.length && (expression[i] === '+' || expression[i] === '-')) {
      const op = expression[i++];
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (i < expression.length && (expression[i] === '*' || expression[i] === '/')) {
      const op = expression[i++];
      const rhs = parseFactor();
      if (op === '/' && rhs === 0) return NaN;
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function parseFactor(): number {
    if (expression[i] === '+') { i++; return parseFactor(); }
    if (expression[i] === '-') { i++; return -parseFactor(); }
    if (expression[i] === '(') {
      i++;
      const value = parseExpression();
      if (expression[i] !== ')') return NaN;
      i++;
      return value;
    }
    const start = i;
    while (i < expression.length && /[0-9.]/.test(expression[i])) i++;
    if (start === i) return NaN;
    const token = expression.slice(start, i);
    if ((token.match(/\./g) || []).length > 1) return NaN;
    const value = Number(token);
    return Number.isFinite(value) ? value : NaN;
  }
  const value = parseExpression();
  return i === expression.length && Number.isFinite(value) ? value : NaN;
}
