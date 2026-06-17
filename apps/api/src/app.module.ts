import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { CoursesModule } from './courses/courses.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { GdprModule } from './gdpr/gdpr.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { SearchModule } from './search/search.module';
import { InvitesModule } from './invites/invites.module';
import { EmailModule } from './email/email.module';
import { DigestService } from './email/digest.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
      {
        name: 'auth',
        ttl: 900_000,  // 15 minutes
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CoursesModule,
    EventsModule,
    AdminModule,
    GdprModule,
    HealthModule,
    NotificationsModule,
    MessagesModule,
    SearchModule,
    InvitesModule,
    EmailModule,
  ],
  providers: [
    DigestService,
    // UserThrottlerGuard uses authenticated userId as throttle key (falls back to IP),
    // which is more accurate than IP-based limiting behind a reverse proxy.
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
