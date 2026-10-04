module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // This codebase does not use PropTypes anywhere, so the rule only ever
    // reported the absence of a convention the project never adopted — 183
    // findings that buried the real ones and made `npm run lint` fail under
    // --max-warnings 0. Turn it off rather than annotate every component with
    // types nothing checks against at runtime; TypeScript is the answer if
    // prop checking is wanted later.
    'react/prop-types': 'off',
  },
}
