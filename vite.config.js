import { transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default {
    root: 'src/',
    base: './',
    plugins: [
        {
            name: 'treat-js-files-as-jsx',
            async transform(code, id) {
                if (!id.match(/src\/.*\.js$/))  return null
        
                // Use the exposed transform from vite, instead of directly
                // transforming with esbuild
                return transformWithEsbuild(code, id, {
                    loader: 'jsx',
                    jsx: 'automatic',
                })
            },
        },
        react(),
        commonjs()
    ],
    optimizeDeps: {
        force: true,
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    publicDir: '../static/',
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        commonjsOptions: { transformMixedEsModules: true },
        outDir: '../build', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true // Add sourcemap
    },
    loader: 'jsx',
}