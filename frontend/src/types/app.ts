export type BuiltInAppId = 'browser' | 'appSearch' | 'settings' | 'about';

export type GeneratedAppId = `generated:${string}`;

export type AppId = BuiltInAppId | GeneratedAppId;

export type ThemeMode = 'light' | 'dark';

export type DesktopIconId = BuiltInAppId;

export interface BuiltInAppDefinition {
  id: BuiltInAppId;
  title: string;
  description: string;
}

export interface GeneratedAppCandidate {
  id: string;
  name: string;
  description: string;
  appType: string;
  styleHint: string;
}
