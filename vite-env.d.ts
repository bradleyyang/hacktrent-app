// Source - https://stackoverflow.com/a/78760013
// Posted by Sayvai
// Retrieved 2025-11-08, License - CC BY-SA 4.0

/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />


interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
