import {
  siMeta,
  siAirbnb,
  siZillow,
  siGooglemaps,
  siYoutubeshorts,
  siYoutubekids,
  siClaude,
} from 'simple-icons'

// LinkedIn is no longer distributed by simple-icons (brand policy). This is the classic
// "in" glyph with the outer box subpath stripped, so it sits on a colored tile.
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z'

// Higgsfield's own mark, lifted from higgsfield.ai (hf-logo__glyph).
const HIGGSFIELD_PATH =
  'M18.3498 9.83713L18.3339 9.65759C18.1831 7.93447 17.0963 4.69261 14.0816 4.69261C11.8445 4.69261 10.1545 6.97097 8.66311 8.97967C7.47302 10.5883 6.4419 11.9683 5.3073 11.9683C5.00574 11.9357 4.61708 11.7805 4.3792 11.4294C4.16497 11.1108 4.10948 10.7026 4.22046 10.2126C4.39489 9.43684 5.39463 8.7182 6.44963 7.95063C7.02864 7.54238 7.6238 7.10955 8.03634 6.69311C9.22643 5.5091 9.82932 4.65164 9.82932 3.2717C9.82932 1.89176 9.09157 1.20565 8.47276 0.911636C7.23514 0.323844 5.41851 0.666781 4.26026 1.69583C4.08583 1.85922 3.91117 2.01418 3.75243 2.16119C2.58622 3.23097 1.80094 3.95781 0 3.40232V5.63972C2.38791 6.72588 4.39512 4.65164 5.15675 3.69633C5.74372 3.06758 6.36253 2.70006 6.82283 2.70006H6.84671C7.05298 2.70825 7.22741 2.78995 7.35454 2.93696C7.56081 3.18204 7.64018 3.46786 7.60038 3.78622C7.51305 4.45594 6.83875 5.23967 5.60113 6.09713C4.14928 7.10159 1.7218 8.78374 1.53122 10.8987C1.3884 12.4177 2.15003 13.9365 3.34012 14.5243C6.11669 15.8798 7.80665 13.5444 9.5994 11.0783C10.9719 9.1756 12.273 7.37103 14.0818 7.37103C15.7081 7.37103 16.311 8.75916 16.311 9.63301V9.80459L16.1523 9.83713C12.2095 10.5558 10.0595 14.3611 10.0595 16.1167C10.0595 17.8724 11.5034 19.375 13.2804 19.375C15.359 19.375 17.9293 17.5458 18.3419 12.4013L18.3578 12.2136H20V9.83737H18.3498V9.83713ZM16.1998 12.4746C15.8826 15.5531 14.3513 16.9904 13.4232 16.9904C13.0027 16.9904 12.4158 16.631 12.4158 15.9615C12.4158 15.2104 13.5026 12.932 15.946 12.2543L16.2316 12.1808L16.1998 12.4748V12.4746Z'

// Official multicolor Google Maps pin (2020), via Wikimedia Commons.
const GMAPS_PATHS = [
  { d: 'M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z', fill: '#1a73e8' },
  { d: 'M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z', fill: '#ea4335' },
  { d: 'M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3', fill: '#4285f4' },
  { d: 'M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3', fill: '#fbbc04' },
  { d: 'M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2', fill: '#34a853' },
]

const mono = (icon, bg, fg = '#ffffff') => ({
  title: icon.title,
  viewBox: '0 0 24 24',
  paths: [{ d: icon.path, fill: fg }],
  bg,
})

// App-icon style tiles: filled rounded square in the brand color, glyph knocked out.
const BRAND_BY_PLAY = {
  'meta-ads': mono(siMeta, '#0866FF'),
  'airbnb-walkthroughs': mono(siAirbnb, '#FF385C'),
  'real-estate-ads': mono(siZillow, '#006AFF'),
  'b2b-commercials': {
    title: 'LinkedIn',
    viewBox: '0 0 24 24',
    paths: [{ d: LINKEDIN_PATH, fill: '#ffffff' }],
    bg: '#0A66C2',
  },
  'website-design': {
    title: 'Google Maps',
    viewBox: '0 0 92.3 132.3',
    paths: GMAPS_PATHS,
    bg: '#ffffff',
  },
  'yt-shorts': mono(siYoutubeshorts, '#FF0000'),
  'yt-kids': mono(siYoutubekids, '#FF0000'),
}

// OpenAI's knot mark (formerly distributed by simple-icons).
const OPENAI_PATH =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z'

// The partner brand — every "Higgsfield" mention/logo swaps to this. Selected at build
// time via VITE_BRAND (higgsfield | chatgpt | claude); each Vercel project sets its own.
const PARTNER_BRANDS = {
  higgsfield: {
    name: 'Higgsfield',
    title: 'Higgsfield',
    viewBox: '0 0 20 20',
    paths: [{ d: HIGGSFIELD_PATH, fill: '#0a0a12' }],
    bg: '#CBF83E',
  },
  chatgpt: {
    name: 'ChatGPT',
    title: 'ChatGPT',
    viewBox: '0 0 24 24',
    paths: [{ d: OPENAI_PATH, fill: '#000000' }],
    bg: '#ffffff',
  },
  claude: {
    name: 'Claude',
    title: 'Claude',
    viewBox: '0 0 24 24',
    paths: [{ d: siClaude.path, fill: '#ffffff' }],
    bg: '#D97757',
  },
}

export const HF_BRAND =
  PARTNER_BRANDS[import.meta.env.VITE_BRAND] ?? PARTNER_BRANDS.higgsfield
export const PARTNER_NAME = HF_BRAND.name

export function getBrand(playId) {
  return BRAND_BY_PLAY[playId] ?? null
}

export function Tile({ brand, className = '' }) {
  if (!brand) return null
  return (
    <span className={`lockup-tile ${className}`} style={{ background: brand.bg }}>
      <svg viewBox={brand.viewBox} role="img" aria-label={brand.title}>
        {brand.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </svg>
    </span>
  )
}

export function BrandTile({ playId }) {
  return <Tile brand={getBrand(playId)} />
}

export function HiggsfieldTile() {
  return <Tile brand={HF_BRAND} className="hf" />
}

// Small "[brand] × [Higgsfield]" pair used on cards.
export function LogoCombo({ playId, className = '' }) {
  const brand = getBrand(playId)
  if (!brand) return null
  return (
    <span className={`logo-combo ${className}`}>
      <Tile brand={brand} className="sm" />
      <span className="combo-x" aria-hidden="true">
        ×
      </span>
      <Tile brand={HF_BRAND} className="sm hf" />
    </span>
  )
}
