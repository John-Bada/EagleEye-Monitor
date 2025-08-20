import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
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
                target: "https://localhost:7102",
                changeOrigin: true,
                secure: false,
            },
        },
    },
}));
