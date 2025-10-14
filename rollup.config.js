import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const outputDefaults = {
    globals: {
        'gun/gun': 'Gun',
        'gun/sea': 'SEA',
        'gun': 'Gun',
        'lodash': '_',
        'moment': 'moment',
    }
};

export default {
    input: 'src/index.ts',
    output: [
        {
            ...outputDefaults,
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
        },
        {
            ...outputDefaults,
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        },
        {
            ...outputDefaults,
            name: 'GunUtil',
            file: pkg.browser,
            format: 'umd',
            sourcemap: true,
        },
    ],
    external: [
        'gun/gun',
        'gun/sea',
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
        }),
    ],
};
