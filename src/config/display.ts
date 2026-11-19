/**
 * Skärmmått. Spelet tänker i en logisk yta på 390×844 punkter (porträtt).
 * Canvasen renderas i enhetens pixeltäthet (ZOOM) så att text och former blir skarpa på telefon;
 * varje scen zoomar kameran med samma faktor så att koden ändå kan räkna i logiska punkter.
 */
export const BREDD = 390;
export const HOJD = 844;
export const MITT_X = BREDD / 2;

/** Pixeltäthet, avrundad uppåt och begränsad till 3 för prestanda. */
export const ZOOM = Math.min(Math.max(Math.ceil(window.devicePixelRatio || 1), 1), 3);
