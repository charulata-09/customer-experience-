import { supabaseAdmin } from '../src/config/supabase.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';
import { DOMAINS, CHANNELS, CATEGORIES, URGENCIES, SENTIMENTS, TICKET_STATUSES } from '../src/constants/enums.js';

const DEMO_PASSWORD = env.SEED_DEMO_PASSWORD || 'ChangeMe_Demo#2025';

async function findOrCreateUser({ email, password, full_name, role }) {
  // Check if user already exists
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === email);

  let userId;
  if (existing) {
    logger.info(`User ${email} already exists (${existing.id})`);
    userId = existing.id;
  } else {
    logger.info(`Creating user: ${email}...`);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (error) {
      logger.error({ error }, `Failed to create user ${email}`);
      throw error;
    }
    userId = created.user.id;
  }

  // Ensure public.profiles has correct role
  await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email,
      full_name,
      role,
    },
    { onConflict: 'id' }
  );

  return userId;
}

const SAMPLE_TICKET_TEMPLATES = [
  // 1-5 E-Commerce
  {
    domain: 'ecommerce',
    channel: 'web',
    subject: 'Package marked delivered but not at my address',
    message: 'Tracking #USPS-9821 states delivery was completed at 2 PM, but my porch and building lobby are empty. I need my order replaced or refunded immediately.',
    reference_id: 'ORD-9821',
    status: 'open',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.65,
    churn_risk: 72,
    category: 'delivery_logistics',
    intent: 'complaint',
    emotions: ['anxious', 'frustrated'],
    summary: 'Customer reports marked-delivered package is missing.',
  },
  {
    domain: 'ecommerce',
    channel: 'chat',
    subject: 'Defective zipper on leather winter jacket',
    message: 'I received the winter jacket yesterday, but the main zipper teeth are misaligned and jammed shut. Could you please send a prepaid return label and replacement?',
    reference_id: 'ORD-8412',
    status: 'in_progress',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.4,
    churn_risk: 35,
    category: 'product_quality',
    intent: 'request',
    emotions: ['disappointed'],
    summary: 'Customer received jacket with jammed zipper and requests replacement.',
  },
  {
    domain: 'ecommerce',
    channel: 'email',
    subject: 'Refund not credited to my Mastercard after 10 days',
    message: 'Your returns center confirmed receipt of my return 10 days ago (RMA-4029), but no credit has appeared on my bank statement. Please check the refund status.',
    reference_id: 'RMA-4029',
    status: 'awaiting_customer',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.55,
    churn_risk: 68,
    category: 'refund_return',
    intent: 'complaint',
    emotions: ['frustrated', 'confused'],
    summary: 'Customer inquiring about delayed return refund to credit card.',
  },
  {
    domain: 'ecommerce',
    channel: 'social',
    subject: 'Loved the fast shipping and packaging on my order!',
    message: 'Just wanted to shout out your logistics team! Ordered on Thursday night and had it in hand by Friday afternoon. Beautiful presentation too. Thank you!',
    reference_id: 'ORD-1092',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.95,
    churn_risk: 5,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted', 'satisfied'],
    summary: 'Customer expresses high satisfaction with rapid delivery and packaging.',
  },
  {
    domain: 'ecommerce',
    channel: 'web',
    subject: 'Wrong size delivered: received Small instead of Large',
    message: 'My packing slip says Size L, but the tag inside the garment is clearly marked Small. I cannot wear this for my event this weekend.',
    reference_id: 'ORD-5521',
    status: 'open',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.6,
    churn_risk: 55,
    category: 'delivery_logistics',
    intent: 'complaint',
    emotions: ['frustrated'],
    summary: 'Customer received wrong apparel size from warehouse.',
  },

  // 6-10 Banking / Fintech
  {
    domain: 'banking_fintech',
    channel: 'phone',
    subject: 'Unauthorized transaction of $840 from foreign merchant',
    message: 'I just received an alert for an $840 charge from a luxury retailer in Europe that I never authorized. I am in California. Please freeze my card immediately.',
    reference_id: 'TXN-9901',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.85,
    churn_risk: 85,
    category: 'billing_payment',
    intent: 'escalation_demand',
    emotions: ['anxious', 'angry'],
    summary: 'Customer alerts bank to fraudulent $840 international charge.',
  },
  {
    domain: 'banking_fintech',
    channel: 'web',
    subject: 'Locked out due to SMS 2FA passcode not arriving',
    message: 'I have been trying to log in for 30 minutes to pay my rent, but the verification SMS passcodes are never arriving on my phone. Cellular carrier is working fine.',
    reference_id: 'USR-8821',
    status: 'in_progress',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.7,
    churn_risk: 60,
    category: 'account_access',
    intent: 'complaint',
    emotions: ['frustrated', 'anxious'],
    summary: 'Customer unable to log in due to SMS 2FA delivery failure.',
  },
  {
    domain: 'banking_fintech',
    channel: 'chat',
    subject: 'When does ACH direct deposit clear for new payees?',
    message: 'Hi, I initiated an ACH transfer to my newly linked investment broker yesterday. Could you let me know the standard clearing schedule?',
    reference_id: 'ACH-4410',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'neutral',
    sentiment_score: 0.1,
    churn_risk: 10,
    category: 'general_inquiry',
    intent: 'question',
    emotions: ['neutral'],
    summary: 'Customer inquiring about clearing schedule for ACH transfer.',
  },
  {
    domain: 'banking_fintech',
    channel: 'email',
    subject: 'Dispute filed 30 days ago still has no provisional credit',
    message: 'I submitted dispute case #DISP-221 a month ago regarding a duplicate hotel charge. Your agent promised a provisional credit within 10 days, but nothing has happened.',
    reference_id: 'DISP-221',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.8,
    churn_risk: 90,
    category: 'billing_payment',
    intent: 'cancellation_threat',
    emotions: ['angry', 'disappointed'],
    summary: 'Customer threatens cancellation over delayed dispute provisional credit.',
  },
  {
    domain: 'banking_fintech',
    channel: 'web',
    subject: 'Request to increase daily wire transfer limit',
    message: 'We are closing on a property this Friday and need our daily outbound wire transfer limit increased to $150,000. Supporting escrow documentation is attached.',
    reference_id: 'WIRE-890',
    status: 'in_progress',
    urgency: 'medium',
    sentiment: 'neutral',
    sentiment_score: 0.05,
    churn_risk: 15,
    category: 'general_inquiry',
    intent: 'request',
    emotions: ['neutral'],
    summary: 'Customer requests wire limit elevation for real estate escrow.',
  },

  // 11-15 Telecom
  {
    domain: 'telecom',
    channel: 'phone',
    subject: 'Complete fiber broadband outage in postal code 94107',
    message: 'My entire home office fiber connection went red at 9 AM. I am hosting a critical client webinar at noon. Is there a local outage and what is the ETA?',
    reference_id: 'LINE-440',
    status: 'in_progress',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.78,
    churn_risk: 80,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['anxious', 'frustrated'],
    summary: 'Customer experiencing full fiber outage prior to critical business event.',
  },
  {
    domain: 'telecom',
    channel: 'chat',
    subject: 'Activate international roaming pass for Tokyo trip',
    message: 'Landing in Tokyo Haneda in 6 hours. I want to activate the 10-day unlimited international roaming pass on line ending in 4920.',
    reference_id: 'ROAM-12',
    status: 'resolved',
    urgency: 'medium',
    sentiment: 'positive',
    sentiment_score: 0.45,
    churn_risk: 10,
    category: 'service_quality',
    intent: 'request',
    emotions: ['satisfied'],
    summary: 'Customer successfully requested international data roaming activation.',
  },
  {
    domain: 'telecom',
    channel: 'email',
    subject: 'Unexpected $120 fee for equipment return on cancelled line',
    message: 'I returned my old router to your retail store on Main Street two weeks ago. Why am I now billed a $120 unreturned equipment fee? I have the drop-off receipt.',
    reference_id: 'EQ-881',
    status: 'open',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.65,
    churn_risk: 70,
    category: 'billing_payment',
    intent: 'complaint',
    emotions: ['angry', 'frustrated'],
    summary: 'Customer disputes equipment fee after verified return to retail store.',
  },
  {
    domain: 'telecom',
    channel: 'web',
    subject: 'eSIM transfer from iPhone 14 to iPhone 16 failed',
    message: 'The QR code on the self-service transfer portal says already redeemed, and my new phone has No Service. Please generate a fresh eSIM activation code.',
    reference_id: 'SIM-901',
    status: 'open',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.5,
    churn_risk: 45,
    category: 'technical_issue',
    intent: 'request',
    emotions: ['frustrated'],
    summary: 'eSIM profile transfer failed during device upgrade.',
  },
  {
    domain: 'telecom',
    channel: 'social',
    subject: 'Super impressed by customer support representative Maria!',
    message: 'Maria from the technical tier helped me configure my mesh network seamlessly. She was patient, knowledgeable, and polite. Give her a raise!',
    reference_id: 'REP-77',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.9,
    churn_risk: 5,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted'],
    summary: 'Praise for technical support representative assisting with mesh network.',
  },

  // 16-20 SaaS
  {
    domain: 'saas',
    channel: 'web',
    subject: 'API returning 429 Too Many Requests despite Enterprise tier',
    message: 'Our sync jobs are failing because our API calls are being throttled at 60 req/min, even though our Enterprise agreement specifies 1,000 req/min without burst limits.',
    reference_id: 'API-CORP-4',
    status: 'open',
    urgency: 'critical',
    sentiment: 'negative',
    sentiment_score: -0.7,
    churn_risk: 75,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['frustrated', 'anxious'],
    summary: 'Enterprise customer experiencing unexpected API rate limiting.',
  },
  {
    domain: 'saas',
    channel: 'email',
    subject: 'Cancel renewal and request refund for unused annual seats',
    message: 'We downsized our team by 15 engineers last month. We will cancel our renewal next month unless we can adjust our seat count and credit the unused months.',
    reference_id: 'SUB-559',
    status: 'open',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.6,
    churn_risk: 88,
    category: 'billing_payment',
    intent: 'cancellation_threat',
    emotions: ['disappointed'],
    summary: 'Customer threatens renewal cancellation over seat count downgrade.',
  },
  {
    domain: 'saas',
    channel: 'chat',
    subject: 'How do I configure SAML SSO with Okta?',
    message: 'Hi there, where can I download the SP metadata XML file to complete our Okta SSO setup for our workspace?',
    reference_id: 'SSO-01',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'neutral',
    sentiment_score: 0.15,
    churn_risk: 10,
    category: 'account_access',
    intent: 'question',
    emotions: ['neutral'],
    summary: 'Customer requesting Okta SAML SP metadata documentation.',
  },
  {
    domain: 'saas',
    channel: 'web',
    subject: 'Feature request: Webhook delivery failure alerts via Slack',
    message: 'It would be fantastic if we could receive an automated Slack notification whenever an outgoing webhook endpoint returns 5 consecutive 5xx errors.',
    reference_id: 'FR-991',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'positive',
    sentiment_score: 0.5,
    churn_risk: 15,
    category: 'feature_request',
    intent: 'feedback',
    emotions: ['satisfied'],
    summary: 'Feature request for webhook failure alerts to Slack.',
  },
  {
    domain: 'saas',
    channel: 'web',
    subject: 'Database export timeout on datasets over 10GB',
    message: 'When running pg_dump via the automated backup modal, the browser connection terminates at 60 seconds with 504 Gateway Timeout.',
    reference_id: 'DB-EXP-2',
    status: 'in_progress',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.35,
    churn_risk: 30,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['frustrated'],
    summary: 'Customer reports gateway timeout on large database exports.',
  },

  // 21-25 Travel & Hospitality
  {
    domain: 'travel_hospitality',
    channel: 'phone',
    subject: 'Flight cancelled by airline — stranded in Frankfurt with infant',
    message: 'Flight LH-440 was abruptly cancelled with no gate staff present. I need alternative booking on any partner flight to Chicago tonight.',
    reference_id: 'PNR-8841',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.9,
    churn_risk: 85,
    category: 'delivery_logistics',
    intent: 'escalation_demand',
    emotions: ['anxious', 'angry'],
    summary: 'Customer stranded abroad due to cancelled flight, requiring urgent rebooking.',
  },
  {
    domain: 'travel_hospitality',
    channel: 'chat',
    subject: 'Hotel reservation dates need to be shifted by 24 hours',
    message: 'Hello! Due to a business meeting reschedule, could we shift our check-in from Oct 12 to Oct 13? Flexible rate was booked.',
    reference_id: 'HTL-339',
    status: 'resolved',
    urgency: 'medium',
    sentiment: 'positive',
    sentiment_score: 0.35,
    churn_risk: 15,
    category: 'refund_return',
    intent: 'request',
    emotions: ['neutral'],
    summary: 'Customer requested 24-hour shift on flexible hotel booking.',
  },
  {
    domain: 'travel_hospitality',
    channel: 'email',
    subject: 'Room booked as Ocean View was overlooking a dumpster',
    message: 'We paid $180 extra per night for the Deluxe Ocean View suite. Upon arrival, our balcony was directly over the kitchen dumpster loading dock with terrible odor.',
    reference_id: 'HTL-774',
    status: 'open',
    urgency: 'high',
    sentiment: 'very_negative',
    sentiment_score: -0.85,
    churn_risk: 80,
    category: 'service_quality',
    intent: 'complaint',
    emotions: ['angry', 'disappointed'],
    summary: 'Customer complains about incorrect room view and odor.',
  },
  {
    domain: 'travel_hospitality',
    channel: 'social',
    subject: 'Unbelievable customer care from flight rebooking desk!',
    message: 'Lost my luggage in Denver and your baggage team delivered it to my ski lodge within 4 hours. Truly outstanding service!',
    reference_id: 'BAG-102',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.95,
    churn_risk: 5,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted', 'satisfied'],
    summary: 'Praise for swift baggage recovery and lodge delivery.',
  },
  {
    domain: 'travel_hospitality',
    channel: 'web',
    subject: 'Rental car insurance double charge on invoice',
    message: 'I opted out of collision damage waiver at the counter because my credit card covers it, but the final invoice still charged $29/day for CDW.',
    reference_id: 'CAR-551',
    status: 'in_progress',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.45,
    churn_risk: 40,
    category: 'billing_payment',
    intent: 'complaint',
    emotions: ['frustrated'],
    summary: 'Disputed optional insurance charge on car rental invoice.',
  },

  // 26-30 Healthcare Services
  {
    domain: 'healthcare_services',
    channel: 'phone',
    subject: 'Urgent: Blood pressure medication refill delayed 4 days',
    message: 'My prescription renewal for Lisinopril was approved by my physician on Monday, but the pharmacy portal still says pending review. I am out of pills.',
    reference_id: 'RX-9901',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.75,
    churn_risk: 65,
    category: 'general_inquiry',
    intent: 'request',
    emotions: ['anxious'],
    summary: 'Customer awaiting critical blood pressure prescription fulfillment.',
  },
  {
    domain: 'healthcare_services',
    channel: 'web',
    subject: 'Telehealth video link did not connect during appointment',
    message: 'I was in the virtual waiting room for 25 minutes, but the doctor never appeared and the browser reported connection refused. Will I be billed a no-show fee?',
    reference_id: 'APT-441',
    status: 'in_progress',
    urgency: 'high',
    sentiment: 'negative',
    sentiment_score: -0.55,
    churn_risk: 50,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['frustrated', 'anxious'],
    summary: 'Telehealth virtual room technical connection failure.',
  },
  {
    domain: 'healthcare_services',
    channel: 'chat',
    subject: 'How do I download my immunization records for travel?',
    message: 'Hello, I need an official PDF copy of my vaccination records for international visa requirements. Where is that in the portal?',
    reference_id: 'MED-12',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'neutral',
    sentiment_score: 0.1,
    churn_risk: 10,
    category: 'general_inquiry',
    intent: 'question',
    emotions: ['neutral'],
    summary: 'Customer requesting digital immunization records for travel.',
  },
  {
    domain: 'healthcare_services',
    channel: 'email',
    subject: 'Insurance claim denied due to wrong diagnosis code',
    message: 'My insurer rejected claim #CLM-881 stating the diagnostic code was invalid for the consultation. Could your billing team resubmit with corrected ICD-10 code?',
    reference_id: 'CLM-881',
    status: 'open',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.3,
    churn_risk: 35,
    category: 'billing_payment',
    intent: 'request',
    emotions: ['confused'],
    summary: 'Customer requests insurance claim resubmission with corrected diagnostic code.',
  },
  {
    domain: 'healthcare_services',
    channel: 'web',
    subject: 'Doctor Lee was wonderful and answered all my questions',
    message: 'I had severe anxiety regarding my scheduled procedure, but Dr. Lee took 45 minutes to explain every step and put my mind at ease. Wonderful clinic.',
    reference_id: 'APT-992',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.95,
    churn_risk: 5,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted', 'satisfied'],
    summary: 'Praise for compassionate bedside manner from specialist.',
  },

  // 31-35 Food Delivery
  {
    domain: 'food_delivery',
    channel: 'chat',
    subject: 'Entire food order arrived cold and soup was completely spilled',
    message: 'The courier placed the soup container upside down in the bag. Everything is soaked in broth and cold. The courier did not care. Refund my $54 please.',
    reference_id: 'FOOD-490',
    status: 'open',
    urgency: 'high',
    sentiment: 'very_negative',
    sentiment_score: -0.85,
    churn_risk: 78,
    category: 'delivery_logistics',
    intent: 'complaint',
    emotions: ['angry', 'disappointed'],
    summary: 'Food order arrived spilled and cold; customer demands immediate refund.',
  },
  {
    domain: 'food_delivery',
    channel: 'phone',
    subject: 'Order delayed 1 hour past promised delivery window',
    message: 'My kids are starving. The app has said "Courier approaching" for 45 minutes. Cancel this order and refund my money right now.',
    reference_id: 'FOOD-771',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.9,
    churn_risk: 92,
    category: 'delivery_logistics',
    intent: 'cancellation_threat',
    emotions: ['angry'],
    summary: 'Customer demands cancellation and refund for extreme food delivery delay.',
  },
  {
    domain: 'food_delivery',
    channel: 'web',
    subject: 'Missing gluten-free vegetarian item from group order',
    message: 'Our corporate lunch order was missing the vegan bowl for our colleague with celiac disease. We had to order from another restaurant.',
    reference_id: 'FOOD-102',
    status: 'resolved',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.45,
    churn_risk: 40,
    category: 'product_quality',
    intent: 'complaint',
    emotions: ['frustrated'],
    summary: 'Missing dietary item from corporate lunch order.',
  },
  {
    domain: 'food_delivery',
    channel: 'social',
    subject: 'Driver returned my lost wallet left on the front steps!',
    message: 'Your delivery driver Carlos found my wallet on my driveway and brought it right back to my door. Incredible honesty!',
    reference_id: 'DRV-441',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.98,
    churn_risk: 2,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted'],
    summary: 'Commendation for driver integrity returning lost wallet.',
  },
  {
    domain: 'food_delivery',
    channel: 'chat',
    subject: 'Promo discount code WELCOME20 did not apply to checkout',
    message: 'I entered promo code WELCOME20 for 20% off my first order, but the charge went through at full price of $42.50.',
    reference_id: 'FOOD-902',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'negative',
    sentiment_score: -0.25,
    churn_risk: 25,
    category: 'billing_payment',
    intent: 'complaint',
    emotions: ['confused'],
    summary: 'Promo code discount not reflected at checkout.',
  },

  // 36-42 Education / EdTech
  {
    domain: 'education',
    channel: 'web',
    subject: 'Final exam submission timed out and showed 0% score',
    message: 'I was submitting my proctored final exam for Data Structures when the server crashed at 11:59 PM. My dashboard shows a score of 0. Please restore my answers.',
    reference_id: 'EXAM-441',
    status: 'open',
    urgency: 'critical',
    sentiment: 'very_negative',
    sentiment_score: -0.88,
    churn_risk: 70,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['anxious', 'frustrated'],
    summary: 'Server crashed during final exam submission, incorrectly marking 0.',
  },
  {
    domain: 'education',
    channel: 'email',
    subject: 'Request extension on certificate completion deadline',
    message: 'Due to a family medical emergency, I was unable to complete the capstone project by Sunday. Can I request a 1-week extension for certificate eligibility?',
    reference_id: 'CRS-881',
    status: 'in_progress',
    urgency: 'medium',
    sentiment: 'neutral',
    sentiment_score: 0.0,
    churn_risk: 20,
    category: 'general_inquiry',
    intent: 'request',
    emotions: ['anxious'],
    summary: 'Student requests 1-week capstone project deadline extension.',
  },
  {
    domain: 'education',
    channel: 'chat',
    subject: 'How do I link my university GitHub account for student pack?',
    message: 'Hi, where do I enter my .edu email address to unlock the complimentary developer pack tools?',
    reference_id: 'STU-10',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'positive',
    sentiment_score: 0.4,
    churn_risk: 5,
    category: 'account_access',
    intent: 'question',
    emotions: ['satisfied'],
    summary: 'Student inquiries about activating GitHub education benefits.',
  },
  {
    domain: 'education',
    channel: 'web',
    subject: 'Video player buffering constantly on iOS mobile app',
    message: 'Even on high-speed 5G, course video lessons pause every 15 seconds to buffer on iOS 18. Web version works fine.',
    reference_id: 'MOB-33',
    status: 'open',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.4,
    churn_risk: 35,
    category: 'technical_issue',
    intent: 'complaint',
    emotions: ['frustrated'],
    summary: 'Mobile app video player buffering on iOS.',
  },
  {
    domain: 'education',
    channel: 'social',
    subject: 'Landed my first Software Engineer job thanks to this curriculum!',
    message: 'Just signed my offer letter today! The project-based learning and mentor code reviews were the best investment of my life.',
    reference_id: 'ALUM-99',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'very_positive',
    sentiment_score: 0.99,
    churn_risk: 0,
    category: 'compliment',
    intent: 'praise',
    emotions: ['delighted', 'satisfied'],
    summary: 'Graduate success story and gratitude for career outcomes.',
  },
  {
    domain: 'saas',
    channel: 'email',
    subject: 'Invoice has wrong VAT number and company address',
    message: 'Please re-issue invoice #INV-2025-01 with our European VAT registration number NL820491029B01 and updated corporate headquarters address.',
    reference_id: 'INV-2025-01',
    status: 'resolved',
    urgency: 'low',
    sentiment: 'neutral',
    sentiment_score: 0.0,
    churn_risk: 10,
    category: 'billing_payment',
    intent: 'request',
    emotions: ['neutral'],
    summary: 'Customer requests invoice revision with updated corporate VAT details.',
  },
  {
    domain: 'ecommerce',
    channel: 'phone',
    subject: 'Subscription coffee beans arrived grounded instead of whole bean',
    message: 'My monthly dark roast subscription arrived as fine drip ground, but my preference profile is strictly Whole Bean for French Press. Please send replacement.',
    reference_id: 'SUB-COF-8',
    status: 'resolved',
    urgency: 'medium',
    sentiment: 'negative',
    sentiment_score: -0.3,
    churn_risk: 25,
    category: 'product_quality',
    intent: 'request',
    emotions: ['disappointed'],
    summary: 'Subscription coffee delivered in wrong grind format.',
  },
];

async function seed() {
  logger.info('🚀 Starting CX Copilot Database Seeding...');

  // 1. Create or verify demo users
  logger.info('1. Creating demo users...');
  const adminId = await findOrCreateUser({
    email: 'admin@demo.com',
    password: DEMO_PASSWORD,
    full_name: 'Admin Sarah Chen',
    role: 'admin',
  });

  const agentId = await findOrCreateUser({
    email: 'agent@demo.com',
    password: DEMO_PASSWORD,
    full_name: 'Agent Michael Ross',
    role: 'agent',
  });

  const customerId = await findOrCreateUser({
    email: 'customer@demo.com',
    password: DEMO_PASSWORD,
    full_name: 'Alex Johnson',
    role: 'customer',
  });

  const customer2Id = await findOrCreateUser({
    email: 'customer2@demo.com',
    password: DEMO_PASSWORD,
    full_name: 'Emma Watson',
    role: 'customer',
  });

  // 2. Initialize Brand Settings
  logger.info('2. Initializing Brand Settings...');
  await supabaseAdmin.from('brand_settings').upsert(
    {
      id: 1,
      brand_name: 'Acme',
      brand_voice_guidelines: 'Warm, clear, respectful, transparent, solution-focused.',
      forbidden_phrases: ['impossible', 'not our problem', 'you should have known'],
      signature: 'The Acme Customer Experience Team',
      default_tone: 'empathetic',
    },
    { onConflict: 'id' }
  );

  // 3. Populate 42 realistic tickets across domains & channels
  logger.info(`3. Inserting ${SAMPLE_TICKET_TEMPLATES.length} realistic tickets and AI analyses...`);
  let createdCount = 0;

  for (let i = 0; i < SAMPLE_TICKET_TEMPLATES.length; i++) {
    const tmpl = SAMPLE_TICKET_TEMPLATES[i];
    const assignedCustId = i % 2 === 0 ? customerId : customer2Id;
    const isResolved = tmpl.status === 'resolved';

    // Calculate created date staggered over last 30 days
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const resolvedAt = isResolved
      ? new Date(new Date(createdAt).getTime() + 4 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: ticket, error: tErr } = await supabaseAdmin
      .from('tickets')
      .insert({
        customer_id: assignedCustId,
        assigned_agent_id: i % 3 === 0 ? agentId : null,
        domain: tmpl.domain,
        channel: tmpl.channel,
        subject: tmpl.subject,
        message: tmpl.message,
        reference_id: tmpl.reference_id,
        status: tmpl.status,
        created_at: createdAt,
        resolved_at: resolvedAt,
      })
      .select('*')
      .single();

    if (tErr || !ticket) {
      logger.error({ tErr }, `Failed to insert ticket ${tmpl.subject}`);
      continue;
    }

    createdCount++;

    // Insert AI Analysis
    await supabaseAdmin.from('ticket_analyses').upsert(
      {
        ticket_id: ticket.id,
        sentiment: tmpl.sentiment,
        sentiment_score: tmpl.sentiment_score,
        intent: tmpl.intent,
        category: tmpl.category,
        urgency: tmpl.urgency,
        churn_risk: tmpl.churn_risk,
        emotions: tmpl.emotions,
        key_entities: tmpl.reference_id
          ? [{ type: 'reference', value: tmpl.reference_id }]
          : [],
        summary: tmpl.summary,
        escalate: tmpl.urgency === 'critical',
        escalation_reason:
          tmpl.urgency === 'critical'
            ? 'Critical interaction requiring immediate supervisor triage'
            : null,
        model: 'gemini-2.5-flash',
        created_at: createdAt,
      },
      { onConflict: 'ticket_id' }
    );

    // Insert customer thread message
    await supabaseAdmin.from('ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: assignedCustId,
      sender_type: 'customer',
      body: tmpl.message,
      created_at: createdAt,
    });

    // If resolved or in progress, insert agent response message
    if (isResolved || tmpl.status === 'in_progress' || tmpl.status === 'awaiting_customer') {
      const replyTime = new Date(new Date(createdAt).getTime() + 15 * 60 * 1000).toISOString();
      await supabaseAdmin.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: agentId,
        sender_type: 'agent',
        body: `Hello! Thank you for contacting our support team. We have received your inquiry regarding "${tmpl.subject}". Our team has verified the issue and processed the necessary steps. Please let us know if you need any additional assistance.\n\nThe Acme Customer Experience Team`,
        created_at: replyTime,
      });
    }

    // If resolved, insert CSAT rating
    if (isResolved) {
      const rating = tmpl.sentiment_score >= 0.5 ? 5 : tmpl.sentiment_score >= 0 ? 4 : 3;
      await supabaseAdmin.from('csat_feedback').upsert(
        {
          ticket_id: ticket.id,
          customer_id: assignedCustId,
          rating,
          comment: rating >= 4 ? 'Issue handled promptly and politely.' : 'Satisfactory resolution.',
          created_at: resolvedAt || new Date().toISOString(),
        },
        { onConflict: 'ticket_id' }
      );
    }
  }

  logger.info(`✅ Successfully seeded ${createdCount} realistic tickets with full analyses and threads.`);

  // 4. Sample customer recommendations
  logger.info('4. Seeding customer recommendation cache...');
  await supabaseAdmin.from('customer_recommendations').insert({
    customer_id: customerId,
    health_score: 74,
    recommendations: {
      health_score: 74,
      risk_level: 'medium',
      headline: 'Customer sentiment stable; recommend follow-up on recent logistics replacement.',
      recommendations: [
        {
          priority: 1,
          action: 'Send automated shipment tracking check-in notification',
          channel: 'email',
          timing: 'Within 24 hours',
          expected_impact: 'Reduces Where-Is-My-Order inquiries by 25%',
          needs_approval: false,
        },
        {
          priority: 2,
          action: 'Offer $10 store credit goodwill voucher',
          channel: 'in_app',
          timing: 'Next login',
          expected_impact: 'Restores CSAT satisfaction rating',
          needs_approval: true,
        },
      ],
    },
  });

  logger.info('🎉 Seed complete! All demo accounts and analytics dashboards are populated.');
}

seed().catch((err) => {
  logger.error(err, 'Seed execution error');
  process.exit(1);
});
