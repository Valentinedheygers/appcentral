"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ── Cities ──────────────────────────────────────────────────── */
const C: Record<string, [number, number]> = {
  // Europe
  'Amsterdam': [52.3676, 4.9041], 'Rotterdam': [51.9244, 4.4777], 'Brussels': [50.8503, 4.3517],
  'Paris': [48.8566, 2.3522], 'Vienna': [48.2082, 16.3738], 'Berlin': [52.5200, 13.4050],
  'Hamburg': [53.5511, 9.9937], 'Munich': [48.1351, 11.5820], 'Zurich': [47.3769, 8.5417],
  'Basel': [47.5596, 7.5886], 'Rome': [41.9028, 12.4964], 'Milan': [45.4654, 9.1859],
  'Venice': [45.4408, 12.3155], 'Florence': [43.7696, 11.2558], 'Bologna': [44.4949, 11.3426],
  'Verona': [45.4384, 10.9916], 'Nice': [43.7102, 7.2620], 'Lyon': [45.7640, 4.8357],
  'Marseille': [43.2965, 5.3698], 'Toulon': [43.1242, 5.9280], 'Toulouse': [43.6047, 1.4442],
  'Bordeaux': [44.8378, -0.5792], 'Hendaye': [43.3567, -1.7794], 'Briançon': [44.8958, 6.6433],
  'Grenoble': [45.1885, 5.7245], 'Perpignan': [42.6986, 2.8956], 'Latour-de-Carol': [42.5048, 1.8830],
  'Madrid': [40.4168, -3.7038], 'Lisbon': [38.7169, -9.1399], 'Mérida': [38.9164, -6.3437],
  'Badajoz': [38.8794, -6.9706], 'Entroncamento': [39.4617, -8.4708], 'Valladolid': [41.6523, -4.7245],
  'Palencia': [42.0098, -4.5287], 'A Coruña': [43.3623, -8.4115], 'Stockholm': [59.3293, 18.0686],
  'Göteborg': [57.7089, 11.9746], 'Malmö': [55.6050, 13.0038], 'Copenhagen': [55.6761, 12.5683],
  'Prague': [50.0755, 14.4378], 'Dresden': [51.0509, 13.7383], 'Warsaw': [52.2297, 21.0122],
  'Budapest': [47.4979, 19.0402], 'Brno': [49.1951, 16.6068], 'Ostrava': [49.8209, 18.2625],
  'Katowice': [50.2649, 19.0238], 'London': [51.5074, -0.1278], 'Edinburgh': [55.9533, -3.1883],
  'Glasgow': [55.8642, -4.2518], 'Perth_UK': [56.3950, -3.4316], 'Dundee': [56.4620, -2.9707],
  'Aberdeen': [57.1497, -2.0943], 'Inverness': [57.4778, -4.2247], 'Fort William': [56.8198, -5.1052],
  'Cologne': [50.9333, 6.9500], 'Düsseldorf': [51.2217, 6.7762], 'Frankfurt': [50.1109, 8.6821],
  'Nuremberg': [49.4521, 11.0767], 'Leipzig': [51.3397, 12.3731], 'Hannover': [52.3759, 9.7320],
  'Linz': [48.3069, 14.2858], 'Salzburg': [47.8095, 13.0550], 'Innsbruck': [47.2692, 11.4041],
  'Villach': [46.6167, 13.8500],
  // Scandinavie / Finlande
  'Helsinki': [60.1699, 24.9384], 'Tampere': [61.4978, 23.7610], 'Oulu': [65.0121, 25.4651],
  'Rovaniemi': [66.5039, 25.7294], 'Kemijärvi': [66.7132, 27.4290], 'Kolari': [67.3394, 23.8133],
  // Japon
  'Tokyo': [35.6762, 139.6503], 'Izumo': [35.3667, 132.7167], 'Takamatsu': [34.3401, 134.0434],
  'Okayama': [34.6618, 133.9350],
  // Chine
  'Beijing': [39.9042, 116.4074], 'Shanghai': [31.2304, 121.4737], 'Guangzhou': [23.1291, 113.2644],
  'Chengdu': [30.5728, 104.0668], 'Kunming': [24.8801, 102.8329], 'Hong Kong': [22.3193, 114.1694],
  'Harbin': [45.8038, 126.5350], 'Shenyang': [41.8057, 123.4315], 'Xian': [34.3416, 108.9398],
  'Wuhan': [30.5928, 114.3055], 'Nanning': [22.8170, 108.3665], 'Urumqi': [43.8256, 87.6168],
  'Lanzhou': [36.0611, 103.8343],
  // Inde
  'Delhi': [28.6139, 77.2090], 'Mumbai': [19.0760, 72.8777], 'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639], 'Bengaluru': [12.9716, 77.5946], 'Hyderabad': [17.3850, 78.4867],
  'Agra': [27.1767, 78.0081], 'Jaipur': [26.9124, 75.7873], 'Ahmedabad': [23.0225, 72.5714],
  'Pune': [18.5204, 73.8567],
  // Asie du Sud-Est
  'Bangkok': [13.7563, 100.5018], 'Chiang Mai': [18.7883, 98.9853], 'Butterworth': [5.3991, 100.3638],
  'Kuala Lumpur': [3.1390, 101.6869], 'Hat Yai': [7.0086, 100.4747], 'Padang Besar': [6.6506, 100.3118],
  // USA
  'New York': [40.7128, -74.0060], 'Chicago': [41.8781, -87.6298], 'Los Angeles': [34.0522, -118.2437],
  'Seattle': [47.6062, -122.3321], 'Miami': [25.7617, -80.1918], 'New Orleans': [29.9511, -90.0715],
  'San Antonio': [29.4241, -98.4936], 'Portland OR': [45.5051, -122.6750],
  'Washington DC': [38.9072, -77.0369], 'Boston': [42.3601, -71.0589],
  'Philadelphia': [39.9526, -75.1652], 'Pittsburgh': [40.4406, -79.9959],
  'Cleveland': [41.4993, -81.6944], 'Buffalo': [42.8864, -78.8784], 'Albany': [42.6526, -73.7562],
  'Minneapolis': [44.9778, -93.2650], 'Denver': [39.7392, -104.9903],
  'Salt Lake City': [40.7608, -111.8910], 'Reno': [39.5296, -119.8138],
  'Sacramento': [38.5816, -121.4944], 'Tucson': [32.2226, -110.9747], 'El Paso': [31.7619, -106.4850],
  'Sanford': [28.8003, -81.2737], 'Galveston': [29.2988, -94.7977],
  'Jacksonville': [30.3322, -81.6557], 'Tampa': [27.9506, -82.4572],
  'Savannah': [32.0835, -81.0998], 'Charlotte': [35.2271, -80.8431],
  'Richmond': [37.5407, -77.4360], 'Atlanta': [33.7490, -84.3880],
  'Birmingham': [33.5186, -86.8104], 'Memphis': [35.1495, -90.0490],
  'Kansas City': [39.0997, -94.5786], 'St Louis': [38.6270, -90.1994],
  'Milwaukee': [43.0389, -87.9065], 'Hartford': [41.7658, -72.6851],
  'Grand Rapids': [42.9634, -85.6681], 'Toledo': [41.6639, -83.5552],
  'Spokane': [47.6588, -117.4260], 'Albuquerque': [35.0844, -106.6504],
  'Dallas': [32.7767, -96.7970],
  // Canada
  'Toronto': [43.6532, -79.3832], 'Vancouver': [49.2827, -123.1207],
  'Montreal': [45.5017, -73.5673], 'Winnipeg': [49.8951, -97.1384],
  'Edmonton': [53.5461, -113.4938], 'Jasper': [52.8737, -118.0814], 'Kamloops': [50.6745, -120.3273],
  // Australie
  'Adelaide': [-34.9285, 138.6007], 'Darwin': [-12.4634, 130.8456], 'Sydney': [-33.8688, 151.2093],
  'Perth AU': [-31.9505, 115.8605], 'Melbourne': [-37.8136, 144.9631],
  'Alice Springs': [-23.6980, 133.8807], 'Brisbane': [-27.4698, 153.0251],
  'Cook': [-30.6010, 130.4070], 'Broken Hill': [-31.9500, 141.4667],
  // Afrique
  'Cairo': [30.0444, 31.2357], 'Luxor': [25.6872, 32.6396], 'Aswan': [24.0889, 32.8998],
  'Johannesburg': [-26.2041, 28.0473], 'Cape Town': [-33.9249, 18.4241],
  'Pretoria': [-25.7479, 28.2293], 'Durban': [-29.8587, 31.0218],
  'Kimberley': [-28.7282, 24.7499], 'Beaufort West': [-32.3568, 22.5837], 'De Aar': [-30.6500, 24.0167],
  // Russie / Trans-sibérien
  'Moscow': [55.7558, 37.6173], 'Yekaterinburg': [56.8389, 60.6057],
  'Novosibirsk': [54.9885, 82.9207], 'Irkutsk': [52.2978, 104.2964],
  'Ulan-Ude': [51.8272, 107.6060], 'Vladivostok': [43.1332, 131.9113],
  'St Petersburg': [59.9311, 30.3609],
};

/* ── Route / Operator types ──────────────────────────────────── */
interface Route {
  name: string;
  stops: string[];
  duration: string;
  freq: string;
}
interface Operator {
  name: string;
  color: string;
  region: string;
  routes: Route[];
}

/* ── Operators ───────────────────────────────────────────────── */
const OPERATORS: Operator[] = [
  {
    name: 'Nightjet (ÖBB) — Autriche', color: '#FF4560', region: 'Europe',
    routes: [
      { name: 'Vienna \u2194 Amsterdam', stops: ['Vienna','Linz','Salzburg','Munich','Nuremberg','Frankfurt','Cologne','Düsseldorf','Amsterdam'], duration: '~14-16h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Brussels', stops: ['Vienna','Linz','Salzburg','Munich','Frankfurt','Cologne','Brussels'], duration: '~13-15h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Paris', stops: ['Vienna','Innsbruck','Zurich','Basel','Paris'], duration: '~12-14h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Hamburg', stops: ['Vienna','Linz','Salzburg','Munich','Frankfurt','Hannover','Hamburg'], duration: '~12h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Berlin', stops: ['Vienna','Linz','Salzburg','Munich','Nuremberg','Leipzig','Berlin'], duration: '~11h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Rome', stops: ['Vienna','Villach','Venice','Bologna','Florence','Rome'], duration: '~13h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Milan', stops: ['Vienna','Innsbruck','Verona','Milan'], duration: '~9h', freq: 'Quotidien' },
      { name: 'Vienna \u2194 Warsaw', stops: ['Vienna','Brno','Ostrava','Katowice','Warsaw'], duration: '~11h', freq: 'Quotidien' },
      { name: 'Z\u00fcrich \u2194 Amsterdam', stops: ['Zurich','Basel','Frankfurt','Cologne','Düsseldorf','Amsterdam'], duration: '~11h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'European Sleeper', color: '#3A86FF', region: 'Europe',
    routes: [
      { name: 'Brussels \u2194 Prague', stops: ['Brussels','Rotterdam','Amsterdam','Hannover','Berlin','Dresden','Prague'], duration: '~16h', freq: 'Plusieurs fois/sem.' },
    ]
  },
  {
    name: 'Sn\u00e4llt\u00e5get \u2014 Scandinavie', color: '#22C55E', region: 'Europe',
    routes: [
      { name: 'Stockholm \u2194 Berlin (\u00e9t\u00e9)', stops: ['Stockholm','Göteborg','Malmö','Copenhagen','Hamburg','Berlin'], duration: '~17h', freq: 'Saisonnier (\u00e9t\u00e9)' },
    ]
  },
  {
    name: 'SNCF Intercit\u00e9s de Nuit', color: '#A855F7', region: 'Europe',
    routes: [
      { name: 'Paris \u2194 Nice', stops: ['Paris','Lyon','Marseille','Toulon','Nice'], duration: '~9h', freq: 'Quotidien' },
      { name: 'Paris \u2194 Brian\u00e7on', stops: ['Paris','Grenoble','Briançon'], duration: '~7h', freq: 'Plusieurs fois/sem.' },
      { name: 'Paris \u2194 Latour-de-Carol', stops: ['Paris','Toulouse','Perpignan','Latour-de-Carol'], duration: '~10h', freq: 'Plusieurs fois/sem.' },
      { name: 'Paris \u2194 Hendaye', stops: ['Paris','Bordeaux','Hendaye'], duration: '~8h', freq: 'Plusieurs fois/sem.' },
    ]
  },
  {
    name: 'Caledonian Sleeper \u2014 GB', color: '#06B6D4', region: 'Europe',
    routes: [
      { name: 'London \u2194 Inverness', stops: ['London','Edinburgh','Perth_UK','Inverness'], duration: '~11h', freq: 'Quotidien (sf dim.)' },
      { name: 'London \u2194 Aberdeen', stops: ['London','Edinburgh','Dundee','Aberdeen'], duration: '~11h', freq: 'Quotidien (sf dim.)' },
      { name: 'London \u2194 Fort William', stops: ['London','Edinburgh','Glasgow','Fort William'], duration: '~12h', freq: 'Quotidien (sf dim.)' },
    ]
  },
  {
    name: 'RENFE / Lusit\u00e2nia \u2014 Ib\u00e9rie', color: '#F59E0B', region: 'Europe',
    routes: [
      { name: 'Madrid \u2194 Lisbon', stops: ['Madrid','Mérida','Badajoz','Entroncamento','Lisbon'], duration: '~9h', freq: 'Quotidien' },
      { name: 'Madrid \u2194 A Coru\u00f1a', stops: ['Madrid','Valladolid','Palencia','A Coruña'], duration: '~8h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'VR \u2014 Laponie Express (Finlande)', color: '#FB923C', region: 'Europe',
    routes: [
      { name: 'Helsinki \u2194 Rovaniemi', stops: ['Helsinki','Tampere','Oulu','Rovaniemi'], duration: '~11h', freq: 'Quotidien' },
      { name: 'Helsinki \u2194 Kemij\u00e4rvi', stops: ['Helsinki','Tampere','Oulu','Rovaniemi','Kemijärvi'], duration: '~12h', freq: 'Quotidien' },
      { name: 'Helsinki \u2194 Kolari', stops: ['Helsinki','Tampere','Oulu','Kolari'], duration: '~13h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Russian Railways (RZD) \u2014 Trans-sib\u00e9rien', color: '#E11D48', region: 'Russie',
    routes: [
      { name: 'Moscow \u2194 Vladivostok', stops: ['Moscow','Yekaterinburg','Novosibirsk','Irkutsk','Ulan-Ude','Vladivostok'], duration: '~6 jours', freq: 'Quotidien' },
      { name: 'Moscow \u2194 St Petersburg', stops: ['Moscow','St Petersburg'], duration: '~8h', freq: 'Quotidien' },
      { name: 'Moscow \u2194 Irkutsk', stops: ['Moscow','Yekaterinburg','Novosibirsk','Irkutsk'], duration: '~3 jours', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Amtrak \u2014 \u00c9tats-Unis', color: '#0EA5E9', region: 'Am\u00e9riques',
    routes: [
      { name: 'Coast Starlight (LA \u2194 Seattle)', stops: ['Los Angeles','Sacramento','Portland OR','Seattle'], duration: '~35h', freq: 'Quotidien' },
      { name: 'Empire Builder (Chicago \u2194 Seattle)', stops: ['Chicago','Milwaukee','Minneapolis','Spokane','Seattle'], duration: '~46h', freq: 'Quotidien' },
      { name: 'Southwest Chief (Chicago \u2194 LA)', stops: ['Chicago','Kansas City','Albuquerque','Los Angeles'], duration: '~43h', freq: 'Quotidien' },
      { name: 'Lake Shore Ltd (NY \u2194 Chicago)', stops: ['New York','Albany','Buffalo','Cleveland','Chicago'], duration: '~19h', freq: 'Quotidien' },
      { name: 'Silver Star (NY \u2194 Miami)', stops: ['New York','Philadelphia','Washington DC','Savannah','Jacksonville','Tampa','Miami'], duration: '~28h', freq: 'Quotidien' },
      { name: 'City of New Orleans (Chicago \u2194 NOLA)', stops: ['Chicago','Memphis','New Orleans'], duration: '~19h', freq: 'Quotidien' },
      { name: 'Sunset Limited (LA \u2194 NOLA)', stops: ['Los Angeles','Tucson','El Paso','San Antonio','New Orleans'], duration: '~47h', freq: '3x/sem.' },
      { name: 'Crescent (NY \u2194 New Orleans)', stops: ['New York','Philadelphia','Washington DC','Charlotte','Atlanta','Birmingham','New Orleans'], duration: '~30h', freq: 'Quotidien' },
      { name: 'Texas Eagle (Chicago \u2194 San Antonio)', stops: ['Chicago','St Louis','Memphis','Dallas','San Antonio'], duration: '~65h', freq: 'Quotidien' },
      { name: 'Auto Train (Washington \u2194 Florida)', stops: ['Washington DC','Sanford'], duration: '~17h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'VIA Rail \u2014 Canada', color: '#F43F5E', region: 'Am\u00e9riques',
    routes: [
      { name: 'The Canadian (Toronto \u2194 Vancouver)', stops: ['Toronto','Winnipeg','Edmonton','Jasper','Kamloops','Vancouver'], duration: '~4 jours', freq: '3x/sem.' },
      { name: 'Toronto \u2194 Montreal', stops: ['Toronto','Montreal'], duration: '~11h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Indian Railways \u2014 Inde', color: '#F97316', region: 'Asie',
    routes: [
      { name: 'Rajdhani Express (Delhi \u2194 Mumbai)', stops: ['Delhi','Agra','Jaipur','Ahmedabad','Mumbai'], duration: '~17h', freq: 'Quotidien' },
      { name: 'Rajdhani Express (Delhi \u2194 Kolkata)', stops: ['Delhi','Agra','Kolkata'], duration: '~17h', freq: 'Quotidien' },
      { name: 'Rajdhani Express (Delhi \u2194 Chennai)', stops: ['Delhi','Agra','Hyderabad','Chennai'], duration: '~28h', freq: 'Quotidien' },
      { name: 'Duronto (Mumbai \u2194 Kolkata)', stops: ['Mumbai','Pune','Hyderabad','Kolkata'], duration: '~27h', freq: 'Plusieurs fois/sem.' },
      { name: 'Mumbai \u2194 Chennai', stops: ['Mumbai','Pune','Bengaluru','Chennai'], duration: '~23h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'China Railways (CR)', color: '#DC2626', region: 'Asie',
    routes: [
      { name: 'Beijing \u2194 Shanghai (nuit)', stops: ['Beijing','Shanghai'], duration: '~14-17h', freq: 'Quotidien' },
      { name: 'Beijing \u2194 Guangzhou', stops: ['Beijing','Wuhan','Guangzhou'], duration: '~21h', freq: 'Quotidien' },
      { name: 'Beijing \u2194 Harbin', stops: ['Beijing','Shenyang','Harbin'], duration: '~9h', freq: 'Quotidien' },
      { name: 'Shanghai \u2194 Kunming', stops: ['Shanghai','Wuhan','Nanning','Kunming'], duration: '~28h', freq: 'Quotidien' },
      { name: 'Beijing \u2194 Chengdu', stops: ['Beijing','Xian','Chengdu'], duration: '~27h', freq: 'Quotidien' },
      { name: 'P\u00e9kin \u2194 Hong Kong', stops: ['Beijing','Wuhan','Guangzhou','Hong Kong'], duration: '~24h', freq: 'Quotidien' },
      { name: 'P\u00e9kin \u2194 Urumqi', stops: ['Beijing','Xian','Lanzhou','Urumqi'], duration: '~35h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'JR Japan \u2014 Sunrise Express', color: '#8B5CF6', region: 'Asie',
    routes: [
      { name: 'Sunrise Izumo (Tokyo \u2194 Izumo)', stops: ['Tokyo','Okayama','Izumo'], duration: '~12h', freq: 'Quotidien' },
      { name: 'Sunrise Seto (Tokyo \u2194 Takamatsu)', stops: ['Tokyo','Okayama','Takamatsu'], duration: '~9h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Thai Railways', color: '#10B981', region: 'Asie',
    routes: [
      { name: 'Bangkok \u2194 Chiang Mai', stops: ['Bangkok','Chiang Mai'], duration: '~13h', freq: 'Quotidien' },
      { name: 'Bangkok \u2194 Butterworth (KL)', stops: ['Bangkok','Hat Yai','Padang Besar','Butterworth'], duration: '~14h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Great Southern Rail \u2014 Australie', color: '#EAB308', region: 'Oc\u00e9anie',
    routes: [
      { name: 'The Ghan (Adelaide \u2194 Darwin)', stops: ['Adelaide','Alice Springs','Darwin'], duration: '~54h', freq: 'Hebdo (hiver)' },
      { name: 'Indian Pacific (Sydney \u2194 Perth)', stops: ['Sydney','Broken Hill','Cook','Perth AU'], duration: '~65h', freq: 'Hebdo' },
      { name: 'The Overland (Melbourne \u2194 Adelaide)', stops: ['Melbourne','Adelaide'], duration: '~10h', freq: '2x/sem.' },
    ]
  },
  {
    name: 'Egyptian National Railways', color: '#14B8A6', region: 'Afrique',
    routes: [
      { name: 'Cairo \u2194 Luxor', stops: ['Cairo','Luxor'], duration: '~10h', freq: 'Quotidien' },
      { name: 'Cairo \u2194 Aswan', stops: ['Cairo','Luxor','Aswan'], duration: '~13h', freq: 'Quotidien' },
    ]
  },
  {
    name: 'Transnet / Shosholoza Meyl \u2014 Afrique du Sud', color: '#D97706', region: 'Afrique',
    routes: [
      { name: 'Johannesburg \u2194 Cape Town', stops: ['Johannesburg','Kimberley','Beaufort West','Cape Town'], duration: '~27h', freq: 'Plusieurs fois/sem.' },
      { name: 'Johannesburg \u2194 Durban', stops: ['Pretoria','Johannesburg','Durban'], duration: '~13h', freq: 'Quotidien' },
      { name: 'De Aar \u2194 Cape Town', stops: ['De Aar','Beaufort West','Cape Town'], duration: '~15h', freq: 'Plusieurs fois/sem.' },
    ]
  },
];

const regionColors: Record<string, string> = {
  'Europe': '#475569', 'Russie': '#9f1239', 'Am\u00e9riques': '#0369a1',
  'Asie': '#15803d', 'Oc\u00e9anie': '#854d0e', 'Afrique': '#92400e',
};

/* ── Haversine ───────────────────────────────────────────────── */
function haversine([la1, lo1]: [number, number], [la2, lo2]: [number, number]) {
  const R = 6371;
  const dl = ((la2 - la1) * Math.PI) / 180;
  const dL = ((lo2 - lo1) * Math.PI) / 180;
  const a =
    Math.sin(dl / 2) ** 2 +
    Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dL / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function routeDist(stops: string[]) {
  const pts = stops.map((s) => C[s]).filter(Boolean);
  let d = 0;
  for (let i = 0; i < pts.length - 1; i++) d += haversine(pts[i], pts[i + 1]);
  return Math.round(d);
}

/* ── Component ───────────────────────────────────────────────── */
export default function TrainMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [search, setSearch] = useState("");

  // Build sorted operators once
  const sortedOperators = useRef(
    OPERATORS.map((op) => ({
      ...op,
      routes: [...op.routes].sort((a, b) => routeDist(b.stops) - routeDist(a.stops)),
    }))
  );

  // Track polylines per operator for toggling
  const polylinesMap = useRef<Map<string, L.Polyline[]>>(new Map());
  const [hiddenOps, setHiddenOps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, { center: [25, 10], zoom: 2, zoomControl: false });
    mapInstance.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Draw all routes
    sortedOperators.current.forEach((op) => {
      const polylines: L.Polyline[] = [];
      op.routes.forEach((route) => {
        const pts = route.stops.map((s) => C[s]).filter(Boolean) as [number, number][];
        if (pts.length < 2) return;
        const dist = routeDist(route.stops);

        const poly = L.polyline(pts, {
          color: op.color,
          weight: 2,
          opacity: 0.65,
          smoothFactor: 1.8,
        }).addTo(map);

        const html = `
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px">${route.name}</div>
          <div style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;margin-bottom:10px;background:${op.color}22;color:${op.color};border:1px solid ${op.color}55">${op.name}</div>
          <div style="display:grid;grid-template-columns:72px 1fr;gap:4px 6px;margin-bottom:8px">
            <div style="font-size:10px;color:#475569">Dur\u00e9e</div><div style="font-size:10px;color:#94a3b8">${route.duration}</div>
            <div style="font-size:10px;color:#475569">Fr\u00e9quence</div><div style="font-size:10px;color:#94a3b8">${route.freq}</div>
            <div style="font-size:10px;color:#475569">Distance</div><div style="font-size:10px;color:#94a3b8">~${dist.toLocaleString()} km</div>
          </div>
          <div style="font-size:9.5px;color:#334155;margin-top:8px;line-height:1.7;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)">${route.stops.join(" \u2192 ")}</div>`;

        poly.bindPopup(html, { maxWidth: 300 });
        poly.on("mouseover", function (this: L.Polyline) {
          this.setStyle({ weight: 5, opacity: 1 });
        });
        poly.on("mouseout", function (this: L.Polyline) {
          this.setStyle({ weight: 2, opacity: 0.65 });
        });
        polylines.push(poly);
      });
      polylinesMap.current.set(op.name, polylines);
    });

    // Endpoint markers
    const endpoints = new Set<string>();
    OPERATORS.forEach((op) =>
      op.routes.forEach((r) => {
        if (r.stops.length) {
          endpoints.add(r.stops[0]);
          endpoints.add(r.stops[r.stops.length - 1]);
        }
      })
    );
    endpoints.forEach((name) => {
      const coord = C[name];
      if (!coord) return;
      L.circleMarker(coord, {
        radius: 4,
        fillColor: "#f8fafc",
        color: "#0f172a",
        weight: 1.5,
        fillOpacity: 0.9,
      })
        .bindTooltip(name, {
          permanent: false,
          direction: "top",
          className: "city-tip",
        })
        .addTo(map);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  function toggleOperator(opName: string) {
    const map = mapInstance.current;
    if (!map) return;
    const polylines = polylinesMap.current.get(opName);
    if (!polylines) return;

    setHiddenOps((prev) => {
      const next = new Set(prev);
      if (next.has(opName)) {
        next.delete(opName);
        polylines.forEach((p) => p.addTo(map));
      } else {
        next.add(opName);
        polylines.forEach((p) => p.remove());
      }
      return next;
    });
  }

  function focusRoute(stops: string[]) {
    const map = mapInstance.current;
    if (!map) return;
    const pts = stops.map((s) => C[s]).filter(Boolean) as [number, number][];
    if (pts.length < 2) return;
    map.fitBounds(pts as L.LatLngBoundsExpression, { padding: [60, 60] });
  }

  // Group by region
  const regions: Record<string, typeof sortedOperators.current> = {};
  sortedOperators.current.forEach((op) => {
    if (!regions[op.region]) regions[op.region] = [];
    regions[op.region].push(op);
  });

  const q = search.toLowerCase().trim();

  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="relative w-full h-[100vh]">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* App Navigation Bar */}
      <div
        className="absolute top-[10px] left-[10px] right-[10px] z-[1100] flex items-center gap-2"
        style={{ pointerEvents: "none" }}
      >
        <div style={{ pointerEvents: "auto" }} className="relative">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg transition-all"
            style={{
              background: "rgba(6,10,24,0.95)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e87722",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: "14px" }}>{navOpen ? "✕" : "☰"}</span>
            <span>Charles Tools</span>
          </button>

          {navOpen && (
            <div
              className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden"
              style={{
                background: "rgba(6,10,24,0.97)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Charles Tools</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>HCLSoftware</div>
              </div>
              {[
                { href: "/", label: "Dashboard", icon: "🏠" },
                { href: "/linkedin-generator", label: "LinkedIn Generator", icon: "✏️" },
                { href: "/trains", label: "Trains de Nuit", icon: "🚂", active: true },
                { href: "/tech-comparison", label: "Tech Comparison", icon: "📊" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: item.active ? "#e87722" : "#94a3b8",
                    background: item.active ? "rgba(232,119,34,0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!item.active) (e.currentTarget.style.background = "rgba(255,255,255,0.05)");
                  }}
                  onMouseLeave={(e) => {
                    if (!item.active) (e.currentTarget.style.background = "transparent");
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div
        className="absolute top-[60px] left-[10px] z-[900] w-[290px] max-h-[calc(100vh-70px)] overflow-y-auto rounded-[14px] p-[18px]"
        style={{
          background: "rgba(6,10,24,0.95)",
          backdropFilter: "blur(14px)",
          color: "#e2e8f0",
          boxShadow: "0 8px 36px rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.09)",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.12) transparent",
        }}
      >
        <div className="text-[15px] font-bold text-white mb-[2px]">
          {"\uD83C\uDF19"} Trains de Nuit — Monde
        </div>
        <div className="text-[10px] mb-[14px] leading-[1.6]" style={{ color: "#475569" }}>
          Principales lignes internationales &amp; nationales &middot; 2024-2025
          <br />
          Cliquez sur une ligne pour les d&eacute;tails
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={"\uD83D\uDD0D Rechercher une ligne..."}
          className="w-full mb-[12px] px-[10px] py-[6px] rounded-[7px] text-[11px] outline-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0",
          }}
        />

        {/* Legend / Operators */}
        {Object.entries(regions).map(([region, ops]) => (
          <div key={region}>
            <div
              className="text-[9px] font-bold tracking-[0.08em] uppercase py-[6px] pl-[8px]"
              style={{ color: regionColors[region] || "#475569" }}
            >
              {region}
            </div>
            {ops.map((op) => {
              const isHidden = hiddenOps.has(op.name);
              return (
                <div key={op.name} className="mb-[10px]">
                  {/* Operator header */}
                  <div
                    className="flex items-center gap-[8px] py-[5px] px-[7px] rounded-[6px] cursor-pointer select-none transition-colors hover:bg-white/5"
                  >
                    <div
                      className="w-[10px] h-[10px] rounded-full shrink-0"
                      style={{ background: op.color }}
                    />
                    <div className="text-[11.5px] font-semibold flex-1">{op.name}</div>
                    <button
                      onClick={() => toggleOperator(op.name)}
                      className="text-[9px] px-[6px] py-[2px] rounded-[4px] cursor-pointer transition-all"
                      style={{
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "none",
                        color: "#64748b",
                      }}
                    >
                      {isHidden ? "Afficher" : "Masquer"}
                    </button>
                  </div>

                  {/* Routes list */}
                  <div
                    className="py-[2px] px-[8px] pl-[26px]"
                    style={{ opacity: isHidden ? 0.35 : 1 }}
                  >
                    {op.routes.map((route) => {
                      const dist = routeDist(route.stops);
                      const matchesSearch = !q || route.name.toLowerCase().includes(q);
                      if (!matchesSearch) return null;
                      return (
                        <div
                          key={route.name}
                          onClick={() => focusRoute(route.stops)}
                          className="text-[10px] py-[3px] px-[5px] cursor-pointer rounded-[4px] flex justify-between items-center transition-all hover:text-[#e2e8f0] hover:bg-white/[0.06]"
                          style={{ color: "#475569" }}
                        >
                          <span>{route.name}</span>
                          <span
                            className="text-[9px] shrink-0 ml-[4px]"
                            style={{ color: "#334155" }}
                          >
                            {dist.toLocaleString()} km
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Divider + Note */}
        <div className="my-[12px]" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
        <div
          className="text-[10px] leading-[1.6] p-[8px] rounded-[6px]"
          style={{
            color: "#334155",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          Routes et horaires approximatifs.
          <br />
          V&eacute;rifiez disponibilit&eacute;s aupr&egrave;s des op&eacute;rateurs.
        </div>
      </div>

      {/* Global styles for leaflet popups and tooltips */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(6, 10, 24, 0.97) !important;
          color: #e2e8f0 !important;
          border-radius: 10px !important;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-popup-content {
          margin: 14px 16px !important;
          min-width: 220px;
        }
        .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-popup-close-button {
          color: #475569 !important;
          font-size: 18px !important;
          top: 6px !important;
          right: 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #e2e8f0 !important;
        }
        .city-tip {
          background: rgba(6, 10, 24, 0.92) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          color: #cbd5e1 !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          border-radius: 5px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
          padding: 3px 8px !important;
        }
        .city-tip::before {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
