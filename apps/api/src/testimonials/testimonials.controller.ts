import { Controller, Get, Post, Patch, Delete, Body, Param, Query, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../auth/guards/jwt-auth.guard';

@ApiTags('testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private testimonialsService: TestimonialsService) {}

  @Get()
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({ summary: 'List approved testimonials' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.testimonialsService.findAll(Number(page), Number(limit));
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a testimonial (requires approval)' })
  create(@Body() dto: CreateTestimonialDto, @CurrentUser() user: any) {
    return this.testimonialsService.create(user.id, dto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a testimonial (Admin only)' })
  approve(@Param('id') id: string) {
    return this.testimonialsService.approve(id);
  }

  @Patch(':id/feature')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle featured status (Admin only)' })
  toggleFeatured(@Param('id') id: string) {
    return this.testimonialsService.toggleFeatured(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a testimonial (Admin only)' })
  remove(@Param('id') id: string) {
    return this.testimonialsService.delete(id);
  }
}
