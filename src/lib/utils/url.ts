import { customAlphabet } from 'nanoid';
import { prisma } from '../prisma';

// Use a custom alphabet to avoid look-alike characters (e.g., 0/O, l/I, 1) if desired.
// We'll use a standard URL-safe alphabet for now.
const generateSlugAlphabet = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    6
);

export async function generateUniqueSlug(length: number = 6, retries: number = 5): Promise<string> {
    for (let i = 0; i < retries; i++) {
        // We increment length slightly on higher retries to minimize infinite loops if we somehow run out of 6-char combinations
        const slug = generateSlugAlphabet(length + Math.floor(i / 2));

        // Check if it exists
        const existing = await prisma.link.findUnique({
            where: { slug }
        });

        if (!existing) {
            return slug;
        }
    }

    throw new Error('Failed to generate a unique slug.');
}

export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}
