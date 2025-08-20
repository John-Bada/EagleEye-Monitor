import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
    const apiUrl = process.env.VITE_API_BASE_URL || "http://localhost:5019";
    return {
        plugins: [
            react(),
            mode === "development" && componentTagger(),
        ].filter(Boolean),

        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },

        server: {
            host: true,
            port: 8080,

            proxy: {
                "/api": {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false,
                },
                "/hubs": {
                    target: apiUrl,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
            },
        },
    };
});
