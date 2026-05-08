import type { TouristPlace } from '@/lib/types';
import { PLACES } from '@/lib/places';

export interface PilgrimageCircuit {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  /** Tailwind gradient classes — used in cards & headers */
  gradient: string;
  /** Religious tradition — used for badges */
  type: 'hindu' | 'buddhist' | 'sikh' | 'multi';
  description: string;
  significance: string;
  placeIds: string[];
  suggestedDays: number;
  bestMonths: number[];
  difficulty: 'easy' | 'moderate' | 'demanding';
  /** Things pilgrims often want to know */
  notes: string[];
}

export const CIRCUITS: PilgrimageCircuit[] = [
  {
    id: 'do-dham-yatra',
    name: 'Do Dham Yatra',
    tagline: 'Kedarnath & Badrinath — the Himalayan twins of Char Dham',
    emoji: '🕉️',
    gradient: 'from-orange-500 to-red-500',
    type: 'hindu',
    description:
      "The two most revered Himalayan shrines of the Char Dham circuit — Kedarnath, abode of Lord Shiva at 11,755 ft, and Badrinath, dedicated to Lord Vishnu at 10,170 ft. Both are part of every devout Hindu's spiritual checklist.",
    significance:
      'Kedarnath is one of the 12 Jyotirlingas; Badrinath is one of the 108 Divya Desams of Vishnu. Together they form the most accessible portion of the full Char Dham (Yamunotri-Gangotri-Kedarnath-Badrinath) yatra.',
    placeIds: ['uk_haridwar', 'uk_kedarnath', 'uk_badrinath'],
    suggestedDays: 7,
    bestMonths: [5, 6, 9, 10],
    difficulty: 'demanding',
    notes: [
      'Temples open only May–Oct; closed in winter due to snow',
      'Kedarnath requires a 16km trek from Gaurikund (or helicopter)',
      'Helicopter bookings via heliyatra.irctc.co.in open in March',
      'Carry warm clothes — temperatures drop below 5°C even in summer',
      'Pre-register on registrationandtouristcare.uk.gov.in (mandatory)',
    ],
  },
  {
    id: 'dwarka-somnath-yatra',
    name: 'Dwarka–Somnath Yatra',
    tagline: 'Where Krishna ruled and Shiva first manifested',
    emoji: '🌊',
    gradient: 'from-cyan-500 to-blue-600',
    type: 'hindu',
    description:
      'The sacred Saurashtra coast of Gujarat hosts two of Hinduism\'s most powerful pilgrimages — Dwarka, the legendary city of Krishna, and Somnath, the first of the 12 Jyotirlingas, rebuilt seven times across millennia.',
    significance:
      'Dwarka is one of the seven Sapta Puri (sacred cities). Somnath is the first Jyotirlinga, considered the most ancient Shiva shrine in India. Together with Junagadh\'s Girnar hill, they cover the entire Saurashtra spiritual landscape.',
    placeIds: ['gj_dwarka', 'gj_somnath', 'gj_junagadh'],
    suggestedDays: 5,
    bestMonths: [10, 11, 12, 1, 2, 3],
    difficulty: 'easy',
    notes: [
      'Coastal Gujarat is best Oct–Mar; summer is brutally hot',
      'Dwarkadhish temple has aarti at 6:30 AM and 7:30 PM',
      'Somnath light-and-sound show in the evening is highly recommended',
      'Girnar trek at Junagadh has 9,999 steps — start before sunrise',
      'Bet Dwarka (boat trip) is a half-day add-on from Dwarka',
    ],
  },
  {
    id: 'sapta-puri-trail',
    name: 'Sapta Puri Northern Trail',
    tagline: 'Six of the seven sacred cities of Hinduism',
    emoji: '🛕',
    gradient: 'from-amber-500 to-orange-600',
    type: 'hindu',
    description:
      'The seven Sapta Puris are Moksha-granting cities — places where liberation is said to be assured. This circuit covers the six accessible northern ones: Ayodhya, Mathura, Haridwar, Varanasi, Prayagraj, and Vrindavan.',
    significance:
      'Each city has cosmic significance — Ayodhya birthplace of Rama, Mathura of Krishna, Haridwar gateway of the Ganga, Varanasi the eternal city of Shiva, Prayagraj the Triveni Sangam, Vrindavan where Krishna danced. Pilgrims who visit all seven are said to attain Moksha.',
    placeIds: ['up_ayodhya', 'up_mathura_vrindavan', 'uk_haridwar', 'uk_rishikesh', 'up_prayagraj', 'up_varanasi'],
    suggestedDays: 10,
    bestMonths: [10, 11, 12, 1, 2],
    difficulty: 'moderate',
    notes: [
      'Winter (Oct–Feb) is comfortable; avoid May–Aug',
      'Ayodhya: Ram Mandir requires advance booking via online portal',
      'Varanasi: Ganga aarti at Dashashwamedh Ghat at sunset is unmissable',
      'Prayagraj Sangam is most powerful at Magh Mela (Jan–Feb)',
      'Mathura-Vrindavan: visit during Janmashtami (Aug) for the full experience',
    ],
  },
  {
    id: 'buddhist-mahaparinirvan',
    name: 'Buddhist Mahaparinirvan Circuit',
    tagline: 'In the footsteps of the Buddha',
    emoji: '☸️',
    gradient: 'from-yellow-500 to-amber-600',
    type: 'buddhist',
    description:
      'The most sacred Buddhist circuit, tracing the life of Gautama Buddha across Bihar and Eastern UP. Bodh Gaya (enlightenment), Sarnath/Varanasi (first sermon), Rajgir (taught for years), Vaishali (last sermon), and Nalanda (the great university).',
    significance:
      'Bodh Gaya is a UNESCO World Heritage site — the spot under the Mahabodhi tree where Siddhartha attained enlightenment. Together these places form the heart of the international Buddhist pilgrimage, drawing devotees from Sri Lanka, Thailand, Japan, Bhutan, and beyond.',
    placeIds: ['br_bodhgaya', 'br_rajgir', 'br_nalanda', 'br_vaishali', 'up_varanasi'],
    suggestedDays: 8,
    bestMonths: [10, 11, 12, 1, 2, 3],
    difficulty: 'easy',
    notes: [
      'Best from Oct–Feb; summers in Bihar are extreme',
      'Bodh Gaya: stay near the Mahabodhi temple complex; dawn meditation is special',
      'Nalanda University ruins need 3+ hours — UNESCO site',
      'Rajgir has the world\'s first Buddhist council site (Saptaparni Cave)',
      'Sarnath (just outside Varanasi) has the Dhamek Stupa and museum',
      'IRCTC runs a dedicated Buddhist Circuit train (luxury option)',
    ],
  },
  {
    id: 'vaishno-devi-amritsar',
    name: 'Vaishno Devi & Golden Temple',
    tagline: 'A pilgrimage of two faiths in the foothills',
    emoji: '🙏',
    gradient: 'from-rose-500 to-pink-600',
    type: 'multi',
    description:
      'A deeply popular twin pilgrimage — Mata Vaishno Devi, the Shakti shrine high in the Trikuta hills (12km trek from Katra), and the Golden Temple at Amritsar, the holiest gurudwara of Sikhism. Anandpur Sahib in Punjab adds the Khalsa\'s birthplace to the trail.',
    significance:
      'Vaishno Devi sees over 10 million pilgrims a year — among India\'s most-visited shrines. The Golden Temple\'s langar feeds 100,000 people daily, free, regardless of faith. Anandpur Sahib is one of the Five Takhts of Sikhism and the birthplace of the Khalsa.',
    placeIds: ['jk_vaishno_devi', 'pb_amritsar', 'pb_anandpur_sahib'],
    suggestedDays: 6,
    bestMonths: [3, 4, 5, 9, 10, 11],
    difficulty: 'moderate',
    notes: [
      'Vaishno Devi: pre-register at maavaishnodevi.org; helicopter from Katra available',
      'Trek is 12km one way — start early; ponies & palki available',
      'Golden Temple is open 24/7; experience the Palki Sahib ceremony at night',
      'Wagah Border parade ceremony at sunset is a must — go via Amritsar',
      'Anandpur Sahib: visit during Hola Mohalla festival (March) if possible',
    ],
  },
  {
    id: 'south-india-temple-trail',
    name: 'South India Temple Trail',
    tagline: 'Tirupati to Rameswaram — the great Dravidian pilgrimage',
    emoji: '🛕',
    gradient: 'from-violet-500 to-purple-600',
    type: 'hindu',
    description:
      'The greatest temple architecture in the world, traced through four Dravidian masterpieces: Tirupati Balaji (richest temple on earth), Kanchipuram (city of a thousand temples), Madurai Meenakshi (Shakti seat), and Rameswaram (one of the 12 Jyotirlingas and Char Dham of the South).',
    significance:
      'Rameswaram is one of the four Char Dhams of India and one of the 12 Jyotirlingas. Tirupati receives over 50,000 pilgrims daily. Madurai\'s Meenakshi Amman temple is among the largest temple complexes in the world. Kanchipuram is one of the seven Sapta Puris.',
    placeIds: ['ap_tirupati', 'tn_kanchipuram', 'tn_madurai', 'tn_rameswaram'],
    suggestedDays: 9,
    bestMonths: [11, 12, 1, 2, 3],
    difficulty: 'moderate',
    notes: [
      'Tirupati: book darshan online via tirupatibalaji.ap.gov.in 60+ days in advance',
      'Free darshan can take 8-12 hours; ₹300 ticket is the practical option',
      'Madurai Meenakshi night ceremony (Pallirai Sevai) at 9 PM is unforgettable',
      'Rameswaram: 22 sacred theerthams (wells) inside the temple — bring change of clothes',
      'Pamban bridge between mainland and Rameswaram is a sight in itself',
    ],
  },
];

export interface CircuitWithPlaces extends PilgrimageCircuit {
  places: TouristPlace[];
}

export function getCircuitById(id: string): CircuitWithPlaces | undefined {
  const c = CIRCUITS.find(x => x.id === id);
  if (!c) return undefined;
  const places = c.placeIds
    .map(pid => PLACES.find(p => p.id === pid))
    .filter((p): p is TouristPlace => !!p);
  return { ...c, places };
}

export function getAllCircuitsWithPlaces(): CircuitWithPlaces[] {
  return CIRCUITS.map(c => ({
    ...c,
    places: c.placeIds.map(pid => PLACES.find(p => p.id === pid)).filter((p): p is TouristPlace => !!p),
  }));
}
