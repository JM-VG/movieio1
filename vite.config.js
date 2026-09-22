import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// React plugin compiles JSX. Tailwind plugin compiles the utility classes.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
