import { Controller, Get, Param, Patch, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';
import { MessageEvent } from '@nestjs/common';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get(':accountId')
  list(@Param('accountId') accountId: string) {
    return this.notificationService.listNotifications(accountId);
  }

  @Patch(':accountId/:notificationId/read')
  read(
    @Param('accountId') accountId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(notificationId, accountId);
  }

  @Sse('stream/:accountId')
  stream(@Param('accountId') accountId: string): Observable<MessageEvent> {
    return this.notificationService.streamNotifications(accountId);
  }
}
