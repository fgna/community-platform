import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ReportsService } from './reports.service';
import { AdminController } from './admin.controller';
import { InvitesModule } from '../invites/invites.module';

@Module({
  imports: [InvitesModule],
  providers: [AdminService, ReportsService],
  controllers: [AdminController],
})
export class AdminModule {}
