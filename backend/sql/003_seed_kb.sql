-- ==============================================================================
-- KNOWLEDGE BASE SEED ARTICLES
-- ==============================================================================

insert into public.kb_articles (id, title, domain, category, content, is_published)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'Standard Refund and Return Policy',
    'ecommerce',
    'refund_return',
    'Customers are eligible for a full refund on unworn, unopened, or defective items within 30 days of confirmed delivery. Return shipping is free when using our pre-paid return label generated from the orders portal. Refunds are credited back to the original payment method within 3 to 5 business days after our warehouse inspects the returned package. Perishable goods and personalized custom items are non-refundable unless damaged upon receipt.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Tracking and Expedited Shipping Delays',
    'ecommerce',
    'delivery_logistics',
    'Standard shipping takes 3-5 business days. Express shipping delivers in 1-2 business days. If a shipment tracking status has not updated in more than 48 hours, or if an order has exceeded the guaranteed delivery window, customers qualify for an immediate shipping fee refund. In case of marked-delivered packages not found by the recipient, we wait 24 hours for carrier drop-off reconciliation before initiating a free replacement or store credit.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'Disputed Charges & Fraudulent Card Activity',
    'banking_fintech',
    'billing_payment',
    'If an unauthorized or duplicate transaction appears on your account, temporarily freeze the associated card instantly via the Security tab in your dashboard. You have up to 60 days from the statement date to dispute unauthorized charges. Our fraud mitigation unit reviews disputes within 24 to 48 business hours and issues a provisional credit during the merchant investigation period.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Two-Factor Authentication (2FA) and Account Recovery',
    'banking_fintech',
    'account_access',
    'For security, passcodes sent via SMS or Authenticator Apps expire after 5 minutes. If you lose access to your primary authentication device, submit your government-issued ID and recent selfie verification through our secure identity portal. Account recovery verification is completed within 2 hours during normal business hours (8 AM - 8 PM EST). Support agents will never ask for your password or full 2FA code.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'SaaS Subscription Renewal, Upgrades, and Seat Licenses',
    'saas',
    'billing_payment',
    'All annual subscriptions renew automatically on the billing anniversary unless cancelled at least 14 days prior. Workspace admins can add or remove user seats at any time; billing is prorated to the exact remaining days in the billing cycle. If an account downgrades to a lower tier, active team data remains accessible in read-only mode for 90 days before archiving.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'API Rate Limiting, 429 Status Codes, and Webhook Retries',
    'saas',
    'technical_issue',
    'The standard API rate limit is 1,000 requests per minute per API key. When a 429 Too Many Requests response is returned, client applications should respect the Retry-After header and implement exponential backoff. Webhook delivery endpoints that return 5xx errors or time out after 10 seconds are retried up to 5 times over a 24-hour window.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'Roaming Data Passes and International Coverage',
    'telecom',
    'service_quality',
    'International roaming data passes can be activated through the mobile app prior to or upon arrival in over 140 supported countries. Daily passes provide 2GB of high-speed data followed by unlimited 2G speeds. If high-speed connectivity fails abroad, toggle Airplane mode or select the partner carrier manually in network settings. Support can provision an emergency network reset remotely.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'Flight and Hotel Booking Cancellation / Rescheduling Policy',
    'travel_hospitality',
    'refund_return',
    'Flight bookings can be changed or cancelled with full credit within 24 hours of initial reservation. Beyond 24 hours, airline fare rules apply. Hotel reservations booked under Flexible terms can be cancelled up to 48 hours prior to check-in for a 100% refund. In the event of airline flight cancellations, passengers are entitled to immediate alternate flight booking or an unrestricted cash refund.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000009',
    'Late Food Delivery, Missing Items, and Spillage Compensation',
    'food_delivery',
    'delivery_logistics',
    'If your food order arrives 25 minutes or more past the estimated delivery window, a $10 on-time guarantee credit is automatically applied to your account. For missing or damaged items, upload a photo through the order help screen to receive an immediate refund or redelivery voucher within 15 minutes without needing to wait in customer service queues.',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000010',
    'Telehealth Appointment Rescheduling & Prescription Refills',
    'healthcare_services',
    'general_inquiry',
    'Appointments with specialists or primary care physicians can be rescheduled free of charge up to 4 hours prior to the scheduled consultation. Prescription refills can be requested electronically through the patient dashboard and are sent to your designated pharmacy within 24 hours after physician approval. In case of medical emergencies, dial emergency services immediately.',
    true
  )
on conflict (id) do update set
  title = excluded.title,
  domain = excluded.domain,
  category = excluded.category,
  content = excluded.content,
  is_published = excluded.is_published;
