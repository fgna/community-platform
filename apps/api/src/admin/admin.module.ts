import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { InvitesModule } from '../invites/invites.module';

@Module({
  imports: [InvitesModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
