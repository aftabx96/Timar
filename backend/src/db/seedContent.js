import { getDb } from './index.js'

/*
  Starting content for the Journal page: the 3 October 2026 drive and four articles.
  Only added when the tables are empty, so anything staff write later is never overwritten.
  The drive's group size and sapling count are Saltwater Marina's standard drive figures;
  staff can correct them from the admin Content screen.
*/

const p = (file, caption, time) => ({ src: `/field/${file}-1600.webp`, caption, time })

const DRIVE = {
  title: 'Planting on Kaderu Island',
  date: '2026-10-03',
  start: '10:25',
  end: '13:19',
  site: 'Kaderu Island',
  from: 'Rehri Goth',
  people: 20,
  saplings: 50,
  summary:
    'A morning on the creeks off Rehri Goth. The group crossed by fishing boat, collected propagules on the flats, planted rows on the sand and took the first stake photos, some of them from inside the creek.',
  photos: [
    p('dsc02120', 'The team on the boat, heading through the creek.', '13:12'),
    p('dsc02003', 'Rope and paint on the bow, mangroves ahead.', '10:25'),
    p('dsc02012', 'Thick mangrove along the creek bank.', '10:26'),
    p('dsc02029', 'A cut stump at the water line.', '11:04'),
    p('dsc02034', 'A flat of cut stumps, a few hundred metres from living forest.', '11:09'),
    p('dsc02036', 'A young mangrove growing beside a stump.', '11:17'),
    p('dsc02044', 'Planted rows across the sand flat.', '11:23'),
    p('dsc02053', 'Camels walking the shore at low tide. They browse young mangroves.', '11:30'),
    p('dsc02056', 'Propagules ready to plant, camels behind.', '11:31'),
    p('dsc02067', 'Walking out across the flat to the planting line.', '11:41'),
    p('dsc02080', 'A mud crab from the creek edge.', '12:00'),
    p('dsc02085', 'A survey photo taken from inside the creek.', '12:01'),
  ],
}

const ARTICLES = [
  {
    slug: 'four-mangroves-of-the-indus-delta',
    kind: 'awareness',
    title: 'The four mangroves of the Indus Delta',
    summary: 'Pakistan has four native mangrove species. One of them makes up most of the forest, and gave Timar its name.',
    cover: '/field/dsc02012-1600.webp',
    body: `Pakistan has four native mangrove species, and all of them grow in the Indus Delta. They look alike from a boat, but each one has its own way of living between the tides.

## Grey mangrove, Avicennia marina
This is the one fishermen call timar, and it makes up most of the delta's mangrove forest. It is tough: it handles very salty water and pushes the extra salt out through glands on its leaves. Around each tree, pencil thin roots stick up out of the mud to breathe.

## Loop-root mangrove, Rhizophora mucronata
Recognisable by the arching stilt roots that drop from its trunk into the mud. Those roots anchor it in soft ground and take in air through tiny pores. It is less common in the delta and has been replanted in patches.

## Spurred mangrove, Ceriops tagal
A smaller tree with short knee roots. It is rare along the Karachi coast.

## River mangrove, Aegiceras corniculatum
A shrubby mangrove that prefers less salty water near the heads of creeks. Its name refers to its curved, horn shaped fruit.

Most Timar plots are grey mangrove, because it is the species that survives best on the open flats around Kaderu Island.`,
  },
  {
    slug: 'how-a-mangrove-lives-in-salt-and-mud',
    kind: 'awareness',
    title: 'How a mangrove lives in salt and mud',
    summary: 'Salt that would kill most trees, mud with almost no air, and tides twice a day. Here is how mangroves cope.',
    cover: '/field/dsc02056-1600.webp',
    body: `Most trees would die within days in a Karachi creek. The water is salty, the mud has almost no air in it, and the tide covers the ground twice a day. Mangroves have three tricks that let them live there.

## They get rid of salt
The grey mangrove takes in salty water and pushes the extra salt out through glands on its leaves. On a dry afternoon you can sometimes see tiny salt crystals on the leaf surface.

## They breathe through their roots
Waterlogged mud holds very little oxygen. Grey mangroves send up pencil roots, called pneumatophores, that stick out of the mud like a bed of nails and take in air at low tide.

## Their seeds start growing on the tree
A mangrove propagule begins to grow while it is still hanging on the parent tree. When it drops, it can float on the tide until it lodges in soft mud and roots. Saltwater Marina collects propagules from the delta's forests and raises them in its nursery in Rehri Goth before they are planted.`,
  },
  {
    slug: 'why-we-photograph-plots',
    kind: 'article',
    title: 'Why Timar photographs plots instead of counting plants',
    summary: 'Counting every sapling on every visit is not possible in the field. Photos from fixed stakes are.',
    cover: '/field/dsc02085-1600.webp',
    body: `A single drive can put hundreds of saplings into the mud, and a plot can hold thousands. Counting every one of them, standing in a creek, every few months, is not something a volunteer team can do well. So Timar does not ask them to.

## Same stake, same angle
When a plot is planted, marked stakes go in at its corners. At every survey visit, a volunteer photographs the plot from each stake, facing the same direction. Over months, the photos from one stake become a timeline of the same patch of ground.

## A reading from the photos
A model reads each photo for plant health and for green cover, the share of the picture that is healthy leaf. Green cover rises as saplings grow, and a sudden drop between visits is a sign that something went wrong: cutting, browsing, or a patch washed out by the tide.

## A person checks it
Nothing is published straight from the model. A Saltwater Marina coordinator looks at the photos and the reading before the plot's status goes live for the people who adopted it.`,
  },
  {
    slug: 'what-is-thinning-karachis-mangroves',
    kind: 'article',
    title: 'What is thinning Karachi’s mangroves',
    summary: 'Cutting, grazing, boat wash and less fresh water. The losses Timar is built to notice.',
    cover: '/field/dsc02034-1600.webp',
    body: `Walk the flats near Kaderu Island at low tide and you will find stumps: whole stretches where mangroves once stood. The loss has more than one cause.

## Cutting
Mangrove wood is still cut for firewood and building. A cut stump does not grow back.

## Grazing
Camels walk the shore at low tide and browse young mangroves. A sapling that loses its leaves in its first months often does not recover.

## Boat wash
Waves from passing boats and ferries wear away the mud at the edge of the creeks, and with it the young trees planted there.

## Less fresh water
Mangroves in the delta depend on fresh water and silt coming down the Indus. As less of the river reaches the sea, conditions in the creeks get harder for them.

Timar cannot stop any of these on its own. What it can do is notice: a drop in green cover in the stake photos, a satellite flag, or a cutting report from someone on the shore, so that Saltwater Marina can check and act.`,
  },
]

export async function seedContent() {
  const db = await getDb()
  const drives = await db.query('SELECT count(*)::int AS n FROM drives')
  if (drives.rows[0].n === 0) {
    const d = DRIVE
    await db.query(
      `INSERT INTO drives (title, drive_date, start_time, end_time, site, departed_from, people, saplings, summary, photos, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
      [d.title, d.date, d.start, d.end, d.site, d.from, d.people, d.saplings, d.summary, JSON.stringify(d.photos)],
    )
  }
  const articles = await db.query('SELECT count(*)::int AS n FROM articles')
  if (articles.rows[0].n === 0) {
    for (const a of ARTICLES) {
      await db.query(
        `INSERT INTO articles (slug, kind, title, summary, body, cover, published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, now())`,
        [a.slug, a.kind, a.title, a.summary, a.body, a.cover],
      )
    }
  }
}
