import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/tanstack-start';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import rsc from '@vitejs/plugin-rsc';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(
    withPayload(
        ({ pluginOptions }) => ({
            plugins: [
                rsc(pluginOptions.rsc),
                tanstackStart({
                    ...pluginOptions.tanstackStart,
                    // Under /admin like everything else of the admin: the gateway routes one prefix,
                    // and the session cookie (path /admin) reaches the server functions.
                    serverFns: { base: '/admin/_serverFn' },
                }),
                viteReact(pluginOptions.react),
            ],
            // The Kafka client loads its WASM and its schema validator (ajv) at runtime; inlined by
            // Vite's module runner they break. Node loads it from node_modules instead.
            environments: {
                ssr: {
                    resolve: {
                        external: ['@platformatic/kafka'],
                    },
                },
                rsc: {
                    resolve: {
                        external: ['@platformatic/kafka'],
                    },
                },
            },
            // The shop serves /assets itself; the admin's files live under /admin like the rest of it.
            build: {
                assetsDir: 'admin/assets',
            },
            resolve: {
                alias: {
                    '@/': `${path.resolve(dirname, 'src')}/`,
                },
            },
            server: {
                // 3000 is taken by other local projects; the shop's dev server uses 5173.
                port: 3100,
                // Same origin as in the cluster: identity's refresh cookie works unchanged.
                proxy: {
                    '/api/identity': { target: 'http://nothingeats.localhost', changeOrigin: true },
                    // Images come from Garage through the gateway, like in the cluster.
                    '/media': { target: 'http://nothingeats.localhost', changeOrigin: true },
                },
                warmup: {
                    clientFiles: [
                        './src/app/__root.tsx',
                        './src/app/_payload.tsx',
                        './src/app/_payload/admin.index.tsx',
                        './src/app/_payload/admin.$.tsx',
                    ],
                },
            },
        }),
        {
            payloadConfigPath: path.resolve(dirname, 'src', 'payload.config.ts'),
        },
    ),
);
