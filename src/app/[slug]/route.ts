import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> } // Await the params
) {
    try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        if (!slug) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 1. Try to fetch from Redis Cache First
        if (redis) {
            try {
                const cachedUrl = await redis.get<string>(`link:${slug}`);
                if (cachedUrl) {
                    // Asynchronously track the click (fire and forget)
                    trackClickAsync(slug, req);
                    return NextResponse.redirect(cachedUrl, 301);
                }
            } catch (err) {
                console.warn('Redis Cache Error (falling back to DB):', err);
            }
        }

        // 2. Fetch from Database if not in Cache
        const link = await prisma.link.findUnique({
            where: { slug }
        });

        if (!link) {
            // Redirect to a 404 page or home if not found
            return NextResponse.redirect(new URL('/?error=not-found', req.url));
        }

        // 3. Cache the result in Redis for future fast redirects (e.g., 24 hours)
        if (redis) {
            try {
                await redis.set(`link:${slug}`, link.originalUrl, { ex: 60 * 60 * 24 });
            } catch (err) {
                console.warn('Redis Set Error:', err);
            }
        }

        // 4. Asynchronously track the click
        trackClickAsync(slug, req, link.id);

        // 5. Redirect the user
        return NextResponse.redirect(link.originalUrl, 301);

    } catch (error) {
        console.error('[Redirect Error]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Fire-and-forget click tracking logic
async function trackClickAsync(slug: string, req: NextRequest, linkId?: string) {
    try {
        // Basic bot detection based on user-agent (can be expanded)
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        if (userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawl')) {
            return;
        }

        const ip = req.headers.get('x-forwarded-for') || req.ip || '0.0.0.0';

        // We only need the Link ID if we hit the cache and didn't pull it from the DB
        let targetLinkId = linkId;

        if (!targetLinkId) {
            const link = await prisma.link.findUnique({
                where: { slug },
                select: { id: true }
            });
            if (!link) return;
            targetLinkId = link.id;
        }

        // Hash the IP address for privacy
        // Note: requires 'crypto' built-in, or we can just use a simple hash
        const crypto = await import('crypto');
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Make the DB call
        await prisma.$transaction([
            prisma.clickLog.create({
                data: {
                    linkId: targetLinkId,
                    ipHash,
                    userAgent,
                }
            }),
            prisma.link.update({
                where: { id: targetLinkId },
                data: { totalClicks: { increment: 1 } }
            })
        ]);

    } catch (error) {
        console.error('Failed to log click asynchronously:', error);
    }
}
