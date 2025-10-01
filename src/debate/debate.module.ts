import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DebateService } from './debate.service';
import { DebateController } from './debate.controller';
import { DebateGateway } from './debate.gateway';
import { DebateThread, DebateThreadSchema } from '../database/schemas/debate-thread.schema';
import { Vote, VoteSchema } from '../database/schemas/vote.schema';
import { Argument, ArgumentSchema } from '../database/schemas/argument.schema';
import { ModerationLog, ModerationLogSchema } from '../database/schemas/moderation-log.schema';
import { User, UserSchema } from '../database/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DebateThread.name, schema: DebateThreadSchema },
            { name: Vote.name, schema: VoteSchema },
            { name: Argument.name, schema: ArgumentSchema },
            { name: ModerationLog.name, schema: ModerationLogSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [DebateController],
    providers: [DebateService, DebateGateway],
    exports: [DebateService, MongooseModule],
})
export class DebateModule { }