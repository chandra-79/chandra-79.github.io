// Flags drawn by Ziggle (see flags.js). Most designs are pure geometry, drawn complete. Since 2.3 a few flags
// with an emblem (a leaf, a tree, a sun) are included with the emblem drawn simply in Ziggle's own shapes;
// those carry `simplified: true` and the trainer says the emblem is simplified. Coats of arms stay out.
// code: ISO 3166 (or the UK subdivision code) · ratio: width:height · continent is left empty for countries
// that span two continents, so the quiz never asks an unfair question.
import { WORLD } from './flags-world.js';

const W = '#ffffff', K = '#000000';
const tri = (kind, colors, weights) => [kind, colors, weights];


// ---- Emblem shapes, drawn by Ziggle in a 100×100 box ----
const f1 = n => Math.round(n * 10) / 10;
/** A sun: a disc with `rays` straight rays (pointed triangles). */
const sunPath = (rays, inner = 26, outer = 48, disc = 22) => {
  let d = `M${50 - disc},50 a${disc},${disc} 0 1 0 ${disc * 2},0 a${disc},${disc} 0 1 0 ${-disc * 2},0 Z`;
  for (let i = 0; i < rays; i++) {
    const a = (i * 2 * Math.PI) / rays, w = Math.PI / rays * 0.55;
    const p = (r, t) => `${f1(50 + r * Math.cos(t))},${f1(50 + r * Math.sin(t))}`;
    d += ` M${p(inner, a - w)} L${p(outer, a)} L${p(inner, a + w)} Z`;
  }
  return d;
};
const LEAF = 'M50,2 L57,16 L66,12 L63,36 L80,22 L84,30 L96,28 L90,46 L98,52 L72,72 L76,82 L54,78 L54,98 L46,98 L46,78 L24,82 L28,72 L2,52 L10,46 L4,28 L16,30 L20,22 L37,36 L34,12 L43,16 Z';
const CEDAR = 'M50,4 L64,26 L57,26 L72,46 L62,46 L80,68 L55,68 L55,88 L45,88 L45,68 L20,68 L38,46 L28,46 L43,26 L36,26 Z';
const RING = (r, w = 0) => `M${50 - r},50 a${r},${r} 0 1 0 ${r * 2},0 a${r},${r} 0 1 0 ${-r * 2},0 Z${w ? ` M${50 - r + w},50 a${r - w},${r - w} 0 1 1 ${(r - w) * 2},0 a${r - w},${r - w} 0 1 1 ${-(r - w) * 2},0 Z` : ''}`;
const HEXAGRAM = 'M50,8 L86,71 L14,71 Z M50,92 L14,29 L86,29 Z';
// Uruguay and Argentina share a sun with a face in their real flags; Ziggle draws a plain sun.

export const FLAGS = Object.freeze([
  // ---- Europe ----
  { code: 'FR', name: 'France', capital: 'Paris', continent: 'Europe', ratio: [3, 2], draw: [tri('v', ['#0055a4', W, '#ef4135'])] },
  { code: 'IT', name: 'Italy', capital: 'Rome', continent: 'Europe', ratio: [3, 2], draw: [tri('v', ['#009246', '#f1f2f1', '#ce2b37'])] },
  { code: 'IE', name: 'Ireland', capital: 'Dublin', continent: 'Europe', ratio: [2, 1], draw: [tri('v', ['#169b62', W, '#ff883e'])] },
  { code: 'BE', name: 'Belgium', capital: 'Brussels', continent: 'Europe', ratio: [15, 13], draw: [tri('v', [K, '#fdda24', '#ef3340'])] },
  { code: 'RO', name: 'Romania', capital: 'Bucharest', continent: 'Europe', ratio: [3, 2], draw: [tri('v', ['#002b7f', '#fcd116', '#ce1126'])] },
  { code: 'DE', name: 'Germany', capital: 'Berlin', continent: 'Europe', ratio: [5, 3], draw: [tri('h', [K, '#dd0000', '#ffce00'])] },
  { code: 'NL', name: 'Netherlands', capital: 'Amsterdam', continent: 'Europe', ratio: [3, 2], draw: [tri('h', ['#ae1c28', W, '#21468b'])] },
  { code: 'LU', name: 'Luxembourg', capital: 'Luxembourg', continent: 'Europe', ratio: [5, 3], draw: [tri('h', ['#ea141d', W, '#51adda'])] },
  { code: 'RU', name: 'Russia', capital: 'Moscow', continent: '', ratio: [3, 2], draw: [tri('h', [W, '#0039a6', '#d52b1e'])] },
  { code: 'AT', name: 'Austria', capital: 'Vienna', continent: 'Europe', ratio: [3, 2], draw: [tri('h', ['#ed2939', W, '#ed2939'])] },
  { code: 'HU', name: 'Hungary', capital: 'Budapest', continent: 'Europe', ratio: [2, 1], draw: [tri('h', ['#ce2939', W, '#477050'])] },
  { code: 'BG', name: 'Bulgaria', capital: 'Sofia', continent: 'Europe', ratio: [5, 3], draw: [tri('h', [W, '#00966e', '#d62612'])] },
  { code: 'EE', name: 'Estonia', capital: 'Tallinn', continent: 'Europe', ratio: [11, 7], draw: [tri('h', ['#0072ce', K, W])] },
  { code: 'LT', name: 'Lithuania', capital: 'Vilnius', continent: 'Europe', ratio: [5, 3], draw: [tri('h', ['#fdb913', '#006a44', '#c1272d'])] },
  { code: 'LV', name: 'Latvia', capital: 'Riga', continent: 'Europe', ratio: [2, 1], draw: [tri('h', ['#9e3039', W, '#9e3039'], [2, 1, 2])] },
  { code: 'PL', name: 'Poland', capital: 'Warsaw', continent: 'Europe', ratio: [8, 5], draw: [tri('h', [W, '#dc143c'])] },
  { code: 'UA', name: 'Ukraine', capital: 'Kyiv', continent: 'Europe', ratio: [3, 2], draw: [tri('h', ['#0057b7', '#ffd700'])] },
  { code: 'MC', name: 'Monaco', capital: 'Monaco', continent: 'Europe', ratio: [5, 4], draw: [tri('h', ['#ce1126', W])] },
  { code: 'SE', name: 'Sweden', capital: 'Stockholm', continent: 'Europe', ratio: [16, 10], draw: [['rect', 0, 0, 1, 1, '#006aa7'], ['cross', 6 / 16, 0.5, 0.2, '#fecc02']] },
  { code: 'NO', name: 'Norway', capital: 'Oslo', continent: 'Europe', ratio: [22, 16], draw: [['rect', 0, 0, 1, 1, '#ba0c2f'], ['cross', 8 / 22, 0.5, 0.25, W], ['cross', 8 / 22, 0.5, 0.125, '#00205b']] },
  { code: 'DK', name: 'Denmark', capital: 'Copenhagen', continent: 'Europe', ratio: [37, 28], draw: [['rect', 0, 0, 1, 1, '#c8102e'], ['cross', 14 / 37, 0.5, 4 / 28, W]] },
  { code: 'FI', name: 'Finland', capital: 'Helsinki', continent: 'Europe', ratio: [18, 11], draw: [['cross', 6.5 / 18, 0.5, 3 / 11, '#002f6c']] },
  { code: 'IS', name: 'Iceland', capital: 'Reykjavik', continent: 'Europe', ratio: [25, 18], draw: [['rect', 0, 0, 1, 1, '#02529c'], ['cross', 9 / 25, 0.5, 4 / 18, W], ['cross', 9 / 25, 0.5, 2 / 18, '#dc1e35']] },
  { code: 'CH', name: 'Switzerland', capital: 'Bern', continent: 'Europe', ratio: [1, 1], draw: [['rect', 0, 0, 1, 1, '#da291c'], ['rect', 6 / 32, 13 / 32, 20 / 32, 6 / 32, W], ['rect', 13 / 32, 6 / 32, 6 / 32, 20 / 32, W]] },
  { code: 'GR', name: 'Greece', capital: 'Athens', continent: 'Europe', ratio: [3, 2], draw: [tri('h', ['#0d5eaf', W, '#0d5eaf', W, '#0d5eaf', W, '#0d5eaf', W, '#0d5eaf']), ['rect', 0, 0, 10 / 27, 5 / 9, '#0d5eaf'], ['rect', 0, 2 / 9, 10 / 27, 1 / 9, W], ['rect', 4 / 27, 0, 2 / 27, 5 / 9, W]] },
  { code: 'CZ', name: 'Czechia', capital: 'Prague', continent: 'Europe', ratio: [3, 2], draw: [tri('h', [W, '#d7141a']), ['poly', [[0, 0], [0.5, 0.5], [0, 1]], '#11457e']] },
  { code: 'GB-ENG', name: 'England', capital: 'London', continent: 'Europe', ratio: [5, 3], note: 'One of the four nations of the United Kingdom. Its emoji flag uses a tag sequence.', draw: [['cross', 0.5, 0.5, 0.2, '#ce1124']] },
  { code: 'GB-SCT', name: 'Scotland', capital: 'Edinburgh', continent: 'Europe', ratio: [5, 3], note: 'One of the four nations of the United Kingdom. Its emoji flag uses a tag sequence.', draw: [['rect', 0, 0, 1, 1, '#005eb8'], ['saltire', 0.2, W]] },
  // ---- Africa ----
  { code: 'NG', name: 'Nigeria', capital: 'Abuja', continent: 'Africa', ratio: [2, 1], draw: [tri('v', ['#008751', W, '#008751'])] },
  { code: 'ML', name: 'Mali', capital: 'Bamako', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#14b53a', '#fcd116', '#ce1126'])] },
  { code: 'GN', name: 'Guinea', capital: 'Conakry', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#ce1126', '#fcd116', '#009460'])] },
  { code: 'CI', name: 'Côte d’Ivoire', capital: 'Yamoussoukro', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#f77f00', W, '#009e60'])] },
  { code: 'TD', name: 'Chad', capital: 'N’Djamena', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#002664', '#fecb00', '#c60c30'])] },
  { code: 'SN', name: 'Senegal', capital: 'Dakar', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#00853f', '#fdef42', '#e31b23']), ['star', 0.5, 0.5, 0.17, '#00853f']] },
  { code: 'CM', name: 'Cameroon', capital: 'Yaoundé', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#007a5e', '#ce1126', '#fcd116']), ['star', 0.5, 0.5, 0.17, '#fcd116']] },
  { code: 'SL', name: 'Sierra Leone', capital: 'Freetown', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#1eb53a', W, '#0072c6'])] },
  { code: 'GA', name: 'Gabon', capital: 'Libreville', continent: 'Africa', ratio: [4, 3], draw: [tri('h', ['#009e60', '#fcd116', '#3a75c4'])] },
  { code: 'GH', name: 'Ghana', capital: 'Accra', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#ce1126', '#fcd116', '#006b3f']), ['star', 0.5, 0.5, 0.16, K]] },
  { code: 'BF', name: 'Burkina Faso', capital: 'Ouagadougou', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#ef2b2d', '#009e49']), ['star', 0.5, 0.5, 0.16, '#fcd116']] },
  { code: 'MU', name: 'Mauritius', capital: 'Port Louis', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#ea2839', '#1a206d', '#ffd500', '#00a551'])] },
  { code: 'GM', name: 'Gambia', capital: 'Banjul', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#ce1126', W, '#0c1c8c', W, '#3a7728'], [6, 1, 4, 1, 6])] },
  { code: 'BW', name: 'Botswana', capital: 'Gaborone', continent: 'Africa', ratio: [3, 2], draw: [tri('h', ['#75aadb', W, K, W, '#75aadb'], [9, 1, 4, 1, 9])] },
  { code: 'BJ', name: 'Benin', capital: 'Porto-Novo', continent: 'Africa', ratio: [3, 2], draw: [['rect', 0, 0, 1, 0.5, '#fcd116'], ['rect', 0, 0.5, 1, 0.5, '#e8112d'], ['rect', 0, 0, 0.4, 1, '#008751']] },
  { code: 'MG', name: 'Madagascar', capital: 'Antananarivo', continent: 'Africa', ratio: [3, 2], draw: [['rect', 0, 0, 1, 0.5, '#fc3d32'], ['rect', 0, 0.5, 1, 0.5, '#007e3a'], ['rect', 0, 0, 1 / 3, 1, W]] },
  { code: 'SO', name: 'Somalia', capital: 'Mogadishu', continent: 'Africa', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#4189dd'], ['star', 0.5, 0.5, 0.22, W]] },
  { code: 'DZ', name: 'Algeria', capital: 'Algiers', continent: 'Africa', ratio: [3, 2], draw: [tri('v', ['#006633', W]), ['crescent', 0.5, 0.5, 0.25, 0.0625, 0.2, '#d21034', '#ffffff'], ['star', 0.56, 0.5, 0.1, '#d21034', 5, -90]] },
  { code: 'TN', name: 'Tunisia', capital: 'Tunis', continent: 'Africa', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#e70013'], ['disc', 0.5, 0.5, 0.25, W], ['crescent', 0.5, 0.5, 0.1875, 0.05, 0.15, '#e70013', W], ['star', 0.53, 0.5, 0.11, '#e70013', 5, -90]] },
  { code: 'LR', name: 'Liberia', capital: 'Monrovia', continent: 'Africa', ratio: [19, 10], draw: [tri('h', ['#bf0a30', W, '#bf0a30', W, '#bf0a30', W, '#bf0a30', W, '#bf0a30', W, '#bf0a30']), ['rect', 0, 0, (5 / 11) * (10 / 19), 5 / 11, '#002868'], ['star', ((5 / 11) * (10 / 19)) / 2, 5 / 22, 0.15, W]] },
  // ---- Asia ----
  { code: 'JP', name: 'Japan', capital: 'Tokyo', continent: 'Asia', ratio: [3, 2], draw: [['disc', 0.5, 0.5, 0.3, '#bc002d']] },
  { code: 'BD', name: 'Bangladesh', capital: 'Dhaka', continent: 'Asia', ratio: [5, 3], draw: [['rect', 0, 0, 1, 1, '#006a4e'], ['disc', 0.45, 0.5, 1 / 3, '#f42a41']] },
  { code: 'LA', name: 'Laos', capital: 'Vientiane', continent: 'Asia', ratio: [3, 2], draw: [tri('h', ['#ce1126', '#002868', '#ce1126'], [1, 2, 1]), ['disc', 0.5, 0.5, 0.2, W]] },
  { code: 'TH', name: 'Thailand', capital: 'Bangkok', continent: 'Asia', ratio: [3, 2], draw: [tri('h', ['#a51931', '#f4f5f8', '#2d2a4a', '#f4f5f8', '#a51931'], [1, 1, 2, 1, 1])] },
  { code: 'VN', name: 'Vietnam', capital: 'Hanoi', continent: 'Asia', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#da251d'], ['star', 0.5, 0.5, 0.3, '#ffff00']] },
  { code: 'CN', name: 'China', capital: 'Beijing', continent: 'Asia', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#ee1c25'], ['star', 5 / 30, 5 / 20, 0.15, '#ffff00'], /* each small star points one tip at the big star */ ['star', 10 / 30, 2 / 20, 0.05, '#ffff00', 5, 239.04], ['star', 12 / 30, 4 / 20, 0.05, '#ffff00', 5, 261.87], ['star', 12 / 30, 7 / 20, 0.05, '#ffff00', 5, -74.05], ['star', 10 / 30, 9 / 20, 0.05, '#ffff00', 5, -51.34]] },
  { code: 'IN', name: 'India', capital: 'New Delhi', continent: 'Asia', ratio: [3, 2], draw: [tri('h', ['#ff9933', W, '#138808']), ['ring', 0.5, 0.5, 0.125, 0.014, '#000080', 24]] },
  { code: 'PK', name: 'Pakistan', capital: 'Islamabad', continent: 'Asia', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#01411c'], ['rect', 0, 0, 0.25, 1, W], ['crescent', 0.62, 0.5, 0.3, 0.09, 0.27, W, '#01411c'], ['star', 0.7, 0.4, 0.1, W, 5, 50]] },
  { code: 'TR', name: 'Turkey', capital: 'Ankara', continent: '', ratio: [3, 2], draw: [['rect', 0, 0, 1, 1, '#e30a17'], ['crescent', 1 / 3, 0.5, 0.25, 0.0625, 0.2, W, '#e30a17'], ['star', 0.53, 0.5, 0.125, W, 5, -90]] },
  { code: 'AM', name: 'Armenia', capital: 'Yerevan', continent: 'Asia', ratio: [2, 1], draw: [tri('h', ['#d90012', '#0033a0', '#f2a800'])] },
  { code: 'AZ', name: 'Azerbaijan', capital: 'Baku', continent: 'Asia', ratio: [2, 1], draw: [tri('h', ['#00b5e2', '#ef3340', '#509e2f']), ['crescent', 0.47, 0.5, 0.15, 0.04, 0.125, W, '#ef3340'], ['star', 0.535, 0.5, 0.07, W, 8, 0, 0.5]] },
  { code: 'KW', name: 'Kuwait', capital: 'Kuwait City', continent: 'Asia', ratio: [2, 1], draw: [tri('h', ['#007a3d', W, '#ce1126']), ['poly', [[0, 0], [0.25, 1 / 3], [0.25, 2 / 3], [0, 1]], K]] },
  { code: 'AE', name: 'United Arab Emirates', capital: 'Abu Dhabi', continent: 'Asia', ratio: [2, 1], draw: [tri('h', ['#00732f', W, K]), ['rect', 0, 0, 0.25, 1, '#ff0000']] },
  { code: 'QA', name: 'Qatar', capital: 'Doha', continent: 'Asia', ratio: [28, 11], draw: [['rect', 0, 0, 1, 1, '#8a1538'], ['poly', [[0, 0], [0.29, 0], ...Array.from({ length: 9 }, (_, i) => [[0.39, (i + 0.5) / 9], [0.29, (i + 1) / 9]]).flat(), [0, 1]], W]] },
  { code: 'BH', name: 'Bahrain', capital: 'Manama', continent: 'Asia', ratio: [5, 3], draw: [['rect', 0, 0, 1, 1, '#ce1126'], ['poly', [[0, 0], [0.25, 0], ...Array.from({ length: 5 }, (_, i) => [[0.4, (i + 0.5) / 5], [0.25, (i + 1) / 5]]).flat(), [0, 1]], W]] },
  // ---- North America ----
  { code: 'US', name: 'United States', capital: 'Washington, D.C.', continent: 'North America', ratio: [19, 10], draw: [tri('h', ['#b22234', W, '#b22234', W, '#b22234', W, '#b22234', W, '#b22234', W, '#b22234', W, '#b22234']), ['rect', 0, 0, 0.4, 7 / 13, '#3c3b6e'], ['stars-grid', 0, 0, 0.4, 7 / 13, 9, 0.0308, W]] },
  { code: 'CU', name: 'Cuba', capital: 'Havana', continent: 'North America', ratio: [2, 1], draw: [tri('h', ['#002a8f', W, '#002a8f', W, '#002a8f']), ['poly', [[0, 0], [0.433, 0.5], [0, 1]], '#cf142b'], ['star', 0.144, 0.5, 0.13, W]] },
  { code: 'PA', name: 'Panama', capital: 'Panama City', continent: 'North America', ratio: [3, 2], draw: [['rect', 0.5, 0, 0.5, 0.5, '#d21034'], ['rect', 0, 0.5, 0.5, 0.5, '#005293'], ['star', 0.25, 0.25, 0.12, '#005293'], ['star', 0.75, 0.75, 0.12, '#d21034']] },
  { code: 'BS', name: 'The Bahamas', capital: 'Nassau', continent: 'North America', ratio: [2, 1], draw: [tri('h', ['#00778b', '#ffc72c', '#00778b']), ['poly', [[0, 0], [0.433, 0.5], [0, 1]], K]] },
  { code: 'JM', name: 'Jamaica', capital: 'Kingston', continent: 'North America', ratio: [2, 1], draw: [['rect', 0, 0, 1, 1, '#009b3a'], ['poly', [[0, 0], [0.5, 0.5], [0, 1]], K], ['poly', [[1, 0], [0.5, 0.5], [1, 1]], K], ['saltire', 0.14, '#fed100']] },
  // ---- South America ----
  { code: 'CO', name: 'Colombia', capital: 'Bogotá', continent: 'South America', ratio: [3, 2], draw: [tri('h', ['#fcd116', '#003893', '#ce1126'], [2, 1, 1])] },
  { code: 'CL', name: 'Chile', capital: 'Santiago', continent: 'South America', ratio: [3, 2], draw: [tri('h', [W, '#d52b1e']), ['rect', 0, 0, 1 / 3, 0.5, '#0039a6'], ['star', 1 / 6, 0.25, 0.12, W]] },
  { code: 'PE', name: 'Peru', capital: 'Lima', continent: 'South America', ratio: [3, 2], note: 'This is Peru’s civil flag; the state flag adds a coat of arms.', draw: [tri('v', ['#d91023', W, '#d91023'])] },
  // ---- Oceania ----
  { code: 'PW', name: 'Palau', capital: 'Ngerulmud', continent: 'Oceania', ratio: [8, 5], draw: [['rect', 0, 0, 1, 1, '#4aadd6'], ['disc', 0.4375, 0.5, 0.3, '#ffde00']] },
  { code: 'FM', name: 'Micronesia', capital: 'Palikir', continent: 'Oceania', ratio: [19, 10], draw: [['rect', 0, 0, 1, 1, '#75b2dd'], ['star', 0.5, 0.2, 0.1, W], ['star', 0.5, 0.8, 0.1, W], ['star', 0.5 - 0.16, 0.5, 0.1, W], ['star', 0.5 + 0.16, 0.5, 0.1, W]] },
  // ---- Added in 1.6 ----
  { code: 'SR', name: 'Suriname', capital: 'Paramaribo', continent: 'South America', ratio: [3, 2], draw: [tri('h', ['#377e3f', W, '#b40a2d', W, '#377e3f'], [2, 1, 4, 1, 2]), ['star', 0.5, 0.5, 0.2, '#ecc81d']] },
  { code: 'BO', name: 'Bolivia', capital: 'Sucre', continent: 'South America', ratio: [22, 15], note: 'Sucre is the constitutional capital; the government sits in La Paz. This is the civil flag, without the coat of arms.', draw: [tri('h', ['#d52b1e', '#f9e300', '#007934'])] },
  { code: 'GY', name: 'Guyana', capital: 'Georgetown', continent: 'South America', ratio: [5, 3], note: 'Its nickname is the Golden Arrowhead.', draw: [['rect', 0, 0, 1, 1, '#009e49'], ['poly', [[0, 0], [1, 0.5], [0, 1]], W], ['poly', [[0, 0.04], [0.94, 0.5], [0, 0.96]], '#fcd116'], ['poly', [[0, 0], [0.5, 0.5], [0, 1]], K], ['poly', [[0, 0.06], [0.45, 0.5], [0, 0.94]], '#ce1126']] },
  { code: 'HN', name: 'Honduras', capital: 'Tegucigalpa', continent: 'North America', ratio: [2, 1], note: 'The five stars stand for the five nations of the old Federal Republic of Central America.', draw: [tri('h', ['#00bce4', W, '#00bce4']), ['star', 0.5, 0.5, 0.045, '#00bce4'], ['star', 0.42, 0.42, 0.045, '#00bce4'], ['star', 0.58, 0.42, 0.045, '#00bce4'], ['star', 0.42, 0.58, 0.045, '#00bce4'], ['star', 0.58, 0.58, 0.045, '#00bce4']] },
  { code: 'TT', name: 'Trinidad and Tobago', capital: 'Port of Spain', continent: 'North America', ratio: [5, 3], draw: [['rect', 0, 0, 1, 1, '#da1a35'], ['poly', [[0, 0], [0.25, 0], [1, 1], [0.75, 1]], W], ['poly', [[0.035, 0], [0.215, 0], [0.965, 1], [0.785, 1]], K]] },
  { code: 'LC', name: 'Saint Lucia', capital: 'Castries', continent: 'North America', ratio: [2, 1], note: 'The triangles echo the island’s twin volcanic peaks, the Pitons.', draw: [['rect', 0, 0, 1, 1, '#66ccff'], ['poly', [[0.5, 0.1], [0.667, 0.9], [0.333, 0.9]], W], ['poly', [[0.5, 0.2], [0.635, 0.9], [0.365, 0.9]], K], ['poly', [[0.5, 0.5], [0.667, 0.9], [0.333, 0.9]], '#fcd116']] },
  { code: 'NR', name: 'Nauru', capital: 'Yaren', continent: 'Oceania', ratio: [2, 1], note: 'Nauru has no official capital; its government sits in Yaren. The star’s 12 points stand for its 12 original tribes.', draw: [['rect', 0, 0, 1, 1, '#002b7f'], ['rect', 0, 11 / 24, 1, 1 / 12, '#ffc61e'], ['star', 0.25, 0.72, 0.13, W, 12, 0, 0.6]] },
  { code: 'TO', name: 'Tonga', capital: 'Nukuʻalofa', continent: 'Oceania', ratio: [2, 1], draw: [['rect', 0, 0, 1, 1, '#c10000'], ['rect', 0, 0, 0.375, 0.5, W], ['rect', 0.1625, 0.07, 0.05, 0.36, '#c10000'], ['rect', 0.1, 0.2, 0.175, 0.1, '#c10000']] },
  { code: 'WS', name: 'Samoa', capital: 'Apia', continent: 'Oceania', ratio: [2, 1], note: 'The five stars are the Southern Cross.', draw: [['rect', 0, 0, 1, 1, '#ce1126'], ['rect', 0, 0, 0.5, 0.5, '#002b7f'], ['star', 0.25, 0.1, 0.05, W], ['star', 0.15, 0.25, 0.05, W], ['star', 0.35, 0.22, 0.045, W], ['star', 0.25, 0.4, 0.055, W], ['star', 0.3, 0.29, 0.03, W]] },
  // ---- Added in 2.3: flags with an emblem, drawn simply ----
  { code: 'CA', name: 'Canada', capital: 'Ottawa', continent: 'North America', ratio: [2, 1], simplified: true, draw: [['v', ['#d52b1e', W, '#d52b1e'], [1, 2, 1]], ['shape', [0.385, 0.2, 0.23, 0.6], LEAF, '#d52b1e']] },
  { code: 'LB', name: 'Lebanon', capital: 'Beirut', continent: 'Asia', ratio: [3, 2], simplified: true, draw: [['h', ['#ed1c24', W, '#ed1c24'], [1, 2, 1]], ['shape', [0.36, 0.27, 0.28, 0.46], CEDAR, '#00a651']] },
  { code: 'AR', name: 'Argentina', capital: 'Buenos Aires', continent: 'South America', ratio: [8, 5], simplified: true, draw: [['h', ['#74acdf', W, '#74acdf']], ['shape', [0.4, 0.34, 0.2, 0.32], sunPath(16), '#f6b40e']] },
  { code: 'UY', name: 'Uruguay', capital: 'Montevideo', continent: 'South America', ratio: [3, 2], simplified: true, draw: [['h', [W, '#0038a8', W, '#0038a8', W, '#0038a8', W, '#0038a8', W]], ['rect', 0, 0, 0.37, 5 / 9, W], ['shape', [0.045, 0.08, 0.28, 0.42], sunPath(16), '#fcd116']] },
  { code: 'KG', name: 'Kyrgyzstan', capital: 'Bishkek', continent: 'Asia', ratio: [5, 3], simplified: true, draw: [['rect', 0, 0, 1, 1, '#e8112d'], ['shape', [0.3, 0.167, 0.4, 0.667], sunPath(40, 30, 49, 30), '#ffef00'], ['shape', [0.39, 0.317, 0.22, 0.367], RING(46, 10) + ' M14,38 C40,56 60,56 86,38 M14,62 C40,44 60,44 86,62', '#e8112d', { stroke: 0.025 }]] },
  { code: 'IL', name: 'Israel', capital: 'Jerusalem', continent: 'Asia', ratio: [11, 8], draw: [['rect', 0, 0.1, 1, 0.15, '#0038b8'], ['rect', 0, 0.75, 1, 0.15, '#0038b8'], ['shape', [0.36, 0.3, 0.28, 0.4], HEXAGRAM, '#0038b8', { stroke: 0.035 }]] },
  { code: 'BR', name: 'Brazil', capital: 'Brasília', continent: 'South America', ratio: [10, 7], simplified: true, draw: [['rect', 0, 0, 1, 1, '#009c3b'], ['poly', [[0.085, 0.5], [0.5, 0.12], [0.915, 0.5], [0.5, 0.88]], '#ffdf00'], ['disc', 0.5, 0.5, 0.25, '#002776'],
    ['shape', [0.325, 0.25, 0.35, 0.5], 'M2,46 C30,30 70,32 98,58 L98,66 C70,40 30,38 2,54 Z', W], ['star', 0.43, 0.62, 0.025, W], ['star', 0.52, 0.66, 0.02, W], ['star', 0.58, 0.58, 0.022, W], ['star', 0.47, 0.7, 0.018, W], ['star', 0.55, 0.72, 0.018, W]] },
]);
export const CONTINENTS = Object.freeze(['Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania']);

// Every flag the trainer knows: Ziggle's own drawings, plus the rest of the Unicode flags as 3:2 pictures (flags-world.js).
// Where both exist (the six flags whose emblem Ziggle drew simply), the fuller picture is used.
const pictured = new Set(WORLD.map(flag => flag.code));
export const ALL_FLAGS = Object.freeze([...FLAGS.filter(flag => !pictured.has(flag.code)), ...WORLD.map(flag => Object.freeze({ ratio: [3, 2], ...flag }))]);
