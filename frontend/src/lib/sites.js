/*
  Real places, and what Saltwater Marina says about its own work (saltwater-marina.com, read 30 Oct 2026).
  Coordinates: Kaderu Island from Saltwater Marina's own map pin; Rehri Goth, Buddo Island, Bundal Island
  and Keti Bandar from Wikipedia. Kairi Creek has no published location yet, so it has no pin (lat: null).
  `status` describes Saltwater Marina's work only, never other organisations'.
*/
export const SITES = [
  {
    id: 'kaderu',
    name: 'Kaderu Island & Creek',
    lat: 24.778853,
    lng: 67.241696,
    zoom: 14,
    status: 'active',
    statusText: 'Main planting site, where every standard drive goes',
    note: 'A creek island a short boat ride from Rehri Goth that was once covered in mangroves. Cutting, camel grazing and the wash from ferry traffic have thinned it out. Groups cross by fishing boat, plant two saplings each and explore the island. The first Timar plots go here.',
  },
  {
    id: 'rehri',
    name: 'Rehri Goth',
    lat: 24.81444,
    lng: 67.22889,
    zoom: 14,
    status: 'base',
    statusText: 'Home base and community nursery',
    note: 'One of the oldest fishing communities in Pakistan. Every drive starts here with registration, a safety briefing and a look at the nursery, which raises about 500 saplings a year from propagules collected in the delta.',
  },
  {
    id: 'buddo',
    name: 'Buddo Island',
    lat: 24.733,
    lng: 67.21,
    zoom: 13,
    status: 'active',
    statusText: 'Regular restoration site',
    note: 'A 12 square kilometre island at the western edge of the Indus Delta, where community drives replant degraded mangrove. Declared a protected forest in 2022.',
  },
  {
    id: 'kairi',
    name: 'Kairi Creek',
    lat: null,
    lng: null,
    status: 'active',
    statusText: 'Restoration and monitoring area',
    note: 'A creek side area where Saltwater Marina plants and follows saplings to improve long term survival. Its exact location is not marked on the map yet.',
  },
  {
    id: 'bundal',
    name: 'Bundal Island',
    lat: 24.725,
    lng: 67.12667,
    zoom: 13,
    status: 'later',
    statusText: 'Not surveyed yet',
    note: 'Buddo Island’s larger neighbour in the Korangi and Phitti creek system, south of Ibrahim Hyderi.',
  },
  {
    id: 'keti',
    name: 'Keti Bandar',
    lat: 24.14444,
    lng: 67.45083,
    zoom: 12,
    status: 'later',
    statusText: 'Not surveyed yet',
    note: 'A coastal town deep in the Indus Delta, about 90 km south east of Karachi, surrounded by the delta’s creeks.',
  },
]

export const MAPPED_SITES = SITES.filter((s) => s.lat !== null)
export const KADERU = SITES[0]

// Saltwater Marina's own published figures (saltwater-marina.com).
export const SALTWATER_MARINA = {
  planted: 7000,
  drives: 30,
  people: 2000,
  community: 300,
  dailyVolunteers: 15,
  nurseryPerYear: 500,
  goal: 10_000_000,
  goalYear: 2035,
  drivesPerMonth: 'one to two',
  website: 'https://saltwater-marina.com',
  email: 'info@saltwater-marina.com',
  whatsapp: '+92 321 8268395',
  whatsappLink: 'https://wa.me/923218268395',
  instagram: 'saltwater_marinaa',
  address: 'C 557, Dabla Mohalla, Rehri Goth, Karachi',
  founder: 'Almas Kasmani',
}

// The plantation drive as Timar offers it: priced per person, so any group size works.
export const STANDARD_DRIVE = {
  people: 20, // a typical group, used for the sample drive record
  pricePerHead: 2000,
  saplingsEach: 2,
  hours: '4 to 6',
  saplingCost: 300,
}

export const KADERU_SOURCE = {
  label: 'Reporterre',
  url: 'https://reporterre.net/REP-Croissance-urbaine-contre-urgence-climatique-mobilisations-citoyennes-pour-le-climat',
}
