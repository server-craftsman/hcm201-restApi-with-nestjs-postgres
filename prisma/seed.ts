import { PrismaClient, UserStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding for Debate System...');

    // Create sample users
    const users = [
        {
            email: 'admin@debate.com',
            username: 'admin_debate',
            role: UserRole.ADMIN,
            password: await bcrypt.hash('admin123', 10),
            status: UserStatus.ONLINE,
            isVerified: true,
            isActive: true,
            firstName: 'Admin',
            lastName: 'Debate',
            fullName: 'Admin Debate System',
            bio: 'Quản trị viên hệ thống tranh luận Tư tưởng Hồ Chí Minh',
            location: 'Hà Nội, Việt Nam',
        },
        {
            email: 'student1@debate.com',
            username: 'student_nguyen_van_a',
            role: UserRole.USER,
            password: await bcrypt.hash('student123', 10),
            status: UserStatus.ONLINE,
            isVerified: true,
            isActive: true,
            firstName: 'Nguyễn',
            lastName: 'Văn A',
            fullName: 'Nguyễn Văn A',
            bio: 'Sinh viên ngành Khoa học Chính trị',
            location: 'TP. Hồ Chí Minh, Việt Nam',
        },
        {
            email: 'student2@debate.com',
            username: 'student_tran_thi_b',
            role: UserRole.USER,
            password: await bcrypt.hash('student123', 10),
            status: UserStatus.ONLINE,
            isVerified: true,
            isActive: true,
            firstName: 'Trần',
            lastName: 'Thị B',
            fullName: 'Trần Thị B',
            bio: 'Sinh viên ngành Lịch sử Đảng',
            location: 'Đà Nẵng, Việt Nam',
        }
    ];

    console.log('👥 Creating users...');
    const createdUsers: any[] = [];
    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                ...userData,
                provider: 'local',
            },
        });
        createdUsers.push(user);
        console.log(`✅ Created user: ${user.username}`);
    }

    // Create sample debate topics about Ho Chi Minh's ideology
    console.log('📚 Creating debate topics...');

    const topics = [
        {
            title: 'Tư tưởng Hồ Chí Minh về độc lập dân tộc và chủ nghĩa xã hội',
            description: 'Thảo luận về mối quan hệ giữa độc lập dân tộc và chủ nghĩa xã hội trong tư tưởng Hồ Chí Minh',
            ownerId: createdUsers[0].id,
        },
        {
            title: 'Tư tưởng Hồ Chí Minh về đạo đức cách mạng',
            description: 'Phân tích và thảo luận về quan điểm đạo đức cách mạng của Chủ tịch Hồ Chí Minh',
            ownerId: createdUsers[0].id,
        },
        {
            title: 'Tư tưởng Hồ Chí Minh về đoàn kết quốc tế',
            description: 'Thảo luận về tư tưởng đoàn kết quốc tế và tinh thần quốc tế vô sản trong tư tưởng Hồ Chí Minh',
            ownerId: createdUsers[1].id,
        },
        {
            title: 'Tư tưởng Hồ Chí Minh về văn hóa và giáo dục',
            description: 'Phân tích quan điểm của Hồ Chí Minh về vai trò của văn hóa và giáo dục trong cách mạng',
            ownerId: createdUsers[2].id,
        }
    ];

    const createdTopics: any[] = [];
    for (const topicData of topics) {
        const topic = await prisma.topic.create({
            data: topicData,
        });
        createdTopics.push(topic);
        console.log(`✅ Created topic: ${topic.title}`);
    }

    // Create sample questions for each topic
    console.log('❓ Creating questions...');

    const questions = [
        {
            content: 'Tại sao Hồ Chí Minh lại coi độc lập dân tộc là điều kiện tiên quyết để xây dựng chủ nghĩa xã hội?',
            topicId: createdTopics[0].id,
        },
        {
            content: 'Làm thế nào để vận dụng tư tưởng độc lập dân tộc của Hồ Chí Minh trong bối cảnh toàn cầu hóa hiện nay?',
            topicId: createdTopics[0].id,
        },
        {
            content: 'Đạo đức cách mạng theo tư tưởng Hồ Chí Minh có những đặc điểm gì nổi bật?',
            topicId: createdTopics[1].id,
        },
        {
            content: 'Tại sao Hồ Chí Minh lại nhấn mạnh vai trò của đạo đức trong sự nghiệp cách mạng?',
            topicId: createdTopics[1].id,
        },
        {
            content: 'Tư tưởng đoàn kết quốc tế của Hồ Chí Minh có ý nghĩa gì trong việc xây dựng quan hệ quốc tế hiện nay?',
            topicId: createdTopics[2].id,
        },
        {
            content: 'Hồ Chí Minh đã vận dụng tư tưởng đoàn kết quốc tế như thế nào trong cuộc đấu tranh giải phóng dân tộc?',
            topicId: createdTopics[2].id,
        },
        {
            content: 'Quan điểm của Hồ Chí Minh về vai trò của văn hóa trong cách mạng có gì đặc biệt?',
            topicId: createdTopics[3].id,
        },
        {
            content: 'Tư tưởng giáo dục của Hồ Chí Minh có những điểm nào vẫn còn giá trị trong thời đại hiện nay?',
            topicId: createdTopics[3].id,
        }
    ];

    const createdQuestions: any[] = [];
    for (const questionData of questions) {
        const question = await prisma.question.create({
            data: questionData,
        });
        createdQuestions.push(question);
        console.log(`✅ Created question: ${question.content.substring(0, 50)}...`);
    }

    // Create sample arguments for some questions
    console.log('💬 Creating arguments...');

    const debateArguments = [
        {
            body: 'Hồ Chí Minh coi độc lập dân tộc là điều kiện tiên quyết vì chỉ khi dân tộc được độc lập, nhân dân mới có thể tự quyết định con đường phát triển của mình. Độc lập dân tộc tạo ra nền tảng chính trị để thực hiện các mục tiêu xã hội chủ nghĩa.',
            authorId: createdUsers[1].id,
            questionId: createdQuestions[0].id,
        },
        {
            body: 'Tôi đồng ý với quan điểm này. Độc lập dân tộc không chỉ là mục tiêu mà còn là phương tiện để đạt được chủ nghĩa xã hội. Không có độc lập dân tộc thì không thể có chủ nghĩa xã hội thực sự.',
            authorId: createdUsers[2].id,
            questionId: createdQuestions[0].id,
        },
        {
            body: 'Đạo đức cách mạng theo tư tưởng Hồ Chí Minh có những đặc điểm: cần, kiệm, liêm, chính, chí công vô tư. Đây là những phẩm chất cơ bản mà mỗi cán bộ, đảng viên cần có.',
            authorId: createdUsers[0].id,
            questionId: createdQuestions[2].id,
        },
        {
            body: 'Ngoài ra, đạo đức cách mạng còn bao gồm tinh thần hy sinh, lòng yêu nước, tình thương yêu đồng bào. Đây là những giá trị cốt lõi trong tư tưởng đạo đức của Hồ Chí Minh.',
            authorId: createdUsers[1].id,
            questionId: createdQuestions[2].id,
        },
        {
            body: 'Tư tưởng đoàn kết quốc tế của Hồ Chí Minh thể hiện tinh thần quốc tế vô sản, đoàn kết với các dân tộc bị áp bức trên thế giới. Điều này có ý nghĩa quan trọng trong việc xây dựng quan hệ quốc tế hiện nay.',
            authorId: createdUsers[2].id,
            questionId: createdQuestions[4].id,
        }
    ];

    for (const argumentData of debateArguments) {
        await prisma.argument.create({
            data: argumentData,
        });
    }

    console.log(`✅ Created ${debateArguments.length} arguments`);

    console.log('🎉 Database seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Topics: ${createdTopics.length}`);
    console.log(`- Questions: ${createdQuestions.length}`);
    console.log(`- Arguments: ${debateArguments.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 