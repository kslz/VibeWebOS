/// <reference types="vite/client" />

declare module '*.json' {
  const value: unknown;
  export const ui: unknown;
  export default value;
}
