import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService) { }

    use(req: Request, res: Response, next: NextFunction) {
        // Security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Content Security Policy
        const cspEnabled = this.configService.get('app.security.helmet.contentSecurityPolicy');
        if (cspEnabled !== false) {
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' ws: wss:;"
            );
        }

        // CORS headers
        const corsEnabled = this.configService.get('app.security.cors.enabled');
        if (corsEnabled !== false) {
            const allowedOrigins = this.configService.get('app.allowedOrigins') || ['http://localhost:3000'];
            const origin = req.headers.origin;

            if (origin && allowedOrigins.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }

            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        // Remove sensitive headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        // Request size limit
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (contentLength > maxSize) {
            return res.status(413).json({
                statusCode: 413,
                message: 'Request entity too large',
                error: 'Payload Too Large',
                timestamp: new Date().toISOString(),
            });
        }

        // Rate limiting headers (will be set by RateLimitGuard)
        res.setHeader('X-RateLimit-Limit', this.configService.get('app.rateLimit.max') || 100);
        res.setHeader('X-RateLimit-Window', this.configService.get('app.rateLimit.windowMs') || 60000);

        next();
    }
} 