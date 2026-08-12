// ESLint flat config (ESLint 9+, matches this package's "type": "module").
// Priority #1 for this codebase: react-hooks/exhaustive-deps. Every hook added
// during the App.tsx refactor (useCombat, useItemActions, useClassProgression,
// useWorldMovement, useQuestActions, useGameView, ...) relies on correct
// useCallback/useEffect dependency arrays — a stale closure there is a silent
// runtime bug that `tsc` cannot catch. This is the safety net that was missing.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The exhaustive-deps check is the whole point of adding ESLint here —
      // keep it as an error, not a warning, so it can't be quietly ignored.
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',

      // Calibrated to this codebase rather than a generic strict preset:
      // refs/state setters and Item/Enemy/etc. domain objects get passed
      // around a lot; these rules would be mostly noise here.
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // Test files: relax unused-vars for intentionally-unused destructured fixtures.
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
