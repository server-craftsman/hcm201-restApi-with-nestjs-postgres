import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
// import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { HealthModule } from './health/health.module';
import appConfig from './config/app.config';
//==============MODULES==============
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';
import { DatabaseModule } from './database/database.module';
// import { RedisModule } from './common/modules/redis.module';
import { DebateModule } from './debate/debate.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('app.rateLimit.windowMs') || 900000,
            limit: configService.get('app.rateLimit.max') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Redis Module
    // RedisModule,

    // Database
    DatabaseModule,

    // Mail
    MailerModule,
    MailModule,

    // Feature Modules
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
    // Temporarily disabled until Redis connection is stable
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule { }
