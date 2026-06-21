import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Get('questions')
  getQuestions() {
    return this.assessments.getQuestions();
  }

  @Post()
  submit(
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.assessments.submit(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assessments.findAll(
      user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('latest')
  findLatest(@CurrentUser() user: { id: string }) {
    return this.assessments.findLatest(user.id);
  }
}
