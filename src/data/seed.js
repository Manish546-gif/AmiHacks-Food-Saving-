// ===== SURPLUS-TO-SHELTER DEMO SEED DATA =====
// Kota, Rajasthan pilot scenario

export const DONORS = [
  {
    id: 1, name: 'Royal Spice Kitchen', type: 'restaurant',
    lat: 25.2138, lng: 75.8648, address: 'Talwandi, Kota, Rajasthan',
    contact: '+91 98760 11111', fssai_no: 'FSSAI2023001', verified: true,
    hygiene_rating: 4.5, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=200&q=80'
  },
  {
    id: 2, name: 'Shree Krishna Caterers', type: 'caterer',
    lat: 25.1850, lng: 75.8401, address: 'Vigyan Nagar, Kota, Rajasthan',
    contact: '+91 98760 22222', fssai_no: 'FSSAI2023002', verified: true,
    hygiene_rating: 4.2, image: null
  },
  {
    id: 3, name: 'Allen Coaching Institute Mess', type: 'hostel_mess',
    lat: 25.1952, lng: 75.8481, address: 'Mahaveer Nagar, Kota, Rajasthan',
    contact: '+91 98760 33333', fssai_no: 'FSSAI2023003', verified: true,
    hygiene_rating: 4.8, image: null
  },
  {
    id: 4, name: 'New Anaj Mandi Fresh Grocer', type: 'grocer',
    lat: 25.1760, lng: 75.8310, address: 'Nayapura, Kota, Rajasthan',
    contact: '+91 98760 44444', fssai_no: 'FSSAI2023004', verified: true,
    hygiene_rating: 3.9, image: null
  },
  {
    id: 5, name: 'Rajputana Hotel & Banquet', type: 'restaurant',
    lat: 25.2280, lng: 75.8712, address: 'Station Road, Kota, Rajasthan',
    contact: '+91 98760 55555', fssai_no: 'FSSAI2023005', verified: true,
    hygiene_rating: 4.6, image: null
  },
  {
    id: 6, name: 'IIT-JEE Campus Dining Hall', type: 'campus_dining',
    lat: 25.2010, lng: 75.8543, address: 'Jhalawar Road, Kota, Rajasthan',
    contact: '+91 98760 66666', fssai_no: 'FSSAI2023006', verified: true,
    hygiene_rating: 4.7, image: null
  },
];

export const RECIPIENTS = [
  {
    id: 1, name: 'Asha Nilayam Old Age Home', type: 'old_age_home', tier: 1,
    lat: 25.2065, lng: 75.8580, address: 'Behind Bus Stand, Kota',
    contact_person: 'Sister Mary Thomas', contact: '+91 98761 11111',
    registration_id: 'RAJ-OAH-2019-042', verified: true,
    headcount: 65, meal_times: ['12:30', '19:30'],
    dietary_rules: ['veg_only', 'soft_food'],
    accepted_categories: ['cooked', 'dairy', 'produce'],
    capacity_kg: 40, capacity_used_kg: 12,
    open_from: '08:00', open_to: '21:00',
    has_kitchen: true, has_refrigeration: true,
    need_today_kg: 25, accepting: true, language: 'hi',
    meals_received: 248,
    image: null
  },
  {
    id: 2, name: 'Shishu Grih Child Care Home', type: 'cci', tier: 1,
    lat: 25.1920, lng: 75.8452, address: 'Dadabari, Kota',
    contact_person: 'Sunita Devi', contact: '+91 98761 22222',
    registration_id: 'RAJ-CCI-2018-017', verified: true,
    headcount: 42, meal_times: ['12:00', '19:00'],
    dietary_rules: ['veg_only'],
    accepted_categories: ['cooked', 'bakery', 'produce', 'dairy'],
    capacity_kg: 30, capacity_used_kg: 5,
    open_from: '07:00', open_to: '21:00',
    has_kitchen: true, has_refrigeration: false,
    need_today_kg: 18, accepting: true, language: 'hi',
    meals_received: 312, image: null
  },
  {
    id: 3, name: 'Anganwadi Centre No. 47', type: 'anganwadi', tier: 1,
    lat: 25.1800, lng: 75.8320, address: 'Nayapura Colony, Kota',
    contact_person: 'Kavita Sharma (Supervisor)', contact: '+91 98761 33333',
    registration_id: 'RAJ-AWC-0047', verified: true,
    headcount: 28, meal_times: ['11:30'],
    dietary_rules: ['veg_only', 'no_spicy'],
    accepted_categories: ['cooked', 'produce', 'dairy'],
    capacity_kg: 20, capacity_used_kg: 0,
    open_from: '09:00', open_to: '14:00',
    has_kitchen: true, has_refrigeration: false,
    need_today_kg: 12, accepting: true, language: 'hi',
    meals_received: 189, image: null
  },
  {
    id: 4, name: 'Annapurna Rasoi - Ward 12', type: 'govt_kitchen', tier: 2,
    lat: 25.2150, lng: 75.8680, address: 'Vigyan Nagar Square, Kota',
    contact_person: 'Ramesh Gupta (In-charge)', contact: '+91 98761 44444',
    registration_id: 'RAJ-GCK-2022-012', verified: true,
    headcount: 200, meal_times: ['13:00', '20:00'],
    dietary_rules: ['veg_only'],
    accepted_categories: ['cooked', 'produce', 'packaged'],
    capacity_kg: 100, capacity_used_kg: 30,
    open_from: '10:00', open_to: '21:00',
    has_kitchen: true, has_refrigeration: true,
    need_today_kg: 60, accepting: true, language: 'hi',
    meals_received: 4219, image: null
  },
  {
    id: 5, name: 'Government Community Kitchen - Station', type: 'govt_kitchen', tier: 2,
    lat: 25.2290, lng: 75.8720, address: 'Near Railway Station, Kota',
    contact_person: 'Prabha Mehta', contact: '+91 98761 55555',
    registration_id: 'RAJ-GCK-2021-005', verified: true,
    headcount: 150, meal_times: ['12:30', '19:30'],
    dietary_rules: [],
    accepted_categories: ['cooked', 'produce', 'packaged', 'dairy'],
    capacity_kg: 80, capacity_used_kg: 20,
    open_from: '09:00', open_to: '22:00',
    has_kitchen: true, has_refrigeration: true,
    need_today_kg: 45, accepting: true, language: 'hi',
    meals_received: 3102, image: null
  },
  {
    id: 6, name: 'Rajasthan Jan Seva NGO', type: 'ngo', tier: 3,
    lat: 25.1735, lng: 75.8280, address: 'Gumanpura, Kota',
    contact_person: 'Arjun Malhotra', contact: '+91 98761 66666',
    registration_id: 'RAJ-NGO-REG-2017-0234', verified: true,
    headcount: 80, meal_times: ['12:00', '18:00', '21:00'],
    dietary_rules: [],
    accepted_categories: ['cooked', 'bakery', 'produce', 'packaged', 'dairy'],
    capacity_kg: 60, capacity_used_kg: 10,
    open_from: '08:00', open_to: '23:00',
    has_kitchen: true, has_refrigeration: false,
    need_today_kg: 35, accepting: true, language: 'en',
    meals_received: 891, image: null
  },
  {
    id: 7, name: 'Raat Ki Awaaz Night Shelter', type: 'night_shelter', tier: 3,
    lat: 25.2010, lng: 75.8220, address: 'Transport Nagar, Kota',
    contact_person: 'Mohan Das', contact: '+91 98761 77777',
    registration_id: 'RAJ-NS-2020-008', verified: true,
    headcount: 55, meal_times: ['20:00', '22:00'],
    dietary_rules: [],
    accepted_categories: ['cooked', 'bakery', 'packaged'],
    capacity_kg: 35, capacity_used_kg: 0,
    open_from: '18:00', open_to: '06:00',
    has_kitchen: false, has_refrigeration: false,
    need_today_kg: 25, accepting: true, language: 'hi',
    meals_received: 567, image: null
  },
  {
    id: 8, name: 'Kota Food Bank', type: 'food_bank', tier: 3,
    lat: 25.1880, lng: 75.8600, address: 'Sudha Colony, Kota',
    contact_person: 'Anita Verma', contact: '+91 98761 88888',
    registration_id: 'RAJ-FB-2019-003', verified: true,
    headcount: 120, meal_times: ['11:00', '17:00'],
    dietary_rules: [],
    accepted_categories: ['cooked', 'produce', 'packaged', 'dairy', 'bakery'],
    capacity_kg: 80, capacity_used_kg: 15,
    open_from: '09:00', open_to: '19:00',
    has_kitchen: true, has_refrigeration: true,
    need_today_kg: 50, accepting: true, language: 'en',
    meals_received: 1240, image: null
  },
];

export const DRIVERS = [
  {
    id: 1, name: 'Rahul Kumar', lat: 25.2100, lng: 75.8620,
    vehicle_capacity_kg: 50, has_cooler: false, available: true,
    rating: 4.8, phone: '+91 98762 11111',
    vehicle: 'Honda Activa (RJ-20-AA-1234)'
  },
  {
    id: 2, name: 'Priya Singh', lat: 25.1890, lng: 75.8440,
    vehicle_capacity_kg: 30, has_cooler: true, available: true,
    rating: 4.9, phone: '+91 98762 22222',
    vehicle: 'Scooty (RJ-20-BB-5678) + Cooler Box'
  },
  {
    id: 3, name: 'Mohammed Arif', lat: 25.2200, lng: 75.8580,
    vehicle_capacity_kg: 80, has_cooler: false, available: false,
    rating: 4.6, phone: '+91 98762 33333',
    vehicle: 'Tata Ace (RJ-20-CC-9012)'
  },
  {
    id: 4, name: 'Deepika Joshi', lat: 25.1950, lng: 75.8710,
    vehicle_capacity_kg: 25, has_cooler: false, available: true,
    rating: 4.7, phone: '+91 98762 44444',
    vehicle: 'TVS Jupiter (RJ-20-DD-3456)'
  },
];

// Status: posted | offered | matched | picked_up | delivered | expired | escalated
export const DONATIONS = [
  {
    id: 1, donor_id: 1, donor_name: 'Royal Spice Kitchen',
    description: 'Veg Dum Biryani', category: 'cooked',
    qty_kg: 12, est_meals: 24,
    dietary_tags: ['veg'], ready_at: '2026-09-24T17:00:00+05:30',
    expires_at: '2026-09-24T20:45:00+05:30',
    needs_cold_chain: false, packaging: 'Sealed containers',
    hygiene_checklist_done: true, status: 'offered',
    matched_recipient_id: 1, driver_id: null,
    photo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
    created_at: '2026-09-24T16:30:00+05:30'
  },
  {
    id: 2, donor_id: 3, donor_name: 'Allen Coaching Mess',
    description: 'Paneer Gravy & Dal Box', category: 'cooked',
    qty_kg: 18, est_meals: 36,
    dietary_tags: ['veg'], ready_at: '2026-09-24T17:30:00+05:30',
    expires_at: '2026-09-24T21:30:00+05:30',
    needs_cold_chain: false, packaging: 'Food-grade boxes',
    hygiene_checklist_done: true, status: 'offered',
    matched_recipient_id: null, driver_id: null,
    photo_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80',
    created_at: '2026-09-24T16:45:00+05:30'
  },
  {
    id: 3, donor_id: 2, donor_name: 'Shree Krishna Caterers',
    description: 'Assorted Buns & Sourdough', category: 'bakery',
    qty_kg: 8, est_meals: 40,
    dietary_tags: ['veg'], ready_at: '2026-09-24T16:00:00+05:30',
    expires_at: '2026-09-24T22:00:00+05:30',
    needs_cold_chain: false, packaging: 'Cardboard trays',
    hygiene_checklist_done: true, status: 'matched',
    matched_recipient_id: 2, driver_id: 4,
    photo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    created_at: '2026-09-24T15:45:00+05:30'
  },
  {
    id: 4, donor_id: 5, donor_name: 'Rajputana Hotel',
    description: 'Mutton Curry & Naan', category: 'cooked',
    qty_kg: 22, est_meals: 44,
    dietary_tags: ['non_veg'], ready_at: '2026-09-24T18:00:00+05:30',
    expires_at: '2026-09-24T22:00:00+05:30',
    needs_cold_chain: false, packaging: 'Catering trays',
    hygiene_checklist_done: true, status: 'posted',
    matched_recipient_id: null, driver_id: null,
    photo_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80',
    created_at: '2026-09-24T16:55:00+05:30'
  },
  // Historical deliveries (for dashboard stats)
  {
    id: 5, donor_id: 1, donor_name: 'Royal Spice Kitchen',
    description: 'Dal Makhani & Roti', category: 'cooked',
    qty_kg: 15, est_meals: 30,
    dietary_tags: ['veg'], ready_at: '2026-09-23T19:00:00+05:30',
    expires_at: '2026-09-23T23:00:00+05:30',
    needs_cold_chain: false, packaging: 'Sealed containers',
    hygiene_checklist_done: true, status: 'delivered',
    matched_recipient_id: 1, driver_id: 1,
    photo_url: null, created_at: '2026-09-23T18:30:00+05:30'
  },
  {
    id: 6, donor_id: 6, donor_name: 'IIT-JEE Campus Dining',
    description: 'Mixed Vegetable Curry & Rice', category: 'cooked',
    qty_kg: 35, est_meals: 70,
    dietary_tags: ['veg'], ready_at: '2026-09-23T20:00:00+05:30',
    expires_at: '2026-09-24T00:00:00+05:30',
    needs_cold_chain: false, packaging: 'Large containers',
    hygiene_checklist_done: true, status: 'delivered',
    matched_recipient_id: 4, driver_id: 2,
    photo_url: null, created_at: '2026-09-23T19:30:00+05:30'
  },
];

export const OFFERS = [
  {
    id: 1, donation_id: 2, recipient_id: 1,
    rank: 1, score: 0.91,
    score_breakdown: {
      proximity: 0.88, capacity_fit: 0.92, priority_tier: 1.0,
      time_slack: 0.85, need_today: 0.90, fairness: 0.80
    },
    explanation: ['Tier 1 priority (Old Age Home)', 'Pure Veg ✓ match', '2.1 km away', 'Capacity: 28 kg free'],
    sent_at: '2026-09-24T16:47:00+05:30',
    expires_at: '2026-09-24T16:47:30+05:30',
    response: 'pending'
  }
];

export const IMPACT_STATS = {
  meals_rescued: 12480,
  kg_diverted: 6240,
  co2e_avoided: 15600,
  children_fed: 4320,
  elderly_meals: 3218,
  institutions_served: 8,
  avg_match_time_min: 3.2,
  active_donors: 6,
  active_recipients: 8,
  active_drivers: 3,
  successful_rescues: 312,
  // 30-day chart data
  daily_meals: [280, 310, 295, 340, 380, 420, 390, 445, 410, 480, 520, 495, 540, 510, 570, 590, 545, 610, 650, 620, 680, 700, 660, 720, 750, 710, 780, 820, 795, 850],
  by_tier: [
    { tier: 'Tier 1 (Children & Elderly)', meals: 4320, kg: 2160, pct: 35 },
    { tier: 'Tier 2 (Govt Kitchens)', meals: 5000, kg: 2500, pct: 40 },
    { tier: 'Tier 3 (NGOs & Shelters)', meals: 3160, kg: 1580, pct: 25 },
  ],
  top_donors: [
    { name: 'Allen Coaching Mess', meals: 3240, kg: 1620 },
    { name: 'Rajputana Hotel', meals: 2100, kg: 1050 },
    { name: 'Royal Spice Kitchen', meals: 1980, kg: 990 },
    { name: 'IIT-JEE Campus Dining', meals: 1560, kg: 780 },
    { name: 'Shree Krishna Caterers', meals: 1200, kg: 600 },
  ],
  top_recipients: [
    { name: 'Annapurna Rasoi Ward 12', meals: 4219, tier: 2 },
    { name: 'Shishu Grih Child Care', meals: 3120, tier: 1 },
    { name: 'Govt Kitchen - Station', meals: 3102, tier: 2 },
    { name: 'Kota Food Bank', meals: 1240, tier: 3 },
  ]
};

// Pure matching engine
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const CATEGORY_MAX_HOURS = {
  cooked: 4, dairy: 3, produce: 6, bakery: 8, packaged: 48
};

export function getMaxSafeHours(category) {
  return CATEGORY_MAX_HOURS[category] ?? 4;
}

export function applyHardFilters(donation, recipient, driver, nowMs) {
  const expiresMs = new Date(donation.expires_at).getTime();
  const AVG_SPEED_KMPH = 20;
  const donorLat = DONORS.find(d => d.id === donation.donor_id)?.lat ?? 25.2;
  const donorLng = DONORS.find(d => d.id === donation.donor_id)?.lng ?? 75.86;

  // Filter 1: Recipient verified & accepting
  if (!recipient.verified || !recipient.accepting) return { ok: false, reason: 'Recipient not verified or not accepting' };

  // Filter 2: Capacity
  const freeCapacity = recipient.capacity_kg - recipient.capacity_used_kg;
  if (freeCapacity < donation.qty_kg * 0.8) return { ok: false, reason: 'Insufficient capacity' };

  // Filter 3: Category accepted
  if (!recipient.accepted_categories.includes(donation.category)) return { ok: false, reason: 'Category not accepted' };

  // Filter 4: Dietary rules
  if (recipient.dietary_rules.includes('veg_only') && donation.dietary_tags.includes('non_veg')) {
    return { ok: false, reason: 'Veg-only restriction — non-veg donation not routed' };
  }
  if (recipient.dietary_rules.includes('jain') && donation.dietary_tags.includes('non_veg')) {
    return { ok: false, reason: 'Jain dietary restriction' };
  }

  // Filter 5: Time window (now + ETA + 15 min buffer <= expires)
  const driverTodonorKm = haversineKm(driver?.lat ?? donorLat, driver?.lng ?? donorLng, donorLat, donorLng);
  const donorToRecipKm = haversineKm(donorLat, donorLng, recipient.lat, recipient.lng);
  const etaHours = (driverTodonorKm + donorToRecipKm) / AVG_SPEED_KMPH;
  const arrivalMs = nowMs + etaHours * 3600000 + 15 * 60000;
  if (arrivalMs >= expiresMs) return { ok: false, reason: 'Food would expire before delivery' };

  // Filter 6: Cold chain
  if (donation.needs_cold_chain && !recipient.has_refrigeration) return { ok: false, reason: 'Cold chain required but recipient lacks refrigeration' };
  if (donation.needs_cold_chain && driver && !driver.has_cooler) return { ok: false, reason: 'Cold chain required but driver has no cooler' };

  // Filter 7: Open hours
  const arrivalTime = new Date(arrivalMs);
  const arrHH = arrivalTime.getHours();
  const arrMM = arrivalTime.getMinutes();
  const openHH = parseInt(recipient.open_from.split(':')[0]);
  const closeHH = parseInt(recipient.open_to.split(':')[0]);
  // Handle overnight (e.g. night shelter 18:00 - 06:00)
  if (openHH < closeHH) {
    if (arrHH < openHH || arrHH >= closeHH) return { ok: false, reason: 'Recipient not open at estimated arrival' };
  }

  return { ok: true, reason: null, etaHours, distanceKm: donorToRecipKm };
}

export function scoreCandidate(donation, recipient, driver, nowMs) {
  const MAX_RADIUS_KM = 15;
  const donorLat = DONORS.find(d => d.id === donation.donor_id)?.lat ?? 25.2;
  const donorLng = DONORS.find(d => d.id === donation.donor_id)?.lng ?? 75.86;
  const distKm = haversineKm(donorLat, donorLng, recipient.lat, recipient.lng);

  const proximity = Math.max(0, 1 - distKm / MAX_RADIUS_KM);
  const freeCapacity = recipient.capacity_kg - recipient.capacity_used_kg;
  const capacityFit = Math.min(1, donation.qty_kg / Math.max(1, freeCapacity));
  const priorityTier = recipient.tier === 1 ? 1.0 : recipient.tier === 2 ? 0.8 : recipient.tier === 3 ? 0.5 : 0.1;
  const expiresMs = new Date(donation.expires_at).getTime();
  const totalWindow = getMaxSafeHours(donation.category) * 3600000;
  const timeSlack = Math.max(0, Math.min(1, (expiresMs - nowMs) / totalWindow));
  const needToday = recipient.need_today_kg > 0 ? Math.min(1, donation.qty_kg / recipient.need_today_kg) : 0.5;
  const fairness = Math.max(0, 1 - recipient.meals_received / 5000);

  const score = 0.30 * proximity + 0.20 * capacityFit + 0.20 * priorityTier
              + 0.15 * timeSlack + 0.10 * needToday + 0.05 * fairness;

  const breakdown = { proximity, capacityFit, priorityTier, timeSlack, needToday, fairness };
  const explanation = buildExplanation(recipient, distKm, donation);

  return { score, breakdown, explanation, distanceKm: distKm };
}

function buildExplanation(recipient, distKm, donation) {
  const chips = [];
  const tierLabels = { 1: 'Tier 1 Priority', 2: 'Tier 2 Partner', 3: 'NGO/Shelter' };
  chips.push(tierLabels[recipient.tier] ?? 'Partner');

  if (recipient.dietary_rules.includes('veg_only')) {
    chips.push('Veg-only ✓');
  } else {
    chips.push('Any dietary ✓');
  }

  chips.push(`${distKm.toFixed(1)} km away`);

  const freeCapacity = recipient.capacity_kg - recipient.capacity_used_kg;
  chips.push(`${freeCapacity} kg capacity free`);

  if (recipient.need_today_kg > 0) {
    chips.push(`Needs ${recipient.need_today_kg} kg tonight`);
  }

  return chips;
}

export function matchDonation(donation, nowMs = Date.now()) {
  const feasible = [];

  for (const recipient of RECIPIENTS) {
    // Find best available driver for this pair
    const availableDrivers = DRIVERS.filter(d => d.available);
    let bestDriver = null;
    let bestEta = Infinity;

    const donorLat = DONORS.find(d => d.id === donation.donor_id)?.lat ?? 25.2;
    const donorLng = DONORS.find(d => d.id === donation.donor_id)?.lng ?? 75.86;

    for (const driver of availableDrivers) {
      const driverDist = haversineKm(driver.lat, driver.lng, donorLat, donorLng);
      const deliveryDist = haversineKm(donorLat, donorLng, recipient.lat, recipient.lng);
      const eta = (driverDist + deliveryDist) / 20; // hours at 20 km/h
      if (eta < bestEta) { bestEta = eta; bestDriver = driver; }
    }

    const check = applyHardFilters(donation, recipient, bestDriver, nowMs);
    if (check.ok) {
      const scoring = scoreCandidate(donation, recipient, bestDriver, nowMs);
      feasible.push({ recipient, driver: bestDriver, ...scoring });
    }
  }

  if (feasible.length === 0) return { status: 'escalate', candidates: [] };

  const ranked = feasible.sort((a, b) => b.score - a.score);
  return { status: 'ok', candidates: ranked };
}
