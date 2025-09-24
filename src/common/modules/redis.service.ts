import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);
    private readonly isDisabled: boolean = true;

    constructor(private readonly configService: ConfigService) {
        this.logger.warn('RedisService is disabled. All Redis operations are no-ops.');
    }

    // Basic Redis operations
    async set(key: string, value: string, ttl?: number): Promise<void> {
        return;
    }

    async get(key: string): Promise<string | null> {
        return null;
    }

    async del(key: string): Promise<number> {
        return 0;
    }

    async exists(key: string): Promise<boolean> {
        return false;
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        return false;
    }

    async ttl(key: string): Promise<number> {
        return -2;
    }

    // Cache operations
    async setCache(key: string, data: any, ttl: number = 300): Promise<void> {
        return;
    }

    async getCache<T>(key: string): Promise<T | null> {
        return null;
    }

    async deleteCache(key: string): Promise<void> {
        return;
    }

    async clearCache(pattern: string = '*'): Promise<void> {
        return;
    }

    // Rate limiting operations
    async incrementRateLimit(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
        return { count: 0, resetTime: Date.now() + windowMs };
    }

    async getRateLimit(key: string): Promise<{ count: number; resetTime: number }> {
        const windowMs = this.configService.get('app.rateLimit.windowMs') || 900000;
        return { count: 0, resetTime: Date.now() + windowMs } as any;
    }

    // Session management
    async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
        return;
    }

    async getSession<T>(sessionId: string): Promise<T | null> {
        return null;
    }

    async deleteSession(sessionId: string): Promise<void> {
        return;
    }

    // Pub/Sub operations
    async publish(channel: string, message: any): Promise<number> {
        return 0;
    }

    async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
        return;
    }

    // Health check
    async ping(): Promise<string> {
        return 'PONG';
    }

    // Get Redis instance for advanced operations
    getRedisInstance(): never {
        throw new Error('Redis is disabled');
    }
} 