export class Topic {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly description: string | null,
        public readonly ownerId: string,
        public readonly createdAt: Date,
    ) { }

    static create(
        title: string,
        description: string | null,
        ownerId: string,
    ): Topic {
        return new Topic(
            '', // Will be set by repository
            title,
            description,
            ownerId,
            new Date(),
        );
    }
}
