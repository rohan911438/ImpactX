import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || `http://localhost:${env.VITE_API_PORT || "8787"}`;
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
