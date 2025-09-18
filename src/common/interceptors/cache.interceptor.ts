import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { RedisService } from '../modules/redis.service';
import { ConfigService } from '@nestjs/config';

export interface CacheOptions {
    ttl?: number;
    key?: string;
    prefix?: string;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Skip caching for non-GET requests
        if (request.method !== 'GET') {
            return next.handle();
        }

        // Skip caching if explicitly disabled
        if (request.headers['cache-control'] === 'no-cache') {
            return next.handle();
        }

        // Generate cache key
        const cacheKey = this.generateCacheKey(request);
        const ttl = this.configService.get('app.cache.ttl') || 300;

        // Check cache first
        return of(null).pipe(
            switchMap(async () => {
                try {
                    const cachedData = await this.redisService.getCache(cacheKey);
                    if (cachedData) {
                        console.log('Cache HIT:', cacheKey);
                        console.log('Cached data:', cachedData);

                        // If cached data is already in ApiResponseDto format, return as is
                        if (cachedData && typeof cachedData === 'object' && 'statusCode' in cachedData) {
                            return of(cachedData);
                        }

                        // Return cached data in ApiResponseDto format
                        return of({
                            statusCode: 200,
                            message: 'Retrieved successfully',
                            data: cachedData,
                            timestamp: new Date().toISOString(),
                        });
                    } else {
                        console.log('Cache MISS:', cacheKey);
                        // Continue with original request and cache the result
                        return next.handle().pipe(
                            tap(async (data) => {
                                try {
                                    console.log('Caching response data:', data);
                                    // Cache only the data portion, not the whole response
                                    const dataToCache = data?.data || data;
                                    await this.redisService.setCache(cacheKey, dataToCache, ttl);
                                } catch (error) {
                                    console.error('Failed to cache response:', error);
                                }
                            })
                        );
                    }
                } catch (error) {
                    console.error('Cache error:', error);
                    return next.handle();
                }
            }),
            switchMap(result => result)
        );
    }

    private generateCacheKey(request: any): string {
        const url = request.url;
        const query = JSON.stringify(request.query);
        const params = JSON.stringify(request.params);
        const user = request.user?.id || 'anonymous';

        return `cache:${user}:${url}:${query}:${params}`;
    }
} 