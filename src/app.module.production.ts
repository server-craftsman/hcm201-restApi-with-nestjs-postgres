import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { HealthModule } from './health/health.module';
import appConfig from './config/app.config';
// Core modules only
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { DebateModule } from './debate/debate.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
            envFilePath: ['.env.local', '.env'],
            cache: true, // Cache config to save memory
        }),

        // Minimal rate limiting for production
        ThrottlerModule.forRoot([{
            ttl: 900000, // 15 minutes
            limit: 50, // Reduced limit for production
        }]),

        // Database (essential)
        DatabaseModule,

        // Core modules only - no mail modules to save memory
        AuthModule,
        UserModule,
        HealthModule,
        DebateModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: RateLimitGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ApiResponseInterceptor,
        },
    ],
})
export class AppModule { }
