'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useLang } from '@/lib/lang'
import { T, t } from '@/lib/translations'

const photos = [
  { src: '/images/gallery-10.webp', alt: 'BBM Bowling - dráhy', span: 'col-span-2 row-span-2' },
  { src: '/images/gallery-6.png', alt: 'BBM Bowling - exteriér', span: '' },
  { src: '/images/gallery-7.webp', alt: 'BBM Bowling - bar', span: '' },
  { src: '/images/gallery-8.webp', alt: 'BBM Bowling - biliardovňa', span: '' },
  { src: '/images/gallery-9.webp', alt: 'BBM Bowling - bar lounge', span: '' },
  { src: '/images/gallery-5.webp', alt: 'BBM Bowling - šípky turnaj', span: '' },
  { src: '/images/gallery-1.jpg', alt: 'BBM Bowling', span: '' },
  { src: '/images/gallery-2.jpg', alt: 'BBM Bowling - dráhy 2', span: '' },
  { src: '/images/gallery-3.png', alt: 'BBM Bowling - biliard', span: '' },
  { src: '/images/gallery-4.png', alt: 'BBM Bowling - biliard turnaj', span: '' },
]

export default function GaleriaPage() {
  const { lang } = useLang()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [lightbox, setLightbox] = useState<string | null>(null)

  return (
    <div className="pt-20 bg-[#F5F5F5] min-h-screen">
      {/* Header */}
      <section className="py-16 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30 mb-3">BBM</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">{t(T.gallery.title, lang)}</h1>
            <p className="text-black/40 mt-3">{t(T.gallery.subtitle, lang)}</p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            ref={ref}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[240px]"
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.src}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
                className={`relative overflow-hidden rounded-2xl bg-black/5 cursor-pointer group ${photo.span}`}
                onClick={() => setLightbox(photo.src)}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[80vh]">
              <Image src={lightbox} alt="BBM" fill className="object-contain" />
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-white/80 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
