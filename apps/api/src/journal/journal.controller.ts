import { Controller, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { UpsertJournalDto } from './dto/upsert-journal.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('journal')
@ApiBearerAuth()
@Controller('journal')
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries for a month' })
  @ApiQuery({ name: 'month', required: false, example: '2026-06' })
  findAll(@CurrentUser() user: any, @Query('month') month?: string) {
    return this.journalService.findAll(user.id, month);
  }

  @Get('prompts')
  @ApiOperation({ summary: 'Get daily journal prompts' })
  getDailyPrompts() {
    return this.journalService.getDailyPrompts();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get journal streak stats' })
  getStats(@CurrentUser() user: any) {
    return this.journalService.getStats(user.id);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Get journal entry for a specific date' })
  findOne(@CurrentUser() user: any, @Param('date') date: string) {
    return this.journalService.findOne(user.id, date);
  }

  @Put(':date')
  @ApiOperation({ summary: 'Create or update journal entry for a date' })
  upsert(
    @CurrentUser() user: any,
    @Param('date') date: string,
    @Body() dto: UpsertJournalDto,
  ) {
    return this.journalService.upsert(user.id, date, dto);
  }

  @Delete(':date')
  @ApiOperation({ summary: 'Delete journal entry for a date' })
  remove(@CurrentUser() user: any, @Param('date') date: string) {
    return this.journalService.delete(user.id, date);
  }
}
