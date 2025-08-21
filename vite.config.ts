import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
    // Default to IPv4 loopback to avoid Node resolving `localhost` to IPv6
    // which can cause connection refusals when the .NET server only binds
    // to IPv4. Consumers can still override this via VITE_API_BASE_URL.
    const apiUrl = process.env.VITE_API_BASE_URL || "http://127.0.0.1:5019";
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
