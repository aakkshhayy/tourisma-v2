import type { TouristPlace, ItineraryOptions } from '@/lib/types';
import { PLACES } from '@/lib/places';
import { getOriginById } from '@/lib/origins';
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

function scorePlaceFit(p: TouristPlace, input: RecommendInput, originCoords: { lat: number; lng: number } | null): number {
  // Trip-type alignment via category weights
  const typeWeight = TRIP_TYPE_CATEGORY_WEIGHTS[input.tripType][p.category] ?? 1;

  // Distance from origin: closer is better (scaled by trip duration — longer trips can go further)
  const distKm = originCoords ? haversineKm(p.coordinates, originCoords) : 1000;
  const maxReasonableKm = input.numDays * 350; // ~350 km per day reasonable spread
  const distScore = Math.max(0, 1 - distKm / maxReasonableKm);

  // Highlights richness
  const richness = Math.min(1, p.highlights.length / 5);

  return typeWeight * 2 + distScore * 3 + richness;
}

function approxTotalCost(places: TouristPlace[], input: RecommendInput): number {
  // Rough cost estimate without running the full itinerary generator.
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
  const targetCount = Math.max(2, Math.min(6, Math.round(input.numDays / 1.5)));

  if (strategy === 'cheap') {
    // Prefer cheaper places, balance with score
    const ranked = [...candidates].sort((a, b) => {
      const aCost = (a.place.stayOptions[0]?.costPerNight ?? 1500) + a.place.foodCostPerDay + a.place.entryFee;
      const bCost = (b.place.stayOptions[0]?.costPerNight ?? 1500) + b.place.foodCostPerDay + b.place.entryFee;
      return (aCost - bCost) - (a.score - b.score) * 200;
    });
    return ranked.slice(0, targetCount).map(r => r.place);
  }

  if (strategy === 'diverse') {
    // Pick top-scored places ensuring category and state diversity
    const picked: TouristPlace[] = [];
    const usedCategories = new Set<string>();
    const usedStates = new Set<string>();
    for (const c of candidates) {
      if (picked.length >= targetCount) break;
      const catNew = !usedCategories.has(c.place.category);
      const stateNew = !usedStates.has(c.place.state);
      if (catNew || stateNew || picked.length < 2) {
        picked.push(c.place);
        usedCategories.add(c.place.category);
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
  const origin = getOriginById(input.fromCityId);
  const originCoords = origin?.coordinates ?? null;

  // Filter candidates: open in selected month, type-aligned weight > 0.4
  const candidates = PLACES
    .filter(p => isOpenInMonth(p, input.travelMonth))
    .filter(p => (TRIP_TYPE_CATEGORY_WEIGHTS[input.tripType][p.category] ?? 1) >= 0.5)
    .map(p => ({ place: p, score: scorePlaceFit(p, input, originCoords) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 40); // top 40 candidates by score

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
      withinBudget: perPerson <= input.budgetPerPerson * 1.1, // 10% tolerance
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
