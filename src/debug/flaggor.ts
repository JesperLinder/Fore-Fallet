/**
 * Byggflaggor för test- och skärmdumpsläget. Lägena finns bara i utvecklingsbygget (npm run dev) och i
 * bygget för webbtest (VITE_TESTLAGE=1, används av GitHub Pages). I app-/produktionsbygget (npm run build)
 * är TESTLAGE_BYGGT konstant false, så att all testkod tas bort ur bygget.
 * Slås på i webbläsaren med ?debug=1 i adressen.
 */
export const TESTLAGE_BYGGT: boolean = import.meta.env.DEV || import.meta.env.VITE_TESTLAGE === '1';

function param(namn: string): boolean {
  try {
    return new URLSearchParams(window.location.search).get(namn) === '1';
  } catch {
    return false;
  }
}

/** Sant när testläget är påslaget: alla nivåer upplåsta, knappar för att hoppa till domslut och nollställa. */
export const testlage: boolean = TESTLAGE_BYGGT && param('debug');
