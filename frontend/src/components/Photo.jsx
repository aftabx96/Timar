import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { FIELD_DAY, dscName, src, srcSet } from '../lib/fieldPhotos'

/*
  A field photo. It uncovers with a clip wipe the first time it scrolls into view (no fade),
  while the image itself settles from a slight zoom. `caption` adds a plain figure caption
  with the camera file number and capture time underneath.
*/
export default function Photo({
  photo,
  className = '',
  imgClassName = '',
  sizes = '(min-width: 1024px) 50vw, 100vw',
  caption,
  captionClassName = '',
  reveal = 'up',
  eager = false,
  delay = 0,
}) {
  const from = { up: 'inset(100% 0 0 0)', left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', none: 'inset(0 0 0 0)' }[reveal]
  // Watch the unclipped wrapper: a fully clipped element never counts as visible to IntersectionObserver.
  const ref = useRef(null)
  const shown = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const img = (
    <div ref={ref} className={`relative ${className}`}>
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-[inherit] bg-paper-3"
      initial={{ clipPath: from }}
      animate={shown ? { clipPath: 'inset(0 0 0 0)' } : { clipPath: from }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.img
        src={src(photo)}
        srcSet={srcSet(photo)}
        sizes={sizes}
        alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
        className={`h-full w-full object-cover ${imgClassName}`}
        style={{ objectPosition: photo.focus }}
        initial={{ scale: reveal === 'none' ? 1 : 1.12 }}
        animate={{ scale: shown ? 1 : reveal === 'none' ? 1 : 1.12 }}
        transition={{ duration: 1.6, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
    </div>
  )
  if (!caption) return img
  return (
    <figure>
      {img}
      <figcaption className={`mt-3 text-sm leading-relaxed text-ink-2 ${captionClassName}`}>
        {caption === true ? null : <span>{caption} </span>}
        <span className="mt-1 block font-mono text-[0.7rem] text-muted">
          {dscName(photo)} / {FIELD_DAY}, {photo.time}
        </span>
      </figcaption>
    </figure>
  )
}
