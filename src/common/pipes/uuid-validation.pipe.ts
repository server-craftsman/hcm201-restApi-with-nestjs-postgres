import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'class-validator';

@Injectable()
export class UUIDValidationPipe implements PipeTransform {
    transform(value: any): string {
        if (!value) {
            throw new BadRequestException('ID parameter is required');
        }

        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(value)) {
            throw new BadRequestException(
                `Invalid UUID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, received: ${value}`
            );
        }

        return value;
    }
}
