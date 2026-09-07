import {defineConfig} from 'vite';
export default defineConfig({base:process.env.VITE_BASE_PATH||'./',build:{rollupOptions:{output:{manualChunks:{three:['three','three/addons/loaders/GLTFLoader.js','three/addons/utils/SkeletonUtils.js','three/addons/utils/BufferGeometryUtils.js']}}}}});
