import { create } from 'zustand';
import type { TouristPlace, ItineraryOptions } from '@/lib/types';

interface ItineraryStore {
  selectedPlaces: TouristPlace[];
  options: ItineraryOptions;
  addPlace: (place: TouristPlace) => void;
  removePlace: (placeId: string) => void;
  togglePlace: (place: TouristPlace) => void;
  isSelected: (placeId: string) => boolean;
  setOptions: (opts: Partial<ItineraryOptions>) => void;
  clearSelection: () => void;
}

export const useItineraryStore = create<ItineraryStore>((set, get) => ({
  selectedPlaces: [],
  options: {
    stayType: 'mid',
    travelMode: 'train',
    groupSize: 2,
    numDays: 5,
    originCityId: 'delhi',
    optimisation: 'balanced',
    travelMonth: new Date().getMonth() + 1,
    tripType: 'general',
  },

  addPlace: (place) =>
    set(s => ({ selectedPlaces: [...s.selectedPlaces, place] })),

  removePlace: (placeId) =>
    set(s => ({ selectedPlaces: s.selectedPlaces.filter(p => p.id !== placeId) })),

  togglePlace: (place) => {
    const { isSelected, addPlace, removePlace } = get();
    isSelected(place.id) ? removePlace(place.id) : addPlace(place);
  },

  isSelected: (placeId) => get().selectedPlaces.some(p => p.id === placeId),

  setOptions: (opts) =>
    set(s => ({ options: { ...s.options, ...opts } })),

  clearSelection: () => set({ selectedPlaces: [] }),
}));
