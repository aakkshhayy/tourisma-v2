import type { TouristPlace, ItineraryOptions } from '@/lib/types';
import { PLACES } from '@/lib/places';
import { getOriginById, getOriginByName } from '@/lib/origins';
import { generateItinerary } from '@/lib/itineraryGenerator';

export interface RecommendInput {
  tripType: ItineraryOptions['tripType'];
  fromCityId: string;
  travelMonth: number;
  numDays: number;
  budgetPerPerson: number;
  groupSize: number;
  stayType: ItineraryOptions['stayType'];
}

export interface TripSuggestion {
  id: 'best_match' | 'budget_friendly' | 'diverse';
  label: string;
  tagline: string;
  emoji: string;
  places: TouristPlace[];
  totalCost: number;
  perPerson: number;
  withinBudget: boolean;
  route: string[];
  days: number;
}

const TRIP_TYPE_CATEGORY_WEIGHTS: Record<ItineraryOptions['tripType'], Record<TouristPlace['category'], number>> = {
  general:    { heritage: 1, nature: 1, religious: 1, beach: 1, hill_station: 1, wildlife: 1, cultural: 1 },
  pilgrimage: { religious: 5, heritage: 1.5, cultural: 1, nature: 0.5, beach: 0.1, hill_station: 0.5, wildlife: 0.2 },
  family:     { heritage: 2, nature: 2, hill_station: 2, beach: 2, cultural: 2, wildlife: 1.5, religious: 1.2 },
  honeymoon:  { hill_station: 3, beach: 3, nature: 2, heritage: 1.5, cultural: 1, religious: 0.5, wildlife: 1 },
  solo:       { nature: 2.5, heritage: 2, cultural: 2, hill_station: 2, beach: 1.5, religious: 1, wildlife: 1.5 },
  friends:    { beach: 3, hill_station: 2.5, nature: 2, cultural: 1.5, heritage: 1.5, wildlife: 1, religious: 0.5 },
};

// Geographic zones with a representative centroid.
// State IDs match the lowercase underscore format used in places.ts.
const GEO_ZONES: { id: string; lat: number; lng: number; states: string[] }[] = [
  { id: 'north',     lat: 28.7,  lng: 77.2,  states: ['delhi', 'haryana', 'uttar_pradesh', 'punjab'] },
  { id: 'himalayan', lat: 31.5,  lng: 77.0,  states: ['himachal_pradesh', 'uttarakhand', 'jammu_kashmir', 'ladakh'] },
  { id: 'rajasthan', lat: 26.0,  lng: 74.0,  states: ['rajasthan'] },
  { id: 'gujarat',   lat: 22.3,  lng: 72.6,  states: ['gujarat'] },
  { id: 'west',      lat: 19.5,  lng: 73.5,  states: ['maharashtra', 'goa'] },
  { id: 'south',     lat: 13.0,  lng: 78.5,  states: ['karnataka', 'andhra_pradesh', 'telangana'] },
  { id: 'far_south', lat: 10.5,  lng: 77.5,  states: ['tamil_nadu', 'kerala', 'puducherry', 'lakshadweep'] },
  { id: 'east',      lat: 22.5,  lng: 85.5,  states: ['west_bengal', 'odisha', 'jharkhand', 'bihar'] },
  { id: 'northeast', lat: 25.5,  lng: 91.5,  states: ['assam', 'meghalaya', 'sikkim', 'arunachal_pradesh', 'nagaland', 'manipur', 'mizoram', 'tripura'] },
  { id: 'central',   lat: 22.5,  lng: 79.0,  states: ['madhya_pradesh', 'chhattisgarh'] },
  { id: 'andaman',   lat: 12.0,  lng: 93.0,  states: ['andaman_nicobar'] },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function isOpenInMonth(p: TouristPlace, month: number): boolean {
  if (!p.openMonths) return true;
  return p.openMonths.includes(month);
}

function resolveOriginCoords(input: RecommendInput): { lat: number; lng: number } | null {
  // 1. Direct ID match
  const byId = getOriginById(input.fromCityId);
  if (byId) return byId.coordinates;

  // 2. Name-based fuzzy match (handles typed city names not in the list)
  const byName = getOriginByName(input.fromCityId);
  if (byName) return byName.coordinates;

  return null;
}

function getOriginZone(coords: { lat: number; lng: number } | null): typeof GEO_ZONES[0] | null {
  if (!coords) return null;
  let nearest = GEO_ZONES[0];
  let minDist = haversineKm(coords, { lat: GEO_ZONES[0].lat, lng: GEO_ZONES[0].lng });
  for (const zone of GEO_ZONES.slice(1)) {
    const d = haversineKm(coords, { lat: zone.lat, lng: zone.lng });
    if (d < minDist) { minDist = d; nearest = zone; }
  }
  return nearest;
}

function scorePlaceFit(
  p: TouristPlace,
  input: RecommendInput,
  originCoords: { lat: number; lng: number } | null,
  originZone: typeof GEO_ZONES[0] | null,
): number {
  // Trip-type alignment via category weights
  const typeWeight = TRIP_TYPE_CATEGORY_WEIGHTS[input.tripType][p.category] ?? 1;

  // Distance score: closer is better, scaled by trip duration
  let distScore: number;
  if (originCoords) {
    const distKm = haversineKm(p.coordinates, originCoords);
    const maxReasonableKm = input.numDays * 400; // ~400 km/day spread
    distScore = Math.max(0, 1 - distKm / maxReasonableKm);
  } else {
    // No coords available — use a neutral mid-distance score so we don't
    // artificially penalise or prefer any region.
    distScore = 0.5;
  }

  // Regional adjacency bonus: places in the same or neighbouring geographic zone
  // get a modest boost so local gems appear even when they score average overall.
  let zoneBonus = 0;
  if (originZone) {
    const placeZone = GEO_ZONES.find(z => z.states.includes(p.state));
    if (placeZone) {
      if (placeZone.id === originZone.id) {
        zoneBonus = 1.5; // same zone — strong boost
      } else {
        // Neighbouring zone — check if zone centroids are within ~600 km
        const zoneDist = haversineKm(
          { lat: originZone.lat, lng: originZone.lng },
          { lat: placeZone.lat, lng: placeZone.lng },
        );
        if (zoneDist < 800) zoneBonus = 0.8;
      }
    }
  }

  // Highlights richness
  const richness = Math.min(1, p.highlights.length / 5);

  return typeWeight * 2 + distScore * 3 + zoneBonus + richness;
}

function approxTotalCost(places: TouristPlace[], input: RecommendInput): number {
  const stayKey = input.stayType;
  const stayPerNight = places.reduce((sum, p) => {
    const opt = p.stayOptions.find(o => o.type === stayKey) ?? p.stayOptions[0];
    return sum + (opt?.costPerNight ?? 1500);
  }, 0) / Math.max(places.length, 1);

  const stay = stayPerNight * (input.numDays - 1) * input.groupSize;
  const food = places.reduce((s, p) => s + p.foodCostPerDay, 0) / places.length * input.numDays * input.groupSize;
  const entry = places.reduce((s, p) => s + p.entryFee, 0) * input.groupSize;

  // Travel: rough — 800/leg/person × number of legs
  const travel = (places.length + 1) * 800 * input.groupSize;

  return Math.round(stay + food + entry + travel);
}

function pickPlacesForOption(
  candidates: { place: TouristPlace; score: number }[],
  input: RecommendInput,
  strategy: 'best' | 'cheap' | 'diverse',
): TouristPlace[] {
  // More generous target: longer trips get more places
  const targetCount = Math.max(3, Math.min(7, Math.round(input.numDays / 1.2)));

  if (strategy === 'cheap') {
    const ranked = [...candidates].sort((a, b) => {
      const aCost = (a.place.stayOptions[0]?.costPerNight ?? 1500) + a.place.foodCostPerDay + a.place.entryFee;
      const bCost = (b.place.stayOptions[0]?.costPerNight ?? 1500) + b.place.foodCostPerDay + b.place.entryFee;
      return (aCost - bCost) - (a.score - b.score) * 200;
    });
    return ranked.slice(0, targetCount).map(r => r.place);
  }

  if (strategy === 'diverse') {
    // Ensure variety across categories AND geographic zones
    const picked: TouristPlace[] = [];
    const usedCategories = new Set<string>();
    const usedZones = new Set<string>();
    const usedStates = new Set<string>();

    for (const c of candidates) {
      if (picked.length >= targetCount) break;
      const placeZone = GEO_ZONES.find(z => z.states.includes(c.place.state))?.id ?? c.place.state;
      const catNew   = !usedCategories.has(c.place.category);
      const zoneNew  = !usedZones.has(placeZone);
      const stateNew = !usedStates.has(c.place.state);
      if (catNew || zoneNew || stateNew || picked.length < 2) {
        picked.push(c.place);
        usedCategories.add(c.place.category);
        usedZones.add(placeZone);
        usedStates.add(c.place.state);
      }
    }
    // Top up if we ended short
    for (const c of candidates) {
      if (picked.length >= targetCount) break;
      if (!picked.some(p => p.id === c.place.id)) picked.push(c.place);
    }
    return picked;
  }

  // best — top scored
  return candidates.slice(0, targetCount).map(r => r.place);
}

export function recommendTrips(input: RecommendInput): TripSuggestion[] {
  const originCoords = resolveOriginCoords(input);
  const originZone   = getOriginZone(originCoords);

  // Filter candidates: open in selected month, type-aligned weight > 0.4
  const candidates = PLACES
    .filter(p => isOpenInMonth(p, input.travelMonth))
    .filter(p => (TRIP_TYPE_CATEGORY_WEIGHTS[input.tripType][p.category] ?? 1) >= 0.5)
    .map(p => ({ place: p, score: scorePlaceFit(p, input, originCoords, originZone) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50); // top 50 candidates by score

  const buildSuggestion = (
    id: TripSuggestion['id'],
    label: string,
    tagline: string,
    emoji: string,
    strategy: 'best' | 'cheap' | 'diverse',
  ): TripSuggestion => {
    const places = pickPlacesForOption(candidates, input, strategy);
    const totalCost = approxTotalCost(places, input);
    const perPerson = Math.round(totalCost / input.groupSize);
    return {
      id, label, tagline, emoji,
      places,
      totalCost,
      perPerson,
      withinBudget: perPerson <= input.budgetPerPerson * 1.1,
      route: places.map(p => p.name),
      days: input.numDays,
    };
  };

  return [
    buildSuggestion('best_match',       'Best Match',       'Top-scored picks for your trip type', '🎯', 'best'),
    buildSuggestion('budget_friendly',  'Budget Friendly',  'Lowest cost while staying on theme',  '💰', 'cheap'),
    buildSuggestion('diverse',          'Mix It Up',        'Variety across regions & experiences','🌈', 'diverse'),
  ];
}

// Simulate full cost when user picks a suggestion — calls the real generator
export function simulateSuggestion(suggestion: TripSuggestion, input: RecommendInput) {
  return generateItinerary(suggestion.places, {
    stayType: input.stayType,
    travelMode: 'train',
    groupSize: input.groupSize,
    numDays: input.numDays,
    originCityId: input.fromCityId,
    optimisation: 'balanced',
    travelMonth: input.travelMonth,
    tripType: input.tripType,
  });
}
