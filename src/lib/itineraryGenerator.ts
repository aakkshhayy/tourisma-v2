import type { TouristPlace, Itinerary, ItineraryDay, CostBreakdown, ItineraryOptions, JourneyLeg, ModeOption } from '@/lib/types';
import { getOriginById } from '@/lib/origins';

const STATE_ORDER: Record<string, number> = {
  ladakh: 1,
  jammu_kashmir: 2,
  himachal_pradesh: 3,
  punjab: 4,
  haryana: 5,
  delhi: 6,
  uttarakhand: 7,
  uttar_pradesh: 8,
  rajasthan: 9,
  sikkim: 10,
  arunachal_pradesh: 11,
  assam: 12,
  meghalaya: 13,
  manipur: 14,
  nagaland: 15,
  mizoram: 16,
  tripura: 17,
  west_bengal: 18,
  jharkhand: 19,
  bihar: 20,
  madhya_pradesh: 21,
  chhattisgarh: 22,
  gujarat: 23,
  maharashtra: 24,
  goa: 25,
  odisha: 26,
  telangana: 27,
  andhra_pradesh: 28,
  karnataka: 29,
  tamil_nadu: 30,
  puducherry: 31,
  kerala: 32,
  lakshadweep: 33,
  andaman_nicobar: 34,
};

function clusterPlaces(
  places: TouristPlace[],
  origin?: { coordinates: { lat: number; lng: number } },
): TouristPlace[][] {
  const byState: Record<string, TouristPlace[]> = {};
  for (const p of places) {
    if (!byState[p.state]) byState[p.state] = [];
    byState[p.state].push(p);
  }

  // Origin-aware ordering: sort clusters by their nearest place to origin.
  // Within a cluster, use greedy nearest-neighbour from the closest entry point.
  if (origin) {
    const stateIds = Object.keys(byState);
    const minDistByState: Record<string, number> = {};
    for (const sid of stateIds) {
      minDistByState[sid] = Math.min(
        ...byState[sid].map(p => haversineKm(p.coordinates, origin.coordinates)),
      );
    }
    stateIds.sort((a, b) => minDistByState[a] - minDistByState[b]);

    let prevCoords = origin.coordinates;
    return stateIds.map(sid => {
      const cluster = [...byState[sid]];
      const ordered: TouristPlace[] = [];
      while (cluster.length) {
        let bestIdx = 0;
        let bestDist = haversineKm(cluster[0].coordinates, prevCoords);
        for (let i = 1; i < cluster.length; i++) {
          const d = haversineKm(cluster[i].coordinates, prevCoords);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        const [picked] = cluster.splice(bestIdx, 1);
        ordered.push(picked);
        prevCoords = picked.coordinates;
      }
      return ordered;
    });
  }

  // Fallback: static geographic state order (no origin)
  const sortedStates = Object.keys(byState).sort(
    (a, b) => (STATE_ORDER[a] ?? 99) - (STATE_ORDER[b] ?? 99)
  );
  return sortedStates.map(s => byState[s]);
}

// ─── TRIP-TYPE-AWARE DAY NOTE BUILDERS ───────────────────────────────────────

function buildArrivalNote(place: TouristPlace, tripType: ItineraryOptions['tripType']): string {
  const n = place.name;
  switch (tripType) {
    case 'honeymoon':
      return `Arrive at ${n} and settle into your retreat. Freshen up and head for a sunset walk together — your escape begins here. 🌅`;
    case 'pilgrimage':
      return `Arrive at ${n}. Check in and rest before the evening prayer or aarti. Begin your journey with a calm, reflective mind.`;
    case 'family':
      return `Arrive at ${n}. Let everyone settle in — a gentle stroll or the nearest park is the perfect easy first evening.`;
    case 'solo':
      return `Arrive at ${n}. Drop your bags, say hello to fellow travellers at the hostel, and take a solo wander to get your bearings. The city is yours.`;
    case 'friends':
      return `You've made it to ${n}! Check in, freshen up, and kick off the trip with a group dinner — find the best local food street tonight. 🎉`;
    default:
      return `Arrive at ${n}. Check in and spend the evening at leisure — explore the area and acclimatize.`;
  }
}

function buildTransitionNote(from: TouristPlace, to: TouristPlace, tripType: ItineraryOptions['tripType']): string {
  const interState = from.state !== to.state;
  const base = interState
    ? `Travel from ${from.name} to ${to.name} — an inter-state journey. `
    : `Travel from ${from.name} to ${to.name}. `;
  switch (tripType) {
    case 'honeymoon':
      return base + `A travel day is still a date — pack snacks, plan a scenic stop, and enjoy the journey together.`;
    case 'pilgrimage':
      return base + `Travel with gratitude — each leg brings you closer. Arrive, settle, and rest for tomorrow's darshan.`;
    case 'family':
      return base + `Let the kids window-watch and snack — travel days are adventures too. Keep the evening light after check-in.`;
    case 'solo':
      return base + `A great day to journal, listen to music, and reflect on the last stop before diving into the next.`;
    case 'friends':
      return base + `Road-trip energy guaranteed! Arrive, freshen up, and hit the streets for a first-night exploration.`;
    default:
      return base + `Arrive and check in. Take the rest of the day to settle in and explore nearby.`;
  }
}

function buildExplorationNote(place: TouristPlace, dayInPlace: number, totalDaysHere: number, tripType: ItineraryOptions['tripType']): string {
  const activities = place.highlights.slice((dayInPlace - 1) * 2, (dayInPlace - 1) * 2 + 2);
  const isLastDay = dayInPlace === totalDaysHere && totalDaysHere > 1;

  const base = activities.length > 0
    ? `Day ${dayInPlace} at ${place.name} — explore ${activities.join(' and ')}`
    : `Day ${dayInPlace} at ${place.name} — continue discovering local highlights and hidden gems`;

  if (isLastDay) {
    switch (tripType) {
      case 'honeymoon':
        return base + `. Your last evening here — book a candlelit dinner or rooftop experience. 💫`;
      case 'pilgrimage':
        return base + `. Final day at this sacred site — attend the morning prayers and offer your last respects before departing.`;
      case 'family':
        return base + `. Last day here — let the kids pick one activity. Pack bags in the evening for the next leg.`;
      case 'solo':
        return base + `. Last day here — catch anything you missed and write a few thoughts before moving on.`;
      case 'friends':
        return base + `. Last day together here — do the one thing you haven't done yet. Pack up and prep for tomorrow.`;
      default:
        return base + `. Last full day here — use it to visit anything you may have missed.`;
    }
  }
  return base + '.';
}

// ─── DAY DISTRIBUTION ────────────────────────────────────────────────────────
// Distributes numDays across places proportionally to recommendedDays.
// Guarantees each place gets ≥1 day; expands / compresses to hit numDays exactly.
// Unlike the old schedule-index approach, this never repeats the same day note.

function distributeIntodays(clusters: TouristPlace[][], numDays: number, options: ItineraryOptions): ItineraryDay[] {
  const allPlaces = clusters.flat();
  if (allPlaces.length === 0) return [];

  // Start from each place's recommendedDays (minimum 1)
  const daysPerPlace = allPlaces.map(p => Math.max(1, p.recommendedDays));
  let totalAssigned = daysPerPlace.reduce((s, d) => s + d, 0);

  // Expand: give extra days to the place that can best absorb them
  while (totalAssigned < numDays) {
    let bestIdx = 0, bestScore = -Infinity;
    for (let i = 0; i < allPlaces.length; i++) {
      const score = allPlaces[i].recommendedDays - daysPerPlace[i] * 0.6;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    daysPerPlace[bestIdx]++;
    totalAssigned++;
  }

  // Compress: trim days from places with the most excess first (keep ≥1 each)
  while (totalAssigned > numDays) {
    let worstIdx = -1, worstExcess = -Infinity;
    for (let i = 0; i < allPlaces.length; i++) {
      if (daysPerPlace[i] <= 1) continue;
      const excess = daysPerPlace[i] - allPlaces[i].recommendedDays;
      if (excess > worstExcess) { worstExcess = excess; worstIdx = i; }
    }
    if (worstIdx < 0) break;
    daysPerPlace[worstIdx]--;
    totalAssigned--;
  }

  // Build day-by-day entries with trip-type-aware notes
  const days: ItineraryDay[] = [];
  let dayNum = 1;

  for (let pi = 0; pi < allPlaces.length; pi++) {
    const place = allPlaces[pi];
    const prevPlace = pi > 0 ? allPlaces[pi - 1] : null;
    const daysHere = daysPerPlace[pi];

    for (let d = 1; d <= daysHere; d++) {
      let travelNote: string;

      if (dayNum === 1) {
        travelNote = buildArrivalNote(place, options.tripType);
      } else if (d === 1 && prevPlace) {
        travelNote = buildTransitionNote(prevPlace, place, options.tripType);
      } else {
        travelNote = buildExplorationNote(place, d, daysHere, options.tripType);
      }

      days.push({ day: dayNum, places: [place], travelNote, estimatedTravelCost: 0 });
      dayNum++;
    }
  }

  return days;
}

function formatState(stateId: string): string {
  return stateId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── JOURNEY ROUTING ─────────────────────────────────────────────────────────
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(h)));
}

interface ModeProfile {
  mode: 'train' | 'bus' | 'cab' | 'flight';
  speedKmph: number;
  perKm: number;
  base: number;
  bufferHours: number;
}

const MODE_PROFILES: Record<string, ModeProfile> = {
  train:  { mode: 'train',  speedKmph: 55, perKm: 2.2, base: 60,   bufferHours: 0.5 },
  bus:    { mode: 'bus',    speedKmph: 42, perKm: 2.5, base: 50,   bufferHours: 0.3 },
  cab:    { mode: 'cab',    speedKmph: 50, perKm: 14,  base: 0,    bufferHours: 0.2 },
  flight: { mode: 'flight', speedKmph: 700, perKm: 4.5, base: 2200, bufferHours: 2.5 },
};

// Road-distance approximation: India's road network has ~25-30% detour vs straight line
const ROAD_FACTOR = 1.28;

// Tier travel-cost multipliers (sleeper vs AC vs premium classes)
const TIER_TRAVEL_MULT: Record<ItineraryOptions['stayType'], number> = {
  budget: 0.8,    // sleeper class trains, non-AC bus, shared cab
  mid: 1.0,       // 3AC trains, AC bus, normal cab
  luxury: 1.45,   // 1AC / business class, premium cab, executive flights
};

// Compute every viable mode for a leg so users can compare cost vs time.
function computeAllOptions(straightKm: number, tier: ItineraryOptions['stayType']): ModeOption[] {
  const mult = TIER_TRAVEL_MULT[tier];
  const opts: ModeOption[] = [];
  const make = (modeKey: keyof typeof MODE_PROFILES, distance: number): ModeOption => {
    const p = MODE_PROFILES[modeKey];
    return {
      mode: p.mode,
      distanceKm: Math.round(distance),
      durationHours: +(distance / p.speedKmph + p.bufferHours).toFixed(1),
      cost: Math.round((p.base + distance * p.perKm) * mult),
    };
  };
  // Train: feasible for any distance up to ~2500km
  opts.push(make('train', straightKm * ROAD_FACTOR));
  // Bus: feasible up to ~1200km (anything longer is impractical overnight)
  if (straightKm <= 1200) opts.push(make('bus', straightKm * ROAD_FACTOR));
  // Cab: feasible up to ~600km
  if (straightKm <= 600) opts.push(make('cab', straightKm * ROAD_FACTOR));
  // Flight: only worthwhile above 250km straight-line
  if (straightKm >= 250) opts.push(make('flight', straightKm));
  return opts;
}

function pickSelectedOption(
  options: ModeOption[],
  strategy: ItineraryOptions['optimisation'],
  preferred: ItineraryOptions['travelMode'],
  straightKm: number,
): ModeOption {
  if (strategy === 'cost') {
    return options.reduce((a, b) => (a.cost <= b.cost ? a : b));
  }
  if (strategy === 'time') {
    return options.reduce((a, b) => (a.durationHours <= b.durationHours ? a : b));
  }
  // Balanced: respect user's preferred mode but auto-upgrade to flight for very long
  if (straightKm > 1100) {
    return options.find(o => o.mode === 'flight') ?? options[0];
  }
  if (preferred === 'cab' && straightKm > 600) {
    return options.find(o => o.mode === 'train') ?? options[0];
  }
  return options.find(o => o.mode === preferred) ?? options[0];
}

function computeLeg(
  fromName: string,
  fromCoords: { lat: number; lng: number },
  toName: string,
  toCoords: { lat: number; lng: number },
  options: ItineraryOptions,
  isReturn: boolean = false,
): JourneyLeg {
  const straightKm = haversineKm(fromCoords, toCoords);
  const allOptions = computeAllOptions(straightKm, options.stayType);
  const selected = pickSelectedOption(allOptions, options.optimisation, options.travelMode, straightKm);

  return {
    from: fromName,
    to: toName,
    fromCoords,
    toCoords,
    distanceKm: selected.distanceKm,
    durationHours: selected.durationHours,
    cost: selected.cost,
    mode: selected.mode,
    options: allOptions,
    isReturn,
  };
}

function buildJourney(
  origin: { name: string; coordinates: { lat: number; lng: number } } | undefined,
  routePlaces: TouristPlace[],
  options: ItineraryOptions,
): JourneyLeg[] {
  if (routePlaces.length === 0) return [];
  const legs: JourneyLeg[] = [];

  if (origin) {
    legs.push(computeLeg(origin.name, origin.coordinates, routePlaces[0].name, routePlaces[0].coordinates, options));
  }

  for (let i = 0; i < routePlaces.length - 1; i++) {
    const a = routePlaces[i];
    const b = routePlaces[i + 1];
    legs.push(computeLeg(a.name, a.coordinates, b.name, b.coordinates, options));
  }

  if (origin && routePlaces.length > 0) {
    const last = routePlaces[routePlaces.length - 1];
    legs.push(computeLeg(last.name, last.coordinates, origin.name, origin.coordinates, options, true));
  }

  return legs;
}

// ─── COST ────────────────────────────────────────────────────────────────────
function computeCosts(days: ItineraryDay[], journey: JourneyLeg[], options: ItineraryOptions): CostBreakdown {
  const { stayType, groupSize } = options;
  const stayMultiplier = stayType === 'budget' ? 0 : stayType === 'mid' ? 1 : 2;

  let stay = 0;
  let food = 0;
  let entry = 0;

  for (const day of days) {
    for (const place of day.places) {
      const stayOpt = place.stayOptions[stayMultiplier] ?? place.stayOptions[0];
      stay += stayOpt.costPerNight;
      food += place.foodCostPerDay;
      entry += place.entryFee;
    }
  }

  const journeyTravel = journey.reduce((sum, l) => sum + l.cost, 0);

  const rooms = Math.ceil(groupSize / 2);
  const scaledStay = stay * rooms;
  const scaledFood = food * groupSize;
  // Flights are per-person; ground modes are typically shared by ~4
  const scaledTravel = journey.reduce((sum, l) => {
    if (l.mode === 'flight') return sum + l.cost * groupSize;
    return sum + l.cost * Math.ceil(groupSize / 4);
  }, 0) || journeyTravel;

  const misc = Math.round((scaledStay + scaledFood + scaledTravel) * 0.08);

  return {
    travel: scaledTravel,
    stay: scaledStay,
    food: scaledFood,
    entry: entry * groupSize,
    miscellaneous: misc,
    total: scaledStay + scaledFood + scaledTravel + entry * groupSize + misc,
  };
}

// ─── DYNAMIC TIPS ────────────────────────────────────────────────────────────
// Tips are generated based on the actual states, places, categories, trip
// shape and origin so each itinerary surfaces what's actually relevant.

const STATE_TIPS: Record<string, string> = {
  sikkim: 'Carry your photo ID + 2 passport photos for the Inner Line Permit (ILP) needed for Tsomgo Lake, Nathula, Lachung & Yumthang — issued in Gangtok or online via the Sikkim Tourism portal.',
  himachal_pradesh: 'Mountain weather flips fast — pack warm layers + a windproof shell even in summer, and watch for landslide road closures during late-monsoon (Aug–Sep).',
  kerala: 'Houseboat rates in Alleppey are highest Dec–Jan; book 2–3 weeks ahead for the best deck-cabin boats. Carry mosquito repellent for backwater nights.',
  goa: 'North Goa = parties & flea markets, South Goa = quiet beaches. Most beach shacks shut down May–Sep monsoon. Pre-book taxis or rent a scooter — public transport is limited.',
  tamil_nadu: 'Temples here have a strict dress code — covered shoulders & knees, leave footwear outside, and most inner sanctums prohibit phones/cameras.',
  karnataka: 'Coorg & Chikmagalur roads are narrow and twisty; ride/drive only in daylight. Hampi: hire a local guide or use a bicycle/electric vehicle to cover the boulder-strewn ruins.',
  maharashtra: 'Mumbai locals are cashless-friendly but carry small notes for taxis. Skip Mumbai → hill-station travel during peak monsoon weekends — traffic + landslides on the Western Ghats.',
  west_bengal: 'Darjeeling toy train is iconic but books out — reserve the joy ride from Darjeeling–Ghoom 4–6 weeks ahead via IRCTC.',
  bihar: 'Bodh Gaya & Nalanda are relaxed but go quiet by sunset. Carry your own water and modest clothing for the Mahabodhi Temple complex.',
  gujarat: 'Gujarat is officially dry — alcohol requires a permit purchased in-state for tourists. The Rann of Kutch is best Nov–Feb during the Rann Utsav.',
  assam: 'Kaziranga safaris must be pre-booked through forest department portal; jeep slots fill weeks in advance Nov–Feb. Carry warm clothes for misty morning rides.',
  meghalaya: 'Living-root-bridge trails (Cherrapunji, Mawlynnong) involve 3,000+ stair steps — start before 9 am to beat heat & afternoon rain. Cash is preferred outside Shillong.',
  manipur: 'Foreign nationals need RAP/PAP; Indian visitors only need ID. Loktak Lake homestays book out fast in winter — confirm bookings 2 weeks ahead.',
  mizoram: 'Inner Line Permit required for non-Mizos — issued at Aizawl Airport on arrival or online. Sundays = most shops & restaurants closed (Christian state).',
  jharkhand: 'Parasnath Hill (Shikharji) parikrama starts at 4 am — wear non-leather footwear, carry water; the 27-km loop takes most pilgrims 8–10 hrs.',
  chhattisgarh: 'Chitrakote Falls are spectacular Aug–Oct (post-monsoon) but the road from Jagdalpur is rough — hire an SUV, not a sedan.',
  haryana: 'Surajkund Mela (Feb) and Kurukshetra Gita Mahotsav (Dec) are the best times to visit — otherwise plan as a 1–2 day add-on around Delhi.',
  andhra_pradesh: 'Visakhapatnam beaches are fine to walk but currents are strong — swim only in flag-marked zones with lifeguards.',
  telangana: 'Hyderabad biryani is iconic but spicy — try the dum biryani at Paradise/Bawarchi/Shadab and ask for "less spicy" if needed. Charminar area gets choked after 6 pm.',
  rajasthan: 'Summers (Apr–Jun) are brutal at 40 °C+; visit Oct–Mar. Carry strong sunscreen, hats, and electrolytes. Bargain at bazaars but respect monument-photography rules.',
  uttar_pradesh: 'The Taj Mahal is closed on Fridays and night-viewing is only on full-moon days (5-day window) — book the night ticket 1 day in advance via the ASI website.',
  uttarakhand: 'Char Dham yatra (Yamunotri/Gangotri/Kedarnath/Badrinath) requires online registration via badrinath-kedarnath.gov.in — slots fill 2 months ahead.',
  madhya_pradesh: 'Tiger reserves close mid-Jul to mid-Oct (monsoon). Pre-book Tala Zone (Bandhavgarh) and Tala/Mukki (Kanha) on mptourism.com 90 days ahead — last-minute bookings rarely work.',
  odisha: 'The Jagannath Temple at Puri only allows Hindus inside — non-Hindus can view from the Raghunandan Library opposite. Rath Yatra (Jun/Jul) brings 1 million+ pilgrims.',
  punjab: 'At the Golden Temple, cover your head (cloths provided), wash your feet at the entry, and dress modestly. Langar runs 24×7 — silent, respectful queues only.',
  tripura: 'Reach via flight to Agartala or train through Assam (12+ hours). Most attractions are spread out; rent a private car for the 4-day Agartala–Unakoti–Neermahal loop.',
  nagaland: 'Inner Line Permit required for non-Nagas — issued online or at airport on arrival. Hornbill Festival (Dec 1–10) inflates Kohima hotel rates 4x; book 6+ months ahead.',
  arunachal_pradesh: 'Inner Line Permit required (online via arunachalilp.com). Tawang/Bomdila are accessible only Mar–Oct; Sela Pass closes by snow Nov–Feb. Check the daily road status.',
  delhi: 'Delhi summers (Apr–Jun) hit 45 °C; winters (Dec–Jan) drop to 4 °C with smog (AQI 300+). Pre-book Akshardham slots online; phones/cameras/bags banned inside.',
  jammu_kashmir: 'Photographing army convoys, bridges or border posts is prohibited. The Srinagar–Leh highway is open only Jun–Oct (Zoji La snow). Carry aadhaar; mobile data sometimes limited.',
  ladakh: 'Acclimatise in Leh for at least 24–48 hrs before going to Pangong/Nubra (4,000m+). Carry Diamox + ORS, drink 4L water/day. Inner Line Permits needed for restricted areas.',
  andaman_nicobar: 'Inter-island ferries (Makruzz, Green Ocean) book out 2 weeks ahead in peak season. Snorkel/scuba is Oct–May; the monsoon (Jun–Sep) shuts most water activities.',
  lakshadweep: 'Visitor Permit required for all (apply via Lakshadweep Tourism, takes 15+ days). Only some islands allow tourists — Bangaram & Agatti are the easiest non-Indian-resident-friendly entries.',
  puducherry: 'White Town parking is restrictive — leave car at hotel and walk/cycle. Sri Aurobindo Ashram requires advance booking for the meditation hall; closed on Sundays.',
};

const PLACE_TIPS: Record<string, string> = {
  ap_tirupati: 'Book Tirupati Darshan online via the TTD website (₹300 Special Entry Darshan) at least 2–3 weeks in advance — walk-in queues can be 8–12 hours.',
  wb_sundarbans: 'Sundarbans requires a 2-night package tour that bundles the boat, forest permit, and accommodation — self-navigation is not allowed for safety reasons.',
  sk_lachung: 'Lachung & Yumthang Valley need a separate Protected Area Permit (PAP); arrange via your Gangtok hotel/operator at least 1 day before.',
  mh_ajanta: 'Ajanta Caves are closed on Mondays. Hire a torch + an ASI-licensed guide at the entry gate — the cave paintings are dim and unguided visits miss most of the iconography.',
  mh_ellora: 'Ellora is closed on Tuesdays. Don\'t miss Cave 16 (Kailasa Temple) — start there before tour buses arrive (~10 am).',
  ka_hampi: 'Hampi is best explored over 2 days — sacred centre + royal centre. Sunrise at Matanga Hill or Hemakuta Hill is unmissable.',
  tn_madurai: 'Meenakshi Temple has 4 entry gates with different queues — the south gate is usually fastest. Phones/cameras must be deposited at the cloakroom.',
  tn_thanjavur: 'Brihadeeswara Temple opens 6 am–12:30 pm, then 4–8:30 pm. Visit in early morning to photograph the 1,000-year-old vimana without crowds.',
  kl_alleppey: 'Choose a single-bedroom houseboat (1BR) for couples, 2BR-deluxe for families. Cruises run 12 noon → 9 am — confirm AC operation hours.',
  hp_spiti: 'Spiti Valley is a high-altitude desert (3,800m+) — acclimatise in Kalpa or Kaza for a day before pushing higher. Some passes (Kunzum La, Rohtang) close Oct–May.',
  hp_bir_billing: 'Tandem paragliding flights run Oct–Jun; cancellations are common in cloudy weather. Confirm same-morning with your operator.',
  gj_rann: 'The White Rann is at its full white-salt-desert glory only Nov–Feb (Rann Utsav). Outside this window, the marshes flood and access is restricted.',
  gj_gir: 'Gir National Park lion safaris are limited to ~30 jeeps per slot — book online via gujaratforest.org 60 days ahead, especially weekends.',
  as_kaziranga: 'Kaziranga elephant safaris (5:30 am) are limited — pre-book; jeep safaris are easier walk-in. Park closed mid-Apr to mid-Oct (monsoon).',
  ka_belur_halebidu: 'Belur & Halebidu are 16 km apart — combine in one day. The Hoysala carvings reward a guide; one is available at the temple gate.',
  cg_chitrakote: 'Chitrakote Falls coracle rides at the base operate only when water level is moderate — don\'t expect them at the monsoon peak (Aug).',
};

const CATEGORY_TIPS: Record<string, string> = {
  hill_station: 'Pack thermals + a windproof jacket — even summer evenings drop below 10 °C in most Indian hill stations.',
  beach: 'Carry reef-safe sunscreen, a rashguard, and avoid swimming in unpatrolled waters — currents are stronger than they look.',
  religious: 'Most temples require modest dress (covered shoulders & knees) and shoes-off; phones/cameras are banned in many inner sanctums.',
  wildlife: 'Wildlife safaris must be booked online via the state forest portal — same-day walk-ins rarely work in peak season.',
  heritage: 'Most ASI monuments are closed one day a week (often Friday or Monday) — check before you arrive.',
  nature: 'Network coverage drops fast outside towns — download offline maps and tell someone your day plan if trekking.',
  cultural: 'Take a local food walk in the old quarter — it\'s the fastest way to absorb a city\'s culture without museum fatigue.',
};

const ORIGIN_LATITUDE_TIPS: Array<{ test: (lat: number) => boolean; tip: string }> = [
  {
    test: lat => lat < 16,
    tip: 'Coming from south India? Pack actual cold-weather clothing if you\'re heading to the Himalayas — even "warm jacket" rentals at hill stations run 8–12 °C light.',
  },
  {
    test: lat => lat > 26,
    tip: 'Coming from the north? Pack lightweight cottons + good sandals for the south — humidity is higher than Delhi summers even in "cool" months.',
  },
];

function buildTips(places: TouristPlace[], options: ItineraryOptions, totalDistanceKm: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (t: string) => { if (!seen.has(t)) { seen.add(t); out.push(t); } };

  const states = [...new Set(places.map(p => p.state))];
  const categories = [...new Set(places.map(p => p.category))];
  const placeIds = new Set(places.map(p => p.id));

  // 1. Place-specific (highest priority, most actionable)
  for (const id of placeIds) {
    const t = PLACE_TIPS[id];
    if (t) push(t);
  }

  // 2. State-specific
  for (const s of states) {
    const t = STATE_TIPS[s];
    if (t) push(t);
  }

  // 3. Trip-shape
  if (places.length >= 3 && totalDistanceKm > 1500) {
    push('You\'re covering 1,500+ km — book inter-city trains 3+ weeks ahead (Rajdhani/Shatabdi/Vande Bharat fill out fastest) and consider one flight leg to save 8–10 hours.');
  }
  if (options.numDays >= 7) {
    push('Trips longer than a week: pack a packable laundry kit + book 1 rest day in the middle — back-to-back travel days lead to fatigue and cancelled plans.');
  }
  if (options.groupSize >= 6) {
    push('Group of 6+: book a private tempo-traveller for inter-city legs (₹15–20/km) instead of multiple cabs — cheaper, single-vehicle, and smoother for luggage.');
  }
  if (options.groupSize === 1) {
    push('Solo? Hostels in India are excellent and social — Zostel & The Hosteller have outposts in most tourist towns at ₹500–900 a night.');
  }

  // 4. Category-specific
  for (const c of categories) {
    const t = CATEGORY_TIPS[c];
    if (t) push(t);
  }

  // 5. Trip-type specific
  const TRIP_TYPE_TIPS: Partial<Record<ItineraryOptions['tripType'], string>> = {
    honeymoon: 'Book couple-specific experiences 2–3 weeks ahead — private houseboat cabins, rooftop dinners, and sunset cruises sell out fast in peak season.',
    pilgrimage: 'Carry a government-issued photo ID, ₹2,000 cash for offerings/prasad, and wear modest easy-to-remove footwear — temple dress codes are strictly enforced.',
    family: 'Children under 5 enter most ASI monuments and national park safaris free — carry their birth certificate or Aadhaar for age verification at entry points.',
    solo: 'Share your daily plan with someone back home each morning — stay at hostels (Zostel, The Hosteller) for a built-in safety net and social circle on the road.',
    friends: 'Use Splitwise or Google Pay group expenses from day one — group travel always generates shared costs and a few awkward conversations if untracked.',
  };
  const typeT = TRIP_TYPE_TIPS[options.tripType];
  if (typeT) push(typeT);

  // 6. Origin-aware
  const origin = getOriginById(options.originCityId);
  if (origin) {
    for (const r of ORIGIN_LATITUDE_TIPS) {
      if (r.test(origin.coordinates.lat)) { push(r.tip); break; }
    }
  }

  // 7. Always-relevant fallback (only if we somehow have <3 tips)
  if (out.length < 3) {
    push('Carry a power bank, a copy of your government photo ID (digital + printed), and ₹2–3,000 in cash — UPI works almost everywhere but rural fuel pumps & temples often need cash.');
  }

  // Cap to 6 tips so the list stays scannable
  return out.slice(0, 6);
}

// Suggest an ideal trip duration given the selected destinations.
// Roughly: sum of recommendedDays per place, plus 1 buffer day per
// inter-state transition, capped at a sane minimum/maximum.
export function getRecommendedDays(places: TouristPlace[]): number {
  if (places.length === 0) return 0;
  const placeDays = places.reduce((s, p) => s + Math.max(1, p.recommendedDays), 0);
  const states = new Set(places.map(p => p.state));
  const transitionBuffer = Math.max(0, states.size - 1);
  return Math.min(21, Math.max(2, placeDays + transitionBuffer));
}

export function generateItinerary(places: TouristPlace[], options: ItineraryOptions): Itinerary {
  const origin = getOriginById(options.originCityId);
  const clusters = clusterPlaces(places, origin);
  const days = distributeIntodays(clusters, options.numDays, options);
  const routePlaces: TouristPlace[] = [];
  const seen = new Set<string>();
  for (const d of days) {
    for (const p of d.places) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        routePlaces.push(p);
      }
    }
  }

  const journey = buildJourney(origin, routePlaces, options);

  // Annotate each day with the cost of travelling INTO that place
  // journey legs sequence: [origin→p1, p1→p2, ..., p(n-1)→pn, pn→origin?]
  // Day 1 = origin → p1 (leg 0); day with first new place uses next leg
  let legCursor = 0;
  let prevPlaceId: string | null = null;
  for (let i = 0; i < days.length; i++) {
    const dayPlaceId = days[i].places[0].id;
    if (i === 0) {
      days[i].estimatedTravelCost = journey[legCursor]?.cost ?? 0;
      if (origin) legCursor++;
    } else if (prevPlaceId && prevPlaceId !== dayPlaceId) {
      days[i].estimatedTravelCost = journey[legCursor]?.cost ?? 0;
      legCursor++;
    } else {
      days[i].estimatedTravelCost = 0;
    }
    prevPlaceId = dayPlaceId;
  }

  const costs = computeCosts(days, journey, options);
  const route = routePlaces.map(p => p.name);

  const totalDistanceKm = journey.reduce((s, l) => s + l.distanceKm, 0);
  const totalTravelHours = +(journey.reduce((s, l) => s + l.durationHours, 0).toFixed(1));

  const tips = buildTips(places, options, totalDistanceKm);

  return { days, totalEstimatedCost: costs, route, tips, journey, totalDistanceKm, totalTravelHours, optimisation: options.optimisation };
}
