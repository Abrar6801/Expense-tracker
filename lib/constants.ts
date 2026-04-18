export const PRESET_CATEGORIES = [
  'Dining',
  'Entertainment',
  'Freelance',
  'Groceries',
  'Health',
  'Housing',
  'Interest',
  'Other',
  'Salary',
  'Savings',
  'Shopping',
  'Subscriptions',
  'Transport',
  'Travel',
  'Utilities',
] as const

export const ACCOUNT_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Pink', value: '#ec4899' },
] as const

export const CURRENCIES = [
  { label: 'USD — US Dollar', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — British Pound', value: 'GBP' },
  { label: 'JPY — Japanese Yen', value: 'JPY' },
  { label: 'CAD — Canadian Dollar', value: 'CAD' },
  { label: 'AUD — Australian Dollar', value: 'AUD' },
  { label: 'CHF — Swiss Franc', value: 'CHF' },
] as const

export const CHART_COLORS = [
  '#6366f1',
  '#a855f7',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#10b981',
  '#ef4444',
]

export const DATE_FILTER_OPTIONS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'This year', value: 'ytd' },
  { label: 'All time', value: 'all' },
] as const
