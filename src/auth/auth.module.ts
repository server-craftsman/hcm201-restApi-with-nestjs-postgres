import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        UserModule,
        MailModule,
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('app.auth.jwt.secret') || 'fallback-secret-key-change-in-production',
                signOptions: {
                    expiresIn: configService.get('app.auth.jwt.expiresIn') || '15m',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtStrategy],
})
export class AuthModule { } 