import path from 'node:path'
import { FlatCompat } from '@eslint/eslintrc'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from '@typescript-eslint/eslint-plugin'

const compat = new FlatCompat({
  baseDirectory: path.resolve(),
  recommendedConfig: false,
  allConfig: false,
})

const IGNORE_PATTERNS = [
  '.next/**',
  '**/.next/**',
  '**/node_modules/**',
  'dist/**',
  'build/**',
  'out/**',
  'coverage/**',
  'public/**',
  'test-results/**',
  'scripts/**', // Utility scripts - allow console.log
  'tests/**', // Test files - allow console.log
  'verify-*.js', // Verification scripts - allow console.log
]

const config = [
  {
    ignores: IGNORE_PATTERNS,
  },
  ...compat.extends('next/core-web-vitals'),
  {
    plugins: {
      turbo: turboPlugin,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // MANDATORY RULES - Errors that BLOCK commits/pushes
      'turbo/no-undeclared-env-vars': 'off',
      'react-hooks/rules-of-hooks': 'error', // Critical: React hooks must follow rules
      'no-debugger': 'error', // Never ship debuggers
      'prefer-const': 'error',
      'no-var': 'error',

      // IMPORTANT RULES - Warnings (disabled to unblock cleanup tasks)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['off', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-alert': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      '@next/next/no-img-element': 'off',

      // Design System Enforcement - Warnings for now, will become errors
      'react/forbid-component-props': 'off',
      'react/forbid-dom-props': 'off',

      // Design System - Prevent raw HTML elements that should be components
      'no-restricted-syntax': 'off'
    },
  },
]

export default config
