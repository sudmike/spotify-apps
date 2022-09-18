import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class BatchGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // skip check if no code is set in environmental variables
    if (!process.env.BATCH_GUARD_SECRET) return true;

    const authorizationHeader = request.headers.authorization;
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      const token = authorizationHeader.split('Bearer ').pop();
      return token === process.env.BATCH_GUARD_SECRET;
    } else {
      return false;
    }
  }
}
