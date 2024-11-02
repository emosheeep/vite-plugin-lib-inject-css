export default {
  '**/*.{ts,tsx,js,jsx}': ['eslint'],
  '**/*.{js,ts,jsx,tsx,md,css}': ['biome format --write'],
};
