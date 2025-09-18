import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((data) => {
                // If data is already in ApiResponseDto format, return as is
                if (data && typeof data === 'object' && 'statusCode' in data && 'message' in data) {
                    return data;
                }

                // Determine status code
                let statusCode = 200;
                if (request.method === 'POST') {
                    statusCode = 201;
                }

                // Determine message based on HTTP method and status
                let message = 'Success';
                if (request.method === 'POST') {
                    message = 'Created successfully';
                } else if (request.method === 'PUT' || request.method === 'PATCH') {
                    message = 'Updated successfully';
                } else if (request.method === 'DELETE') {
                    message = 'Deleted successfully';
                } else if (request.method === 'GET') {
                    message = 'Retrieved successfully';
                }

                return {
                    statusCode,
                    message,
                    data,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
} 