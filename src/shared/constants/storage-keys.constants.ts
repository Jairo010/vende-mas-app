export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  REMEMBERED_EMAIL: 'remembered_email',
  THEME_MODE: 'theme_mode',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  /** Supervisor's sellers, cached so visits can be assigned offline. */
  TEAM_SELLERS: 'team_sellers',
  /** `userId:companyId` whose data the device database holds. */
  LOCAL_DATA_OWNER: 'local_data_owner',
} as const;
