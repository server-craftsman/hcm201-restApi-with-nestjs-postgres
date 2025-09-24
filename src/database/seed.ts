import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserService } from '../user/user.service';
import { DebateService } from '../debate/debate.service';
import { UserRole } from '../database/schemas/user.schema';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const userService = app.get(UserService);
        const debateService = app.get(DebateService);

        console.log('🌱 Starting database seeding...');

        // Create admin user
        const adminUser = await userService.create({
            email: 'admin@debate-system.com',
            username: 'admin',
            password: 'admin123',
            firstName: 'System',
            lastName: 'Administrator',
            role: UserRole.ADMIN,
        });

        console.log('✅ Admin user created:', adminUser.email);

        // Create moderator users
        const mod1 = await userService.create({
            email: 'mod1@debate-system.com',
            username: 'moderator1',
            password: 'mod123',
            firstName: 'Moderator',
            lastName: 'One',
            role: UserRole.MODERATOR,
        });

        const mod2 = await userService.create({
            email: 'mod2@debate-system.com',
            username: 'moderator2',
            password: 'mod123',
            firstName: 'Moderator',
            lastName: 'Two',
            role: UserRole.MODERATOR,
        });

        console.log('✅ Moderators created:', mod1.email, mod2.email);

        // Create sample debate thread
        const debateThread = await debateService.createThread({
            title: 'Chính sách giáo dục trong thời đại số',
            description: 'Thảo luận về việc ứng dụng công nghệ trong giáo dục và tác động của nó đến học sinh',
            createdBy: (adminUser as any)._id.toString(),
            moderators: [(mod1 as any)._id.toString(), (mod2 as any)._id.toString()],
        });

        console.log('✅ Sample debate thread created:', debateThread.title);

        console.log('🎉 Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
    } finally {
        await app.close();
    }
}

seed();
