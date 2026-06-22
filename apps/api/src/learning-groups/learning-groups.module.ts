import { Module } from '@nestjs/common';
import { LearningGroupsService } from './learning-groups.service';
import { LearningGroupsController } from './learning-groups.controller';

@Module({
  providers: [LearningGroupsService],
  controllers: [LearningGroupsController],
  exports: [LearningGroupsService],
})
export class LearningGroupsModule {}
