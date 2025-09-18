export class Question {
    constructor(
        public readonly id: string,
        public readonly content: string,
        public readonly topicId: string,
        public readonly createdAt: Date,
    ) { }

    static create(
        content: string,
        topicId: string,
    ): Question {
        return new Question(
            '', // Will be set by repository
            content,
            topicId,
            new Date(),
        );
    }
}
