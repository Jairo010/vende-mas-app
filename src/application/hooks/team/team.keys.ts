export const teamKeys = {
  all: ['team'] as const,
  sellers: () => [...teamKeys.all, 'sellers'] as const,
};
