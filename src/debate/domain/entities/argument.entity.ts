export class Argument {
    constructor(
        public readonly id: string,
        public readonly body: string,
        public readonly authorId: string,
        public readonly questionId: string,
        public readonly createdAt: Date,
    ) { }

    static create(
        body: string,
        authorId: string,
        questionId: string,
    ): Argument {
        return new Argument(
            '', // Will be set by repository
            body,
            authorId,
            questionId,
            new Date(),
        );
    }
}
