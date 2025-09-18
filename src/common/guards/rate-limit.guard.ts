import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../modules/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly redisService: RedisService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Get client IP
        const clientIp = this.getClientIp(request);

        // Get rate limit configuration
        const windowMs = this.configService.get('app.rateLimit.windowMs');
        const maxRequests = this.configService.get('app.rateLimit.max');
        const message = this.configService.get('app.rateLimit.message');

        // Create rate limit key
        const rateLimitKey = `rate_limit:${clientIp}`;

        try {
            // Check current rate limit
            const { count, resetTime } = await this.redisService.getRateLimit(rateLimitKey);

            // Check if limit exceeded
            if (count >= maxRequests) {
                const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

                response.setHeader('X-RateLimit-Limit', maxRequests);
                response.setHeader('X-RateLimit-Remaining', 0);
                response.setHeader('X-RateLimit-Reset', resetTime);
                response.setHeader('Retry-After', retryAfter);

                throw new HttpException(
                    {
                        statusCode: HttpStatus.TOO_MANY_REQUESTS,
                        message: message,
                        error: 'Too Many Requests',
                        retryAfter,
                    },
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            // Increment rate limit
            const { count: newCount } = await this.redisService.incrementRateLimit(rateLimitKey, windowMs);

            // Set response headers
            response.setHeader('X-RateLimit-Limit', maxRequests);
            response.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - newCount));
            response.setHeader('X-RateLimit-Reset', resetTime);

            return true;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            // If Redis is down, allow the request (fail open)
            console.warn('Rate limiting failed, allowing request:', error.message);
            return true;
        }
    }

    private getClientIp(request: any): string {
        // Check for forwarded headers (when behind proxy/load balancer)
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
            return forwardedFor.split(',')[0].trim();
        }

        // Check for real IP header
        const realIp = request.headers['x-real-ip'];
        if (realIp) {
            return realIp;
        }

        // Check for CF-Connecting-IP (Cloudflare)
        const cfConnectingIp = request.headers['cf-connecting-ip'];
        if (cfConnectingIp) {
            return cfConnectingIp;
        }

        // Fallback to connection remote address
        return request.connection?.remoteAddress ||
            request.socket?.remoteAddress ||
            request.ip ||
            '127.0.0.1';
    }
} 