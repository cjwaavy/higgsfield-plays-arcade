import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BRAND_NAMES = { higgsfield: 'Higgsfield', chatgpt: 'ChatGPT', claude: 'Claude' }
const brandName = BRAND_NAMES[process.env.VITE_BRAND] ?? 'Higgsfield'

export default defineConfig({
  plugins: [
    react(),
    {
      // bake the partner brand into the static HTML so link previews match
      name: 'brand-title',
      transformIndexHtml: (html) => html.replaceAll('Higgsfield Plays', `${brandName} Plays`),
    },
  ],
})
