import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { FacebookAuthDto } from './dto/facebook-auth.dto';
import { User, UserDocument, UserStatus } from '../database/schemas/user.schema';
import { UserRole } from '../database/schemas/user.schema';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    private readonly googleClient: OAuth2Client;
    // Facebook uses token introspection via Graph API; no SDK needed server-side

    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async validateUser(username: string, password: string): Promise<UserDocument | null> {
        if (!username || !password) {
            return null;
        }

        const user = await this.userService.findByUsername(username);
        if (!user) {
            return null;
        }

        // Check if user is active
        if (!user.isActive) {
            return null;
        }

        // Check if user has password (not OAuth user)
        if (!user.password) {
            return null;
        }

        const bcrypt = require('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async register(userData: any) {
        try {
            const user = await this.userService.create(userData);

            // Generate verification hash
            const verificationHash = randomBytes(32).toString('hex');

            // Save verification hash to database
            await this.userService.update(user.id, {
                hash: verificationHash,
                hashExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            });

            // Send verification email
            try {
                await this.mailService.userSignUp({
                    to: user.email,
                    data: {
                        hash: verificationHash,
                    },
                });
            } catch (error) {
                console.error('❌ Failed to send verification email:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                });
                // Don't fail registration if email fails
                // In production, you might want to queue this for retry
            }

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    bio: user.bio,
                    location: user.location,
                    role: user.role,
                    status: user.status,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                    lastSeen: user.lastSeen,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            };
        } catch (error) {
            console.error('❌ Error in register method:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }

    async googleAuth(googleAuthDto: GoogleAuthDto) {
        try {
            // Validate inputs - prioritize idToken for client-side OAuth
            const { idToken, accessToken } = googleAuthDto;

            if (!idToken && !accessToken) {
                throw new BadRequestException('Either Google ID token or access token is required');
            }

            const clientId = process.env.GOOGLE_CLIENT_ID;
            if (!clientId) {
                throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
            }

            let payload: any;

            if (idToken) {
                // Client-side OAuth flow - verify ID token directly
                const ticket = await this.googleClient.verifyIdToken({
                    idToken,
                    audience: clientId,
                });
                payload = ticket.getPayload();
            } else if (accessToken) {
                // Server-side flow or legacy - get user info via API
                const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
                const userInfo = await userInfoResponse.json();

                if (userInfo.error) {
                    throw new UnauthorizedException('Invalid Google access token');
                }

                // Map to expected payload format
                payload = {
                    sub: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    given_name: userInfo.given_name,
                    family_name: userInfo.family_name,
                    email_verified: userInfo.verified_email,
                };
            }

            if (!payload) {
                throw new UnauthorizedException('Invalid Google token');
            }

            const { sub: googleId, email, name, picture, given_name, family_name } = payload;

            if (!googleId) {
                throw new UnauthorizedException('Invalid Google token (missing subject)');
            }
            if (!email) {
                throw new UnauthorizedException('Google account has no verified email');
            }

            // Check if user exists by Google ID
            let user = await this.userService.findByGoogleId(googleId);

            if (user) {
                // User exists, update last seen
                await this.userService.update(user.id, {
                    lastSeen: new Date(),
                });
            } else {
                // Check if user exists by email
                const existingUser = await this.userService.findByEmail(email);
                if (existingUser) {
                    // Link Google account to existing user
                    await this.userService.update(existingUser.id, {
                        googleId,
                        provider: 'google',
                        ...(picture ? { avatar: picture } : {}),
                        role: UserRole.USER,
                        lastSeen: new Date(),
                    });
                    // Reload as domain entity
                    user = await this.userService.findById(existingUser.id);
                } else {
                    // Create new user
                    const username = email.split('@')[0] + '_' + googleId.substring(0, 8);

                    const userData = {
                        email,
                        username,
                        password: undefined as string | undefined, // No password for OAuth users
                        ...(given_name ? { firstName: given_name } : {}),
                        ...(family_name ? { lastName: family_name } : {}),
                        ...(name ? { fullName: name } : {}),
                        ...(picture ? { avatar: picture } : {}),
                        googleId,
                        provider: 'google',
                        isVerified: true, // Google users are pre-verified
                        isActive: true,
                    } as const;

                    const created = await this.userService.create(userData);
                    user = await this.userService.findById(created.id);
                }
            }

            // Ensure user is defined before proceeding
            if (!user) {
                throw new UnauthorizedException('Google authentication failed: user not initialized');
            }

            // Generate JWT tokens
            const tokens = await this.generateTokens(user);

            return {
                message: 'Google authentication successful',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    role: user.role,
                    isVerified: user.isVerified,
                    isActive: user.isActive,
                    lastSeen: user.lastSeen,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                ...tokens,
            };
        } catch (error) {
            console.error('Google auth error:', error);
            throw new UnauthorizedException('Google authentication failed');
        }
    }

    async facebookAuth(dto: FacebookAuthDto) {
        try {
            const { accessToken } = dto;

            if (!accessToken) {
                throw new BadRequestException('Facebook access token is required');
            }

            // Step 1: Verify token validity and get app info
            const tokenDebugUrl = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(accessToken)}`;
            const debugResponse = await fetch(tokenDebugUrl);
            const debugData = await debugResponse.json();

            if (debugData.error || !debugData.data?.is_valid) {
                throw new UnauthorizedException('Invalid or expired Facebook token');
            }

            // Step 2: Fetch user info from Facebook Graph API
            const fields = 'id,name,first_name,last_name,email,picture.type(large)';
            const userUrl = `https://graph.facebook.com/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
            const userResponse = await fetch(userUrl);
            const userData = await userResponse.json();

            if (userData.error) {
                throw new UnauthorizedException(`Facebook API error: ${userData.error.message}`);
            }

            const facebookId: string = userData.id;
            const email: string | undefined = userData.email;
            const fullName: string | undefined = userData.name;
            const firstName: string | undefined = userData.first_name;
            const lastName: string | undefined = userData.last_name;
            const picture: string | undefined = userData.picture?.data?.url;

            if (!facebookId) {
                throw new UnauthorizedException('Invalid Facebook token (no user ID)');
            }

            // Try find by facebookId
            let user = await this.userService.findByFacebookId?.(facebookId);

            if (user) {
                await this.userService.update(user.id, { lastSeen: new Date() });
            } else {
                // If email exists, link account; else create minimal account
                if (email) {
                    const existing = await this.userService.findByEmail(email);
                    if (existing) {
                        await this.userService.update(existing.id, {
                            facebookId,
                            provider: 'facebook',
                            ...(picture ? { avatar: picture } : {}),
                            role: UserRole.USER,
                            lastSeen: new Date(),
                            isVerified: true,
                        });
                        user = await this.userService.findById(existing.id);
                    }
                }

                if (!user) {
                    const usernameBase = email ? email.split('@')[0] : `fb_${facebookId.substring(0, 8)}`;
                    const username = `${usernameBase}_${facebookId.substring(0, 6)}`;
                    const created = await this.userService.create({
                        email: email ?? `${username}@facebook.local`,
                        username,
                        password: undefined,
                        ...(firstName ? { firstName } : {}),
                        ...(lastName ? { lastName } : {}),
                        ...(fullName ? { fullName } : {}),
                        ...(picture ? { avatar: picture } : {}),
                        facebookId,
                        provider: 'facebook',
                        isVerified: true,
                        isActive: true,
                    });
                    user = await this.userService.findById(created.id);
                }
            }

            if (!user) {
                throw new UnauthorizedException('Facebook authentication failed');
            }

            const tokens = await this.generateTokens(user);
            return {
                message: 'Facebook authentication successful',
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    fullName: user.fullName,
                    avatar: user.avatar,
                    role: user.role,
                    isVerified: user.isVerified,
                },
                ...tokens,
            };
        } catch (error) {
            console.error('Facebook auth error:', error);
            throw new UnauthorizedException('Facebook authentication failed');
        }
    }

    async login(loginDto: LoginDto) {
        if (!loginDto.username || !loginDto.password) {
            throw new BadRequestException('Username and password are required');
        }

        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Require email verification before allowing login (non-OAuth accounts)
        if (!user.isVerified) {
            throw new UnauthorizedException('Email is not verified');
        }

        // Update user status to online
        await this.userService.updateStatus(user.id, UserStatus.ONLINE);

        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: user.fullName,
                avatar: user.avatar,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                bio: user.bio,
                location: user.location,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                isActive: user.isActive,
                lastSeen: user.lastSeen,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }

    async logout(userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        await this.userService.updateStatus(userId, UserStatus.OFFLINE);
        return { message: 'Logged out successfully' };
    }

    async refreshToken(userId: string) {
        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.userService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };

        const token = this.jwtService.sign(payload);

        return {
            access_token: token,
        };
    }

    async verifyToken(token: string) {
        if (!token) {
            throw new BadRequestException('Token is required');
        }

        try {
            const payload = this.jwtService.verify(token);
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    async hasPermission(userId: string, requiredRole: UserRole): Promise<boolean> {
        if (!userId || !requiredRole) {
            return false;
        }

        const user = await this.userService.findById(userId);
        if (!user) {
            return false;
        }

        const roleHierarchy = {
            [UserRole.USER]: 1,
            [UserRole.MODERATOR]: 2,
            [UserRole.ADMIN]: 3,
            [UserRole.SUPER_ADMIN]: 4,
        };

        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }

    async verifyEmail(hash: string) {
        if (!hash) {
            throw new BadRequestException('Verification hash is required');
        }

        try {
            // Find user by verification hash
            const user = await this.userService.findByVerificationHash(hash);

            if (!user) {
                throw new BadRequestException('Invalid verification hash');
            }

            // Check if hash has expired
            if (user.hashExpires && user.hashExpires < new Date()) {
                throw new BadRequestException('Verification hash has expired');
            }

            // Update user verification status
            await this.userService.update(user.id, {
                isVerified: true,
                hash: undefined,
                hashExpires: undefined,
            });

            return {
                message: 'Email verified successfully',
                verified: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    isVerified: true,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Invalid verification hash');
        }
    }

    async resendVerificationEmail(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.isVerified) {
            throw new BadRequestException('User is already verified');
        }

        // Generate new verification hash
        const verificationHash = randomBytes(32).toString('hex');

        // Send verification email
        try {
            await this.mailService.userSignUp({
                to: user.email,
                data: {
                    hash: verificationHash,
                },
            });
        } catch (error) {
            throw new Error('Failed to send verification email');
        }

        return { message: 'Verification email sent successfully' };
    }

    // Helper: generate access/refresh tokens for a domain User entity
    private async generateTokens(user: UserDocument): Promise<{ access_token: string; refresh_token: string }> {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
        };

        const access_token = this.jwtService.sign(payload, {
            secret: process.env.AUTH_JWT_SECRET,
            expiresIn: process.env.AUTH_JWT_TOKEN_EXPIRES_IN || '3600s',
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: process.env.AUTH_REFRESH_SECRET || process.env.AUTH_JWT_SECRET,
            expiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '7d',
        });

        return { access_token, refresh_token };
    }

    // Role Management
    async changeUserRole(userId: string, newRole: UserRole, adminId: string, reason?: string): Promise<UserDocument> {
        // Check if admin exists and has permission
        const admin = await this.userService.findById(adminId);
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(admin.role)) {
            throw new ForbiddenException('Only admins can change user roles');
        }

        // Check if target user exists
        const targetUser = await this.userService.findById(userId);
        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // Prevent changing super admin role
        if (targetUser.role === UserRole.SUPER_ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot change super admin role');
        }

        // Prevent promoting to super admin unless current user is super admin
        if (newRole === UserRole.SUPER_ADMIN && admin.role !== UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Only super admins can promote users to super admin');
        }

        // Update user role
        const updatedUser = await this.userService.update(userId, { role: newRole });

        // Log the role change (you might want to add this to a log table)
        console.log(`Role changed: User ${targetUser.username} (${targetUser.email}) role changed from ${targetUser.role} to ${newRole} by admin ${admin.username}. Reason: ${reason || 'No reason provided'}`);

        return updatedUser;
    }

    // Password Management
    async changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
        // Validate password confirmation
        if (newPassword !== confirmPassword) {
            throw new BadRequestException('New password and confirmation do not match');
        }

        // Get user
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user has a password (not OAuth user)
        if (!user.password) {
            throw new BadRequestException('OAuth users cannot change password through this method');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await this.userService.update(userId, { password: hashedNewPassword });

        return { message: 'Password changed successfully' };
    }

    async adminChangePassword(userId: string, newPassword: string, adminId: string, reason?: string): Promise<{ message: string }> {
        // Check if admin exists and has permission
        const admin = await this.userService.findById(adminId);
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }

        if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(admin.role)) {
            throw new ForbiddenException('Only admins can change user passwords');
        }

        // Check if target user exists
        const targetUser = await this.userService.findById(userId);
        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await this.userService.update(userId, { password: hashedNewPassword });

        // Log the password change
        console.log(`Password changed: Admin ${admin.username} changed password for user ${targetUser.username} (${targetUser.email}). Reason: ${reason || 'No reason provided'}`);

        return { message: 'Password changed successfully by admin' };
    }

    // User Management
    async getUserRoles(): Promise<{ role: UserRole; count: number }[]> {
        const roleCounts = await this.userModel.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        return roleCounts.map(item => ({
            role: item._id,
            count: item.count
        }));
    }

    async getUsersByRole(role: UserRole, page: number = 1, limit: number = 20): Promise<{
        items: UserDocument[];
        totalItems: number;
        page: number;
        limit: number;
    }> {
        const filter = { role };
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const take = Math.max(1, Math.min(Number(limit), 100));

        const [items, totalItems] = await Promise.all([
            this.userModel.find(filter)
                .select('-password -hash -hashExpires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.userModel.countDocuments(filter),
        ]);

        return { items, totalItems, page: Number(page), limit: take };
    }
} 