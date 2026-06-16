import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all published courses' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.findAll(Number(page), Number(limit), user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.findOne(id, user?.id, user?.role);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  remove(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update course progress' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.updateProgress(id, user.id, dto.percentage);
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: 'Get a specific lesson' })
  getLesson(@Param('lessonId') lessonId: string, @CurrentUser() user: any) {
    return this.coursesService.getLesson(lessonId, user?.role);
  }
}
