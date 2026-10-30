export const DOMAINS = [
  { value: 'ecommerce', label: 'E-Commerce & Retail' },
  { value: 'banking_fintech', label: 'Banking & Fintech' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'saas', label: 'SaaS & Cloud Software' },
  { value: 'travel_hospitality', label: 'Travel & Hospitality' },
  { value: 'healthcare_services', label: 'Healthcare & Telehealth' },
  { value: 'food_delivery', label: 'Food & Quick Delivery' },
  { value: 'education', label: 'EdTech & Education' },
];

export const CHANNELS = [
  { value: 'web', label: 'Web Portal' },
  { value: 'chat', label: 'Live Chat' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'phone', label: 'Phone Call' },
];

export const CATEGORIES = [
  { value: 'billing_payment', label: 'Billing & Payment' },
  { value: 'delivery_logistics', label: 'Delivery & Logistics' },
  { value: 'product_quality', label: 'Product Quality' },
  { value: 'technical_issue', label: 'Technical Issue' },
  { value: 'account_access', label: 'Account Access & Security' },
  { value: 'refund_return', label: 'Refund & Return' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'compliment', label: 'Compliment' },
];

export const URGENCIES = [
  { value: 'low', label: 'Low', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'high', label: 'High', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'critical', label: 'Critical', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' },
];

export const SENTIMENTS = [
  { value: 'very_negative', label: 'Very Negative', color: 'text-rose-400 bg-rose-500/10' },
  { value: 'negative', label: 'Negative', color: 'text-orange-400 bg-orange-500/10' },
  { value: 'neutral', label: 'Neutral', color: 'text-slate-400 bg-slate-500/10' },
  { value: 'positive', label: 'Positive', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'very_positive', label: 'Very Positive', color: 'text-teal-400 bg-teal-500/10' },
];

export const TICKET_STATUSES = [
  { value: 'open', label: 'Open', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'awaiting_customer', label: 'Awaiting Customer', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { value: 'closed', label: 'Closed', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
];

export const TONES = [
  { value: 'empathetic', label: 'Empathetic', desc: 'Warm, compassionate, caring' },
  { value: 'professional', label: 'Professional', desc: 'Clear, objective, formal' },
  { value: 'friendly', label: 'Friendly', desc: 'Approachable, upbeat, conversational' },
  { value: 'concise', label: 'Concise', desc: 'Direct, brief, action-oriented' },
];
