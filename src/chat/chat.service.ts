import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'https';

export interface AskDtoLike {
    question: string;
    context?: Record<string, unknown>;
    locale?: string;
}

@Injectable()
export class ChatService {
    private readonly faqs: { pattern: RegExp; answer: string }[] = [
        { pattern: /health|status|alive/i, answer: 'Hệ thống đang hoạt động. Dùng GET /health để kiểm tra.' },
        { pattern: /debate|tranh luận|thread/i, answer: 'Bạn có thể xem danh sách chủ đề qua GET /debate/threads.' },
        { pattern: /vote|bình chọn/i, answer: 'Để bình chọn, dùng POST /debate/vote với token đăng nhập.' },
        { pattern: /argument|luận điểm/i, answer: 'Bạn cần vote trước khi gửi luận điểm: POST /debate/arguments.' },
        { pattern: /login|đăng nhập|auth/i, answer: 'Hỗ trợ đăng nhập Google/Facebook qua /auth endpoints.' },
    ];

    constructor(private readonly configService: ConfigService) { }

    async advise(payload: AskDtoLike): Promise<{ reply: string; matched: boolean; provider?: string; error?: string }> {
        const text = (payload?.question || '').trim();
        if (!text) {
            return { reply: 'Bạn hãy nhập câu hỏi cần hỗ trợ.', matched: false };
        }

        // Read AI config via ConfigService (namespace 'app')
        const ai = this.configService.get<any>('app.ai') || {};
        const apiKey = ai.apiKey as string | undefined;
        const apiBase = (ai.apiBase as string) || 'https://api.openai.com/v1';
        const preferredModel = (ai.model as string) || 'gpt-4o-mini';
        const aiDebug = Boolean(ai.debug);
        if (apiKey) {
            // Try multiple models in order: preferred -> common fallbacks
            const candidateModels: string[] = [preferredModel, 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
            for (const model of candidateModels) {
                let url: URL | undefined;
                try {
                    const normalizedBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
                    url = new URL('chat/completions', normalizedBase);
                    const body = JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: 'Bạn là trợ lý tư vấn cho hệ thống tranh luận về Tư tưởng Hồ Chí Minh (HCM). Hãy trả lời ngắn gọn, trung lập, tôn trọng, tiếng Việt; tập trung vào kiến thức lịch sử – triết học, khung khái niệm, so sánh học thuyết, và hướng dẫn thảo luận lành mạnh. Tránh khẳng định gây kích động; nếu cần, đề xuất cách đặt câu hỏi, tiêu chí đánh giá luận điểm, và nguồn tham khảo học thuật.' },
                            { role: 'user', content: text },
                        ],
                        temperature: 0.2,
                        max_tokens: 256,
                    });

                    const effectiveUrl = url!;
                    const responseText = await new Promise<string>((resolve, reject) => {
                        const req = httpsRequest({
                            method: 'POST',
                            protocol: effectiveUrl.protocol,
                            hostname: effectiveUrl.hostname,
                            port: effectiveUrl.port || (effectiveUrl.protocol === 'https:' ? 443 : 80),
                            path: effectiveUrl.pathname + (effectiveUrl.search || ''),
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'User-Agent': 'hcm201-restapi/1.0',
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Length': Buffer.byteLength(body).toString(),
                            },
                            timeout: 20000,
                        }, (res) => {
                            let data = '';
                            res.on('data', (chunk) => { data += chunk; });
                            res.on('end', () => {
                                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                                    resolve(data);
                                } else {
                                    resolve(JSON.stringify({ __httpError: res.statusCode, body: data }));
                                }
                            });
                        });
                        req.on('error', reject);
                        req.on('timeout', () => {
                            req.destroy(new Error('Request timeout'));
                        });
                        req.write(body);
                        req.end();
                    });

                    // If HTTP error encoded, parse and decide whether to retry with next model
                    try {
                        const maybeError = JSON.parse(responseText);
                        if (maybeError && typeof maybeError === 'object' && '__httpError' in maybeError) {
                            const code = (maybeError as any).__httpError;
                            const body = (maybeError as any).body;
                            // If model not found or 404, try next model
                            if (code === 404 || /model_not_found|The model .+ does not exist/i.test(String(body))) {
                                if (aiDebug) {
                                    // continue to next candidate
                                }
                                continue;
                            }
                            // For 401 or other errors, stop and report
                            if (aiDebug) {
                                return { reply: 'Không gọi được AI, dùng FAQ tạm thời.', matched: false, provider: 'ai-error', error: `url=${url.toString()} http=${code} body=${body}` };
                            }
                            break;
                        }
                    } catch {
                        // responseText was normal JSON, proceed to parse as chat response
                    }

                    const data = JSON.parse(responseText);
                    const reply = data?.choices?.[0]?.message?.content?.trim();
                    if (reply) {
                        return { reply, matched: true, provider: 'ai' };
                    }
                } catch (err: any) {
                    if (aiDebug) {
                        const message = String(err?.message || err);
                        return { reply: 'Không gọi được AI, dùng FAQ tạm thời.', matched: false, provider: 'ai-error', error: `url=${url?.toString()} msg=${message}` };
                    }
                    // try next model on error
                }
            }
        }

        for (const { pattern, answer } of this.faqs) {
            if (pattern.test(text)) {
                return { reply: answer, matched: true, provider: apiKey ? 'fallback-faq' : 'faq' };
            }
        }
        return {
            reply:
                'Mình chưa có câu trả lời chính xác. Mời bạn mô tả rõ hơn (ví dụ: “cách vote ẩn danh”, “kiểm tra health”).',
            matched: false,
            provider: apiKey ? 'fallback-default' : 'default',
        };
    }
}


