import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id || !id.includes('node_modules')) return undefined;
            // Leaflet / mapping libs
            if (id.includes('react-leaflet') || id.includes('leaflet')) return 'vendor-leaflet';
            // React and react-dom
            if (id.includes('react') && (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))) return 'vendor-react';
            // Charts: separate apexcharts runtime from the React wrapper
            if (id.includes('node_modules/apexcharts')) return 'vendor-apexcharts';
            if (id.includes('node_modules/react-apexcharts')) return 'vendor-react-apexcharts';
            // Drag and drop
            if (id.includes('react-dnd') || id.includes('react-dnd-html5-backend')) return 'vendor-dnd';
            // UI-related libs
            if (id.includes('styled-components') || id.includes('swiper') || id.includes('react-dropzone') || id.includes('flatpickr') || id.includes('react-helmet-async')) return 'vendor-ui';
            // Default third-party bundle
            return 'vendor-default';
          }
        }
    }
  },
  server: {
    // Proxy /api calls to backend during frontend development
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
