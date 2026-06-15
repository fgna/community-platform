import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
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
  ],
})
export class AppModule {}
