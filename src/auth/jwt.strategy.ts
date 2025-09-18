import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('app.auth.jwt.secret') || 'fallback-secret-key-change-in-production',
        });
    }

    async validate(payload: any) {
        return {
            id: payload.sub,
            email: payload.email,
            username: payload.username,
            role: payload.role,
            isVerified: payload.isVerified,
            isActive: payload.isActive,
        };
    }
} 