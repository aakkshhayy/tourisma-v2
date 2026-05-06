import type { OriginCity } from '@/lib/types';

export const ORIGIN_CITIES: OriginCity[] = [
  { id: 'delhi', name: 'Delhi', state: 'Delhi', coordinates: { lat: 28.704, lng: 77.102 }, emoji: '🏛️', hasAirport: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', coordinates: { lat: 19.076, lng: 72.877 }, emoji: '🌆', hasAirport: true },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', coordinates: { lat: 12.972, lng: 77.594 }, emoji: '🌳', hasAirport: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', coordinates: { lat: 13.083, lng: 80.270 }, emoji: '🏖️', hasAirport: true },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', coordinates: { lat: 22.572, lng: 88.364 }, emoji: '🎨', hasAirport: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', coordinates: { lat: 17.385, lng: 78.487 }, emoji: '🕌', hasAirport: true },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', coordinates: { lat: 23.023, lng: 72.572 }, emoji: '🧵', hasAirport: true },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', coordinates: { lat: 18.520, lng: 73.856 }, emoji: '🏛️', hasAirport: true },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', coordinates: { lat: 26.912, lng: 75.787 }, emoji: '🏰', hasAirport: true },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', coordinates: { lat: 26.847, lng: 80.947 }, emoji: '🍢', hasAirport: true },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', coordinates: { lat: 9.932, lng: 76.267 }, emoji: '🛶', hasAirport: true },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', coordinates: { lat: 30.733, lng: 76.779 }, emoji: '🌹', hasAirport: true },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', coordinates: { lat: 26.144, lng: 91.736 }, emoji: '🐘', hasAirport: true },
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', coordinates: { lat: 20.296, lng: 85.824 }, emoji: '🛕', hasAirport: true },
  { id: 'patna', name: 'Patna', state: 'Bihar', coordinates: { lat: 25.594, lng: 85.137 }, emoji: '🛕', hasAirport: true },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', coordinates: { lat: 23.260, lng: 77.413 }, emoji: '🏞️', hasAirport: true },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', coordinates: { lat: 22.720, lng: 75.857 }, emoji: '🍽️', hasAirport: true },
];

export const getOriginById = (id: string): OriginCity | undefined =>
  ORIGIN_CITIES.find(o => o.id === id);
