import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [UnoCSS(), vue()],
  build: {
    sourcemap: true,
  },
});
