export {};

declare global {
  interface Window {
    /** true quando a abertura animada já terminou nesta página */
    __splashDone?: boolean;
  }
}
