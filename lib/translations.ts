export type Lang = 'sk' | 'en'

export const T = {
  nav: {
    contact: { sk: 'Kontakt', en: 'Contact' },
    pricing: { sk: 'Cenník', en: 'Pricing' },
    about: { sk: 'O nás', en: 'About' },
    gallery: { sk: 'Galéria', en: 'Gallery' },
    hours: { sk: 'Otváracie hodiny', en: 'Opening Hours' },
    reservation: { sk: 'Rezervácia', en: 'Reservation' },
    home: { sk: 'Domov', en: 'Home' },
  },
  hero: {
    badge: { sk: 'Malacky, Slovakia', en: 'Malacky, Slovakia' },
    title: { sk: 'Bowling Bar Malacky', en: 'Bowling Bar Malacky' },
    subtitle: { sk: 'Zábava pre celú rodinu', en: 'Fun for the whole family' },
    description: {
      sk: '4 bowlingové dráhy, biliard, šípky a bar — všetko na jednom mieste v srdci Malaciek.',
      en: '4 bowling lanes, billiards, darts and a bar — all in one place in the heart of Malacky.',
    },
    cta: { sk: 'Rezervovať', en: 'Book Now' },
    ctaSecondary: { sk: 'Zistiť viac', en: 'Learn More' },
  },
  services: {
    title: { sk: 'Naše služby', en: 'Our Services' },
    bowling: {
      title: { sk: 'Bowling', en: 'Bowling' },
      desc: { sk: '4 profesionálne dráhy s moderným vybavením', en: '4 professional lanes with modern equipment' },
    },
    billiard: {
      title: { sk: 'Biliard', en: 'Billiards' },
      desc: { sk: '4 biliardové stoly, účtuje sa každých 15 minút', en: '4 billiard tables, billed every 15 minutes' },
    },
    darts: {
      title: { sk: 'Šípky', en: 'Darts' },
      desc: { sk: 'Elektronické šípkové automaty, hra za 0,25 €', en: 'Electronic dart machines, game for €0.25' },
    },
  },
  booking: {
    title: { sk: 'Rezervácia', en: 'Booking' },
    selectDate: { sk: 'Vyberte dátum', en: 'Select date' },
    selectTime: { sk: 'Vyberte čas', en: 'Select time' },
    selectLane: { sk: 'Vyberte dráhu', en: 'Select lane' },
    duration: { sk: 'Trvanie (hodiny)', en: 'Duration (hours)' },
    name: { sk: 'Meno a priezvisko', en: 'Full name' },
    email: { sk: 'E-mail', en: 'Email' },
    phone: { sk: 'Telefón', en: 'Phone' },
    notes: { sk: 'Poznámka (nepovinné)', en: 'Notes (optional)' },
    submit: { sk: 'Potvrdiť rezerváciu', en: 'Confirm booking' },
    totalPrice: { sk: 'Celková cena', en: 'Total price' },
    maxHours: { sk: 'Max. 5 hodín online. Pre dlhšie rezervácie nás kontaktujte.', en: 'Max. 5 hours online. For longer bookings please contact us.' },
    customBooking: { sk: 'Vlastná rezervácia (5+ hodín)', en: 'Custom booking (5+ hours)' },
    callUs: { sk: 'Zavolajte nám', en: 'Call us' },
    payOnSite: { sk: 'Platba na mieste', en: 'Pay on site' },
    confirmation: { sk: 'Rezervácia potvrdená! Potvrdenie sme vám zaslali na e-mail.', en: 'Booking confirmed! We sent a confirmation to your email.' },
    closed: { sk: 'Zatvorené', en: 'Closed' },
    unavailable: { sk: 'Obsadené', en: 'Taken' },
  },
  pricing: {
    title: { sk: 'Cenník', en: 'Pricing' },
    bowling: { sk: 'Bowling', en: 'Bowling' },
    billiard: { sk: 'Biliard', en: 'Billiards' },
    darts: { sk: 'Šípky', en: 'Darts' },
    perLane: { sk: 'cena za dráhu / hodinu', en: 'price per lane / hour' },
    perTable: { sk: 'cena za stôl / hodinu', en: 'price per table / hour' },
    billedPer15: { sk: 'účtuje sa každých začatých 15 minút', en: 'billed every started 15 minutes' },
    shoeRental: { sk: 'Bowlingová obuv', en: 'Bowling shoes' },
    laneWax: { sk: 'Mazanie dráhy', en: 'Lane waxing' },
    notice: { sk: 'Rezerváciu držíme maximálne 10 minút!', en: 'Reservation held for max. 10 minutes!' },
    holidayNote: { sk: 'Počas štátnych sviatkov je cena za bowling účtovaná ako v sobotu.', en: 'On public holidays bowling is charged at the Saturday rate.' },
    dartsGame: { sk: 'za hru 301', en: 'per game 301' },
    dartsCoin: { sk: 'vhadzujú sa mince 0,50 € · 1 € · 2 €', en: 'insert coins 0.50 € · 1 € · 2 €' },
  },
  contact: {
    title: { sk: 'Kontakt', en: 'Contact' },
    address: { sk: 'Adresa', en: 'Address' },
    phone: { sk: 'Telefón', en: 'Phone' },
    email: { sk: 'E-mail', en: 'Email' },
    hours: { sk: 'Otváracie hodiny', en: 'Opening Hours' },
    navigation: { sk: 'Navigácia', en: 'Navigation' },
    navigateBtn: { sk: 'Navigovať', en: 'Get Directions' },
    monday: { sk: 'Pondelok', en: 'Monday' },
    tueThu: { sk: 'Utorok – Štvrtok', en: 'Tuesday – Thursday' },
    friSat: { sk: 'Piatok – Sobota', en: 'Friday – Saturday' },
    sunday: { sk: 'Nedeľa', en: 'Sunday' },
  },
  gallery: {
    title: { sk: 'Galéria', en: 'Gallery' },
    subtitle: { sk: 'Pozrite sa na naše priestory', en: 'Take a look at our venue' },
  },
  about: {
    title: { sk: 'O nás', en: 'About Us' },
    description: {
      sk: 'BBM Bowling Bar Malacky je moderné zábavné centrum v srdci Malaciek. Ponúkame 4 profesionálne bowlingové dráhy, biliardové stoly, elektronické šípky a príjemný bar pre celú rodinu aj firemné akcie.',
      en: 'BBM Bowling Bar Malacky is a modern entertainment center in the heart of Malacky. We offer 4 professional bowling lanes, billiard tables, electronic darts and a great bar for families and corporate events.',
    },
  },
  footer: {
    rights: { sk: '© 2025 BBM Bowling Bar Malacky. Všetky práva vyhradené.', en: '© 2025 BBM Bowling Bar Malacky. All rights reserved.' },
  },
}

export function t(obj: { sk: string; en: string }, lang: Lang): string {
  return obj[lang]
}
