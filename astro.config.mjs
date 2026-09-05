import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://dwi-mar95.github.io',
  base: '/keuangan-keluarga',
  output: 'static',
  server: {
    port: 4321,
    host: true
  }
});
