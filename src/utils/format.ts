// Shared formatting helpers
// Keep lightweight and framework agnostic

export function formatPriceUSD(raw: string | number): string {
  const numeric = typeof raw === 'number' ? raw : parseInt(raw.replace(/[^\d]/g, ''), 10);
  if (isNaN(numeric)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numeric);
}

export function formatISODate(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Simple helper to add commas without currency symbol (e.g., for inline headings already with $)
export function formatNumberWithCommas(raw: string | number): string {
  const numeric = typeof raw === 'number' ? raw : parseInt(raw.replace(/[^\d]/g, ''), 10);
  if (isNaN(numeric)) return '0';
  return numeric.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
