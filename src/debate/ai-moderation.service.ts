import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { AIModeration, AIModerationDocument, ModerationStatus, RiskLevel } from '../database/schemas/ai-moderation.schema';

export interface AIModerationResult {
    isApproved: boolean;
    confidence: number;
    reasons: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    categories: string[];
    suggestions?: string[];
}

export interface ContentAnalysis {
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    toxicity: number; // 0-1 scale
    politicalBias: number; // -1 to 1 scale
    hoChiMinhRelevance: number; // 0-1 scale
    educationalValue: number; // 0-1 scale
}

@Injectable()
export class AIModerationService {
    private readonly logger = new Logger(AIModerationService.name);
    private readonly openaiApiKey: string;
    private readonly geminiApiKey: string;

    constructor(
        private configService: ConfigService,
        @InjectModel(AIModeration.name) private aiModerationModel: Model<AIModerationDocument>
    ) {
        this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
        this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    }

    /**
     * Phân tích nội dung argument bằng AI
     */
    async analyzeContent(content: string, title: string): Promise<AIModerationResult> {
        try {
            // Check if API keys are configured
            if (!this.openaiApiKey && !this.geminiApiKey) {
                this.logger.warn('No AI API keys configured, using fallback analysis');
                return this.getFallbackResult();
            }

            let analysis: AIModerationResult;
            let geminiAnalysis: AIModerationResult;

            // Try OpenAI first if available
            if (this.openaiApiKey) {
                try {
                    analysis = await this.analyzeWithOpenAI(content, title);
                } catch (error) {
                    this.logger.warn('OpenAI analysis failed, trying Gemini:', error.message);
                    analysis = this.getFallbackResult();
                }
            } else {
                analysis = this.getFallbackResult();
            }

            // Try Gemini if available
            if (this.geminiApiKey) {
                try {
                    geminiAnalysis = await this.analyzeWithGemini(content, title);
                } catch (error) {
                    this.logger.warn('Gemini analysis failed:', error.message);
                    geminiAnalysis = this.getFallbackResult();
                }
            } else {
                geminiAnalysis = this.getFallbackResult();
            }

            // Kết hợp kết quả từ cả hai AI
            return this.combineAnalysisResults(analysis, geminiAnalysis);
        } catch (error) {
            this.logger.error('AI analysis failed:', error);
            return this.getFallbackResult();
        }
    }

    /**
     * Phân tích với OpenAI GPT-4
     */
    private async analyzeWithOpenAI(content: string, title: string): Promise<AIModerationResult> {
        const prompt = this.buildAnalysisPrompt(content, title);

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là một AI moderator chuyên phân tích nội dung về tư tưởng Hồ Chí Minh. 
          Nhiệm vụ của bạn là đánh giá xem nội dung có phù hợp, có giá trị giáo dục, và không chứa nội dung phản động hay chống phá không.
          
          Tiêu chí đánh giá:
          1. Tính chính xác về tư tưởng Hồ Chí Minh
          2. Giá trị giáo dục và học thuật
          3. Không chứa nội dung phản động, chống phá
          4. Phù hợp với văn hóa và đạo đức Việt Nam
          5. Có tính xây dựng và tích cực`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${this.openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return this.parseOpenAIResponse(response.data.choices[0].message.content);
    }

    /**
     * Phân tích với Google Gemini
     */
    private async analyzeWithGemini(content: string, title: string): Promise<AIModerationResult> {
        const prompt = this.buildAnalysisPrompt(content, title);

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000
            }
        });

        return this.parseGeminiResponse(response.data.candidates[0].content.parts[0].text);
    }

    /**
     * Xây dựng prompt phân tích
     */
    private buildAnalysisPrompt(content: string, title: string): string {
        return `
Hãy phân tích nội dung sau về tư tưởng Hồ Chí Minh:

Tiêu đề: "${title}"
Nội dung: "${content}"

Vui lòng đánh giá và trả về kết quả theo format JSON sau:

{
  "isApproved": boolean,
  "confidence": number (0-1),
  "reasons": [string],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "categories": [string],
  "suggestions": [string] (optional)
}

Các categories có thể bao gồm:
- EDUCATIONAL: Có giá trị giáo dục
- ACCURATE: Chính xác về tư tưởng Hồ Chí Minh
- CONSTRUCTIVE: Có tính xây dựng
- TOXIC: Có nội dung độc hại
- POLITICAL_BIAS: Có thiên kiến chính trị
- ANTI_GOVERNMENT: Chống phá chính quyền
- HISTORICAL_DISTORTION: Bóp méo lịch sử
- INAPPROPRIATE: Không phù hợp

Hãy đánh giá một cách khách quan và công bằng.
    `.trim();
    }

    /**
     * Parse response từ OpenAI
     */
    private parseOpenAIResponse(response: string): AIModerationResult {
        try {
            // Tìm JSON trong response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            this.logger.error('Failed to parse OpenAI response:', error);
            return this.getDefaultResult();
        }
    }

    /**
     * Parse response từ Gemini
     */
    private parseGeminiResponse(response: string): AIModerationResult {
        try {
            // Tìm JSON trong response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            this.logger.error('Failed to parse Gemini response:', error);
            return this.getDefaultResult();
        }
    }

    /**
     * Kết hợp kết quả từ nhiều AI
     */
    private combineAnalysisResults(openaiResult: AIModerationResult, geminiResult: AIModerationResult): AIModerationResult {
        // Nếu cả hai AI đều approve, thì approve
        if (openaiResult.isApproved && geminiResult.isApproved) {
            return {
                isApproved: true,
                confidence: Math.max(openaiResult.confidence, geminiResult.confidence),
                reasons: [...openaiResult.reasons, ...geminiResult.reasons],
                riskLevel: this.getLowerRiskLevel(openaiResult.riskLevel, geminiResult.riskLevel),
                categories: [...new Set([...openaiResult.categories, ...geminiResult.categories])],
                suggestions: [...(openaiResult.suggestions || []), ...(geminiResult.suggestions || [])]
            };
        }

        // Nếu có ít nhất một AI reject, thì reject
        return {
            isApproved: false,
            confidence: Math.min(openaiResult.confidence, geminiResult.confidence),
            reasons: [...openaiResult.reasons, ...geminiResult.reasons],
            riskLevel: this.getHigherRiskLevel(openaiResult.riskLevel, geminiResult.riskLevel),
            categories: [...new Set([...openaiResult.categories, ...geminiResult.categories])],
            suggestions: [...(openaiResult.suggestions || []), ...(geminiResult.suggestions || [])]
        };
    }

    private getLowerRiskLevel(level1: string, level2: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const index1 = levels.indexOf(level1);
        const index2 = levels.indexOf(level2);
        return levels[Math.min(index1, index2)] as any;
    }

    private getHigherRiskLevel(level1: string, level2: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const index1 = levels.indexOf(level1);
        const index2 = levels.indexOf(level2);
        return levels[Math.max(index1, index2)] as any;
    }

    private getDefaultResult(): AIModerationResult {
        return {
            isApproved: false,
            confidence: 0,
            reasons: ['AI analysis failed - manual review required'],
            riskLevel: 'HIGH',
            categories: ['MANUAL_REVIEW'],
            suggestions: ['Please review this content manually']
        };
    }

    private getFallbackResult(): AIModerationResult {
        return {
            isApproved: false,
            confidence: 0.5,
            reasons: ['AI services not available - manual review required'],
            riskLevel: 'MEDIUM',
            categories: ['MANUAL_REVIEW'],
            suggestions: ['Please review this content manually due to AI service unavailability']
        };
    }

    /**
     * Phân tích sentiment của nội dung
     */
    async analyzeSentiment(content: string): Promise<ContentAnalysis> {
        try {
            const prompt = `
Phân tích sentiment và các đặc điểm của nội dung sau:

"${content}"

Trả về kết quả theo format JSON:
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "toxicity": number (0-1),
  "politicalBias": number (-1 to 1),
  "hoChiMinhRelevance": number (0-1),
  "educationalValue": number (0-1)
}
      `;

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là một AI chuyên phân tích sentiment và đặc điểm nội dung. Trả về kết quả dưới dạng JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = JSON.parse(response.data.choices[0].message.content);
            return result;
        } catch (error) {
            this.logger.error('Sentiment analysis failed:', error);
            return {
                sentiment: 'NEUTRAL',
                toxicity: 0.5,
                politicalBias: 0,
                hoChiMinhRelevance: 0.5,
                educationalValue: 0.5
            };
        }
    }

    /**
     * Phân tích và lưu trữ kết quả AI moderation
     */
    async analyzeAndStore(content: string, title: string, argumentId?: string, userId?: string): Promise<AIModerationDocument> {
        const aiResult = await this.analyzeContent(content, title);

        const aiModeration = new this.aiModerationModel({
            argumentId: argumentId ? argumentId : undefined,
            reviewedBy: userId,
            status: aiResult.isApproved ? ModerationStatus.APPROVED : ModerationStatus.REJECTED,
            riskLevel: aiResult.riskLevel,
            confidence: aiResult.confidence,
            categories: aiResult.categories,
            reasons: aiResult.reasons,
            suggestions: aiResult.suggestions,
            aiAnalysis: aiResult,
            isAutoApproved: aiResult.isApproved,
            requiresHumanReview: aiResult.riskLevel === RiskLevel.HIGH || aiResult.riskLevel === RiskLevel.CRITICAL,
            aiModels: this.openaiApiKey && this.geminiApiKey ? ['openai-gpt4', 'gemini-pro'] :
                this.openaiApiKey ? ['openai-gpt4'] :
                    this.geminiApiKey ? ['gemini-pro'] : ['fallback'],
            metadata: {
                processingTime: Date.now(),
                apiCalls: (this.openaiApiKey ? 1 : 0) + (this.geminiApiKey ? 1 : 0),
                version: '1.0.0'
            }
        });

        return await aiModeration.save();
    }

    /**
     * Lấy danh sách moderation queue
     */
    async getModerationQueue(
        status?: ModerationStatus,
        riskLevel?: RiskLevel,
        page: number = 1,
        limit: number = 20
    ): Promise<{ items: AIModerationDocument[]; totalItems: number; page: number; limit: number }> {
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (riskLevel) {
            filter.riskLevel = riskLevel;
        }

        const skip = Math.max(0, (page - 1) * limit);
        const take = Math.max(1, Math.min(limit, 100));

        const [items, totalItems] = await Promise.all([
            this.aiModerationModel.find(filter)
                .populate('argumentId')
                .populate('reviewedBy', 'username email firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.aiModerationModel.countDocuments(filter)
        ]);

        return { items, totalItems, page, limit: take };
    }

    /**
     * Lấy nội dung được flag cho manual review
     */
    async getFlaggedContent(page: number = 1, limit: number = 20): Promise<{ items: AIModerationDocument[]; totalItems: number; page: number; limit: number }> {
        const filter = {
            requiresHumanReview: true,
            status: { $in: [ModerationStatus.PENDING, ModerationStatus.FLAGGED] }
        };

        const skip = Math.max(0, (page - 1) * limit);
        const take = Math.max(1, Math.min(limit, 100));

        const [items, totalItems] = await Promise.all([
            this.aiModerationModel.find(filter)
                .populate('argumentId')
                .populate('reviewedBy', 'username email firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(take)
                .exec(),
            this.aiModerationModel.countDocuments(filter)
        ]);

        return { items, totalItems, page, limit: take };
    }

    /**
     * Manual review của AI moderation result
     */
    async manualReview(
        id: string,
        status: ModerationStatus,
        userId: string,
        notes?: string,
        overrideAI?: boolean
    ): Promise<AIModerationDocument> {
        const aiModeration = await this.aiModerationModel.findById(id);
        if (!aiModeration) {
            throw new Error('AI moderation record not found');
        }

        aiModeration.status = status;
        aiModeration.reviewedBy = userId as any;
        aiModeration.reviewedAt = new Date();
        aiModeration.manualReviewNotes = notes;
        aiModeration.reviewCount = (aiModeration.reviewCount || 0) + 1;

        if (overrideAI) {
            aiModeration.metadata = {
                ...aiModeration.metadata,
                humanOverride: true,
                overrideReason: notes
            } as any;
        }

        return await aiModeration.save();
    }

    /**
     * Lấy thống kê AI moderation
     */
    async getModerationStats(): Promise<any> {
        const totalCount = await this.aiModerationModel.countDocuments();
        const statusCounts = await this.aiModerationModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const riskLevelCounts = await this.aiModerationModel.aggregate([
            { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
        ]);
        const autoApprovedCount = await this.aiModerationModel.countDocuments({ isAutoApproved: true });
        const manualReviewCount = await this.aiModerationModel.countDocuments({ requiresHumanReview: true });

        return {
            totalCount,
            statusCounts,
            riskLevelCounts,
            autoApprovedCount,
            manualReviewCount,
            timestamp: new Date()
        };
    }

    /**
     * Lấy metrics về độ chính xác của AI
     */
    async getAccuracyMetrics(): Promise<any> {
        const totalReviews = await this.aiModerationModel.countDocuments({ reviewedBy: { $exists: true } });
        const humanOverrides = await this.aiModerationModel.countDocuments({
            'metadata.humanOverride': true
        });
        const accuracyRate = totalReviews > 0 ? ((totalReviews - humanOverrides) / totalReviews) * 100 : 0;

        const categoryStats = await this.aiModerationModel.aggregate([
            { $unwind: '$categories' },
            { $group: { _id: '$categories', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return {
            totalReviews,
            humanOverrides,
            accuracyRate: Math.round(accuracyRate * 100) / 100,
            categoryStats,
            timestamp: new Date()
        };
    }

    /**
     * Retrain AI models với feedback
     */
    async retrainModels(): Promise<{ message: string; status: string }> {
        // Placeholder for retraining logic
        // In a real implementation, this would:
        // 1. Collect feedback data
        // 2. Train new models
        // 3. Deploy updated models

        this.logger.log('Retraining AI models initiated');

        return {
            message: 'AI model retraining initiated. This process may take several hours.',
            status: 'initiated'
        };
    }
}
