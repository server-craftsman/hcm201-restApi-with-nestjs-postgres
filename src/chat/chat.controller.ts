import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AskDto } from './dto/ask.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('ask')
    @ApiOperation({ summary: 'Ask support chat for system advisory' })
    @ApiResponse({ status: 200, description: 'Advisor response returned' })
    @ApiBody({ type: AskDto })
    async ask(@Body() body: AskDto) {
        const result = await this.chatService.advise(body);
        return {
            reply: result.reply,
            matched: result.matched,
            provider: result.provider,
        };
    }
}


