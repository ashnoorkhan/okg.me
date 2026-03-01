import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUniqueSlug, isValidUrl } from '@/lib/utils/url';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { originalUrl, customSlug } = body;

        // 1. Validate Input
        if (!originalUrl) {
            return NextResponse.json({ error: 'Missing originalUrl' }, { status: 400 });
        }

        if (!isValidUrl(originalUrl)) {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        let slug = customSlug;

        // 2. Handle Custom Slug
        if (customSlug) {
            if (customSlug.length < 3 || customSlug.length > 30) {
                return NextResponse.json({ error: 'Custom slug must be between 3 and 30 characters' }, { status: 400 });
            }

            // Check if custom slug already exists
            const existing = await prisma.link.findUnique({
                where: { slug: customSlug }
            });

            if (existing) {
                return NextResponse.json({ error: 'Custom slug is already taken' }, { status: 409 });
            }
        } else {
            // 3. Generate Random Slug
            try {
                slug = await generateUniqueSlug(6, 5);
            } catch (err) {
                console.error('Error generating slug:', err);
                return NextResponse.json({ error: 'Failed to generate short link. Please try again.' }, { status: 500 });
            }
        }

        // 4. Save to Database
        // TODO: Associate with user ID if logged in
        const link = await prisma.link.create({
            data: {
                originalUrl,
                slug,
            }
        });

        // 5. Build full short URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const shortUrl = `${baseUrl}/${link.slug}`;

        return NextResponse.json({
            success: true,
            data: {
                shortUrl,
                slug: link.slug,
                originalUrl: link.originalUrl
            }
        }, { status: 201 });

    } catch (error) {
        console.error('[Shorten API Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
