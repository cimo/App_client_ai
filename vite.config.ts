import { defineConfig } from "vite";

const host = process.env["TAURI_DEV_HOST"];

export default defineConfig(async () => ({
    clearScreen: false,
    server: {
        port: 30001,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 30002
              }
            : undefined,
        watch: {
            ignored: ["**/src-tauri/**"]
        }
    },
    preview: {
        port: 30003,
        strictPort: true,
        host: host || false
    }
}));
