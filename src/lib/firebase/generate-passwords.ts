/**
 * Generate a 6-letter password using only unambiguous letters.
 * Excludes: I, L, O (to avoid confusion with 1, l, 0).
 */
export function generatePassword(): string {
    // Uppercase A–Z minus I, L, O
    const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const LENGTH = 6;

    let pwd = '';
    const arr = new Uint32Array(LENGTH);
    crypto.getRandomValues(arr);
    for (let i = 0; i < LENGTH; i++) {
        // mod by alphabet length to pick an index
        const idx = arr[i] % ALPHABET.length;
        pwd += ALPHABET[idx];
    }
    return pwd;
}
