export type FormatResponse<T> = {
    data: T;
    message: string;
    statusCode: number;
    timestamp: Date;
}

export type ErrorResponse = {
    message: string;
    field: string;
    statusCode: number;
    timestamp: Date;
}
