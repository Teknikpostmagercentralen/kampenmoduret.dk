/**
 * Turn a display name into a URL-safe username:
 *  1. Unicode‐normalize & strip accents (æ→ae, ø→o, etc.)
 *  2. Lower-case
 *  3. Replace spaces (any whitespace) with underscore
 *  4. Remove every character except a–z, 0–9, underscore or hyphen
 *  5. Collapse runs of underscores or hyphens, and trim them at the ends
 */
export function encodeUsername(displayName: string): string {
    // 1) Normalize & strip accents
    const stripped = displayName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');

    // 2) Lower-case
    const lower = stripped.toLowerCase();

    // 3) Replace any whitespace (spaces, tabs, etc.) with underscore
    const spaced = lower.replace(/\s+/g, '_');

    // 4) Remove all chars except a–z, 0–9, _ and -
    const cleaned = spaced.replace(/[^a-z0-9_-]/g, '');

    // 5) Collapse multiple underscores or hyphens, then trim leading/trailing
    return cleaned
        .replace(/_+/g, '_')
        .replace(/-+/g, '-')
        .replace(/^[_-]+|[_-]+$/g, '');
}