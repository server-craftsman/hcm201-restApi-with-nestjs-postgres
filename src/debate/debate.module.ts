import { Module } from '@nestjs/common';
import { DebateService } from './debate.service';
import { VotingService } from './voting.service';
import { DebateSessionService } from './debate-session.service';
import { EvaluationService } from './evaluation.service';
import { DebateController } from './debate.controller';
import { DebateGateway } from './debate.gateway';
import { TopicRepository } from './infrastructure/topic.repository';
import { QuestionRepository } from './infrastructure/question.repository';
import { ArgumentRepository } from './infrastructure/argument.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DebateController],
    providers: [
        DebateService,
        VotingService,
        DebateSessionService,
        EvaluationService,
        DebateGateway,
        {
            provide: 'TopicRepositoryInterface',
            useClass: TopicRepository,
        },
        {
            provide: 'QuestionRepositoryInterface',
            useClass: QuestionRepository,
        },
        {
            provide: 'ArgumentRepositoryInterface',
            useClass: ArgumentRepository,
        },
    ],
    exports: [DebateService, VotingService, DebateSessionService, EvaluationService],
})
export class DebateModule { }
