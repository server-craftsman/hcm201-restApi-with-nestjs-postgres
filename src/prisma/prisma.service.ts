import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
            log: ['error', 'warn'],
        });
    }

    async onModuleInit() {
        try {
            this.logger.log('=== DATABASE CONNECTION DEBUG ===');
            this.logger.log(`DATABASE_URL env: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
            this.logger.log(`DATABASE_HOST env: ${process.env.DATABASE_HOST || 'Not set'}`);
            this.logger.log(`DATABASE_PORT env: ${process.env.DATABASE_PORT || 'Not set'}`);
            this.logger.log(`DATABASE_USERNAME env: ${process.env.DATABASE_USERNAME || 'Not set'}`);
            this.logger.log(`DATABASE_NAME env: ${process.env.DATABASE_NAME || 'Not set'}`);

            if (process.env.DATABASE_URL) {
                this.logger.log(`DATABASE_URL value: ${process.env.DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@')}`);
            }

            // Skip database connection if DATABASE_URL contains localhost in production
            if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('localhost')) {
                this.logger.warn('⚠️ Skipping database connection due to localhost URL in production');
                this.logger.warn('This is likely a configuration issue - the app will run without database');
                return;
            }

            this.logger.log('Attempting database connection...');
            await this.$connect();
            this.logger.log('✅ Database connected successfully');

            // Optional: Ensure schema on boot when shell access is unavailable
            if (process.env.RUN_DB_PUSH_ON_BOOT === 'true') {
                try {
                    this.logger.log('Ensuring Prisma schema exists (RUN_DB_PUSH_ON_BOOT=true)...');
                    // Try migrate deploy first; if it fails, fallback to db push
                    try {
                        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
                    } catch {
                        execSync('npx prisma db push', { stdio: 'inherit' });
                    }
                    try {
                        execSync('npx prisma generate', { stdio: 'inherit' });
                    } catch { }
                    this.logger.log('Prisma schema ensured.');
                } catch (err) {
                    this.logger.warn('Prisma schema sync on boot failed (continuing): ' + (err as Error).message);
                }
            }
        } catch (error) {
            this.logger.error('❌ Failed to connect to database:');
            this.logger.error(`Error: ${error.message}`);
            this.logger.error('Full error:', error);

            // In production, don't crash the app due to database connection issues
            if (process.env.NODE_ENV === 'production') {
                this.logger.warn('⚠️ Database connection failed but continuing in production mode');
                this.logger.warn('The app will run with limited functionality');
                return;
            }

            throw error;
        }
    }

    async onModuleDestroy() {
        try {
            await this.$disconnect();
            this.logger.log('Database disconnected');
        } catch (error) {
            this.logger.error('Error disconnecting from database:', error);
        }
    }
} 