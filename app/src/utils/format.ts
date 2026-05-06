export function formatCurrency(value: number | string, locale = 'pt-BR', currency = 'BRL') {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(num)) return null
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num)
}
