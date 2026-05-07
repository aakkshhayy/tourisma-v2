import type { OriginCity } from '@/lib/types';

export const ORIGIN_CITIES: OriginCity[] = [
  // ── Metro cities ────────────────────────────────────────────────────────────
  { id: 'delhi',           name: 'Delhi',              state: 'Delhi',               coordinates: { lat: 28.704, lng: 77.102 }, emoji: '🏛️', hasAirport: true },
  { id: 'mumbai',          name: 'Mumbai',             state: 'Maharashtra',         coordinates: { lat: 19.076, lng: 72.877 }, emoji: '🌆', hasAirport: true },
  { id: 'bengaluru',       name: 'Bengaluru',          state: 'Karnataka',           coordinates: { lat: 12.972, lng: 77.594 }, emoji: '🌳', hasAirport: true },
  { id: 'chennai',         name: 'Chennai',            state: 'Tamil Nadu',          coordinates: { lat: 13.083, lng: 80.270 }, emoji: '🏖️', hasAirport: true },
  { id: 'kolkata',         name: 'Kolkata',            state: 'West Bengal',         coordinates: { lat: 22.572, lng: 88.364 }, emoji: '🎨', hasAirport: true },
  { id: 'hyderabad',       name: 'Hyderabad',          state: 'Telangana',           coordinates: { lat: 17.385, lng: 78.487 }, emoji: '🕌', hasAirport: true },
  { id: 'ahmedabad',       name: 'Ahmedabad',          state: 'Gujarat',             coordinates: { lat: 23.023, lng: 72.572 }, emoji: '🧵', hasAirport: true },
  { id: 'pune',            name: 'Pune',               state: 'Maharashtra',         coordinates: { lat: 18.520, lng: 73.856 }, emoji: '🏛️', hasAirport: true },

  // ── Tier-1 regional hubs ────────────────────────────────────────────────────
  { id: 'jaipur',          name: 'Jaipur',             state: 'Rajasthan',           coordinates: { lat: 26.912, lng: 75.787 }, emoji: '🏰', hasAirport: true },
  { id: 'lucknow',         name: 'Lucknow',            state: 'Uttar Pradesh',       coordinates: { lat: 26.847, lng: 80.947 }, emoji: '🍢', hasAirport: true },
  { id: 'kochi',           name: 'Kochi',              state: 'Kerala',              coordinates: { lat:  9.932, lng: 76.267 }, emoji: '🛶', hasAirport: true },
  { id: 'chandigarh',      name: 'Chandigarh',         state: 'Chandigarh',          coordinates: { lat: 30.733, lng: 76.779 }, emoji: '🌹', hasAirport: true },
  { id: 'guwahati',        name: 'Guwahati',           state: 'Assam',               coordinates: { lat: 26.144, lng: 91.736 }, emoji: '🐘', hasAirport: true },
  { id: 'bhubaneswar',     name: 'Bhubaneswar',        state: 'Odisha',              coordinates: { lat: 20.296, lng: 85.824 }, emoji: '🛕', hasAirport: true },
  { id: 'patna',           name: 'Patna',              state: 'Bihar',               coordinates: { lat: 25.594, lng: 85.137 }, emoji: '🛕', hasAirport: true },
  { id: 'bhopal',          name: 'Bhopal',             state: 'Madhya Pradesh',      coordinates: { lat: 23.260, lng: 77.413 }, emoji: '🏞️', hasAirport: true },
  { id: 'indore',          name: 'Indore',             state: 'Madhya Pradesh',      coordinates: { lat: 22.720, lng: 75.857 }, emoji: '🍽️', hasAirport: true },

  // ── North India ─────────────────────────────────────────────────────────────
  { id: 'varanasi',        name: 'Varanasi',           state: 'Uttar Pradesh',       coordinates: { lat: 25.317, lng: 82.973 }, emoji: '🛕', hasAirport: true },
  { id: 'agra',            name: 'Agra',               state: 'Uttar Pradesh',       coordinates: { lat: 27.177, lng: 78.008 }, emoji: '🕌', hasAirport: false },
  { id: 'kanpur',          name: 'Kanpur',             state: 'Uttar Pradesh',       coordinates: { lat: 26.449, lng: 80.331 }, emoji: '🏭', hasAirport: true },
  { id: 'prayagraj',       name: 'Prayagraj',          state: 'Uttar Pradesh',       coordinates: { lat: 25.435, lng: 81.846 }, emoji: '🙏', hasAirport: true },
  { id: 'meerut',          name: 'Meerut',             state: 'Uttar Pradesh',       coordinates: { lat: 28.983, lng: 77.706 }, emoji: '🏙️', hasAirport: false },
  { id: 'amritsar',        name: 'Amritsar',           state: 'Punjab',              coordinates: { lat: 31.634, lng: 74.872 }, emoji: '🙏', hasAirport: true },
  { id: 'ludhiana',        name: 'Ludhiana',           state: 'Punjab',              coordinates: { lat: 30.901, lng: 75.857 }, emoji: '🏭', hasAirport: false },
  { id: 'dehradun',        name: 'Dehradun',           state: 'Uttarakhand',         coordinates: { lat: 30.316, lng: 78.032 }, emoji: '🏔️', hasAirport: true },
  { id: 'jammu',           name: 'Jammu',              state: 'Jammu & Kashmir',     coordinates: { lat: 32.726, lng: 74.857 }, emoji: '🛕', hasAirport: true },
  { id: 'srinagar',        name: 'Srinagar',           state: 'Jammu & Kashmir',     coordinates: { lat: 34.083, lng: 74.797 }, emoji: '🏔️', hasAirport: true },

  // ── East India (Bihar / Jharkhand / WB) ─────────────────────────────────────
  { id: 'bhagalpur',       name: 'Bhagalpur',          state: 'Bihar',               coordinates: { lat: 25.244, lng: 86.972 }, emoji: '🌿', hasAirport: false },
  { id: 'gaya',            name: 'Gaya',               state: 'Bihar',               coordinates: { lat: 24.796, lng: 85.001 }, emoji: '🙏', hasAirport: true },
  { id: 'muzaffarpur',     name: 'Muzaffarpur',        state: 'Bihar',               coordinates: { lat: 26.121, lng: 85.391 }, emoji: '🍋', hasAirport: false },
  { id: 'ranchi',          name: 'Ranchi',             state: 'Jharkhand',           coordinates: { lat: 23.344, lng: 85.310 }, emoji: '🌲', hasAirport: true },
  { id: 'jamshedpur',      name: 'Jamshedpur',         state: 'Jharkhand',           coordinates: { lat: 22.802, lng: 86.185 }, emoji: '🏭', hasAirport: false },
  { id: 'siliguri',        name: 'Siliguri',           state: 'West Bengal',         coordinates: { lat: 26.718, lng: 88.427 }, emoji: '🍵', hasAirport: false },
  { id: 'durgapur',        name: 'Durgapur',           state: 'West Bengal',         coordinates: { lat: 23.520, lng: 87.320 }, emoji: '🏭', hasAirport: false },

  // ── Northeast India ──────────────────────────────────────────────────────────
  { id: 'shillong',        name: 'Shillong',           state: 'Meghalaya',           coordinates: { lat: 25.578, lng: 91.893 }, emoji: '🌧️', hasAirport: true },
  { id: 'agartala',        name: 'Agartala',           state: 'Tripura',             coordinates: { lat: 23.831, lng: 91.280 }, emoji: '🌿', hasAirport: true },
  { id: 'imphal',          name: 'Imphal',             state: 'Manipur',             coordinates: { lat: 24.817, lng: 93.936 }, emoji: '🎭', hasAirport: true },
  { id: 'dibrugarh',       name: 'Dibrugarh',          state: 'Assam',               coordinates: { lat: 27.480, lng: 94.912 }, emoji: '🍵', hasAirport: true },

  // ── Rajasthan / Gujarat ─────────────────────────────────────────────────────
  { id: 'jodhpur',         name: 'Jodhpur',            state: 'Rajasthan',           coordinates: { lat: 26.295, lng: 73.016 }, emoji: '🏯', hasAirport: true },
  { id: 'udaipur',         name: 'Udaipur',            state: 'Rajasthan',           coordinates: { lat: 24.585, lng: 73.712 }, emoji: '🏛️', hasAirport: true },
  { id: 'surat',           name: 'Surat',              state: 'Gujarat',             coordinates: { lat: 21.170, lng: 72.831 }, emoji: '💎', hasAirport: true },
  { id: 'vadodara',        name: 'Vadodara',           state: 'Gujarat',             coordinates: { lat: 22.307, lng: 73.181 }, emoji: '🏛️', hasAirport: true },
  { id: 'rajkot',          name: 'Rajkot',             state: 'Gujarat',             coordinates: { lat: 22.304, lng: 70.802 }, emoji: '🏙️', hasAirport: true },

  // ── Maharashtra / Chhattisgarh / MP ─────────────────────────────────────────
  { id: 'nagpur',          name: 'Nagpur',             state: 'Maharashtra',         coordinates: { lat: 21.145, lng: 79.082 }, emoji: '🍊', hasAirport: true },
  { id: 'aurangabad',      name: 'Aurangabad',         state: 'Maharashtra',         coordinates: { lat: 19.876, lng: 75.343 }, emoji: '🕌', hasAirport: true },
  { id: 'nashik',          name: 'Nashik',             state: 'Maharashtra',         coordinates: { lat: 20.011, lng: 73.790 }, emoji: '🍇', hasAirport: false },
  { id: 'raipur',          name: 'Raipur',             state: 'Chhattisgarh',        coordinates: { lat: 21.251, lng: 81.629 }, emoji: '🌾', hasAirport: true },
  { id: 'jabalpur',        name: 'Jabalpur',           state: 'Madhya Pradesh',      coordinates: { lat: 23.182, lng: 79.986 }, emoji: '🏞️', hasAirport: true },

  // ── South India ─────────────────────────────────────────────────────────────
  { id: 'coimbatore',      name: 'Coimbatore',         state: 'Tamil Nadu',          coordinates: { lat: 11.017, lng: 76.957 }, emoji: '🏭', hasAirport: true },
  { id: 'madurai',         name: 'Madurai',            state: 'Tamil Nadu',          coordinates: { lat:  9.919, lng: 78.120 }, emoji: '🛕', hasAirport: true },
  { id: 'visakhapatnam',   name: 'Visakhapatnam',      state: 'Andhra Pradesh',      coordinates: { lat: 17.686, lng: 83.217 }, emoji: '⚓', hasAirport: true },
  { id: 'vijayawada',      name: 'Vijayawada',         state: 'Andhra Pradesh',      coordinates: { lat: 16.506, lng: 80.648 }, emoji: '🏙️', hasAirport: true },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala',           coordinates: { lat:  8.524, lng: 76.936 }, emoji: '🛕', hasAirport: true },
  { id: 'kozhikode',       name: 'Kozhikode',          state: 'Kerala',              coordinates: { lat: 11.259, lng: 75.782 }, emoji: '🌿', hasAirport: true },

  // ── Hill / mountain cities ───────────────────────────────────────────────────
  { id: 'shimla',          name: 'Shimla',             state: 'Himachal Pradesh',    coordinates: { lat: 31.105, lng: 77.173 }, emoji: '❄️', hasAirport: false },
];

export const getOriginById = (id: string): OriginCity | undefined =>
  ORIGIN_CITIES.find(o => o.id === id);

/** Fuzzy city-name lookup — used when a typed city name doesn't match any id */
export const getOriginByName = (name: string): OriginCity | undefined => {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return ORIGIN_CITIES.find(o =>
    o.name.toLowerCase() === q ||
    o.name.toLowerCase().startsWith(q) ||
    q.startsWith(o.name.toLowerCase())
  );
};
