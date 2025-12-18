module.exports = {
  // TypeScript and TSX files - TYPE CHECK + LINT + FORMAT
  'frontend/**/*.{ts,tsx}': (filenames) => [
    // Type check the entire project (can't type check individual files)
    'npm run typecheck --prefix frontend',
    // Lint and auto-fix the staged files
    `npx eslint --fix ${filenames.join(' ')}`,
    // Format the files
    `npx prettier --write ${filenames.join(' ')}`,
  ],

  // JavaScript files - LINT + FORMAT
  'frontend/**/*.{js,jsx}': (filenames) => [
    `npx eslint --fix ${filenames.join(' ')}`,
    `npx prettier --write ${filenames.join(' ')}`,
  ],

  // JSON, CSS, MD files - FORMAT ONLY
  'frontend/**/*.{json,css,md}': (filenames) => [
    `npx prettier --write ${filenames.join(' ')}`,
  ],
};
