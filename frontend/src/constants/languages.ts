export enum LANGUAGESUPPORT {
  en = 'en',
  vi = 'vi',
}

export interface LanguageOption {
  key: LANGUAGESUPPORT;
  label: string;
  shortLabel: string;
  flag: string;
}

export const languagesSupport: LanguageOption[] = [
  {
    key: LANGUAGESUPPORT.vi,
    label: 'Tiếng Việt',
    shortLabel: 'VI',
    flag: '🇻🇳',
  },
  {
    key: LANGUAGESUPPORT.en,
    label: 'English',
    shortLabel: 'EN',
    flag: '🇬🇧',
  },
];

export const DEFAULT_LANGUAGE = LANGUAGESUPPORT.vi;
