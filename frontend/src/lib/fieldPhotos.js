/*
  Photos from the Timar field visit to Rehri Goth, 3 October 2026.
  Originals are Sony DSC files in the team's Drive folder. The copies in public/field are resized to
  800 and 1600 px WebP with all metadata (including any location) removed.
  `time` is the capture time from the camera. `focus` is the CSS object-position for tight crops.
*/
export const FIELD_DAY = '3 October 2026'
export const FIELD_PLACE = 'Rehri Goth'

/*
  The drive these photos come from. Date and times are from the camera.
  Route, group size and sapling count are Saltwater Marina's standard drive (20 people, 2 saplings each
  plus 10 extra) until the real drive log is filled in; set `confirmed: true` once they are.
*/
export const FIELD_DRIVE = {
  date: '3 Oct 2026',
  start: '10:25',
  end: '13:19',
  from: 'Rehri Goth',
  to: 'Kaderu Island',
  people: 20,
  saplings: 50,
  saplingsNote: '2 each, plus 10 extra',
  confirmed: false,
}

export const PHOTOS = {
  creekBoat: { file: 'dsc02110', time: '13:07', ratio: 1.5, focus: '50% 60%', alt: 'A boat crossing a creek in front of a dense wall of mangroves' },
  creekBoatTall: { file: 'dsc02109', time: '13:06', ratio: 0.667, focus: '50% 70%', alt: 'A boat passing a mangrove bank, seen from another boat' },
  bank: { file: 'dsc02012', time: '10:26', ratio: 1.5, focus: '50% 40%', alt: 'Thick mangrove growth along a creek bank at high water' },
  creek: { file: 'dsc02011', time: '10:26', ratio: 1.5, focus: '50% 50%', alt: 'A quiet creek between two mangrove banks' },
  seedlingStump: { file: 'dsc02038', time: '11:17', ratio: 0.667, focus: '40% 70%', alt: 'A young mangrove growing beside the stump of a cut tree on a mud flat' },
  seedlingStumpWide: { file: 'dsc02036', time: '11:17', ratio: 1.5, focus: '45% 60%', alt: 'A young mangrove next to a cut stump, mud flat stretching behind' },
  stumpMud: { file: 'dsc02029', time: '11:04', ratio: 1.5, focus: '45% 55%', alt: 'A single cut stump standing in wet mud at the water line' },
  stumpField: { file: 'dsc02034', time: '11:09', ratio: 0.667, focus: '50% 75%', alt: 'Dozens of cut mangrove stumps on a flat, with living forest on the horizon' },
  rows: { file: 'dsc02044', time: '11:23', ratio: 1.5, focus: '50% 60%', alt: 'Rows of small plants running across a sand flat' },
  propagules: { file: 'dsc02056', time: '11:31', ratio: 1.5, focus: '78% 55%', alt: 'Hands holding a pile of mangrove propagules, camels walking behind' },
  propagulesSand: { file: 'dsc02039', time: '11:20', ratio: 1.5, focus: '50% 50%', alt: 'Green mangrove propagules scattered on red sand' },
  wading: { file: 'dsc02085', time: '12:01', ratio: 1.5, focus: '55% 50%', alt: 'A person standing chest deep in a muddy creek' },
  wadingBank: { file: 'dsc02087', time: '12:01', ratio: 1.5, focus: '50% 40%', alt: 'A person in the creek with a mangrove bank behind' },
  boat: { file: 'dsc02023', time: '11:01', ratio: 0.667, focus: '50% 60%', alt: 'A fisherman standing on a wooden boat moored by the mangroves' },
  bow: { file: 'dsc02003', time: '10:25', ratio: 1.5, focus: '40% 60%', alt: 'The painted bow of a boat with coiled rope, mangroves ahead' },
  camels: { file: 'dsc02053', time: '11:30', ratio: 1.5, focus: '45% 70%', alt: 'Two camels walking along the shore at low tide' },
  crab: { file: 'dsc02080', time: '12:00', ratio: 1.5, focus: '45% 50%', alt: 'Hands holding a mud crab by the creek' },
  jetty: { file: 'dsc02124', time: '13:19', ratio: 1.5, focus: '50% 55%', alt: 'Wooden boats tied up at the jetty' },
  team: { file: 'dsc02120', time: '13:12', ratio: 1.5, focus: '38% 60%', alt: 'Volunteers sitting together on a fishing boat, heading out through the creek' },
  walking: { file: 'dsc02067', time: '11:41', ratio: 1.5, focus: '50% 60%', alt: 'Two people walking away across the mud flat toward a mangrove line' },
}

export const src = (p, w = 1600) => `/field/${p.file}-${w}.webp`
export const srcSet = (p) => `/field/${p.file}-800.webp 800w, /field/${p.file}-1600.webp 1600w`
export const dscName = (p) => p.file.toUpperCase()
