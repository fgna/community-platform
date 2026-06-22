import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LearningGroupsService } from './learning-groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('learning-groups')
@ApiBearerAuth()
@Controller('learning-groups')
export class LearningGroupsController {
  constructor(private service: LearningGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a learning group' })
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List current user's learning groups" })
  findAll(@CurrentUser() user: any) {
    return this.service.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group detail with members, messages, and goals' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a learning group' })
  join(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.join(id, user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a learning group' })
  leave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.leave(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to the group (creator only)' })
  addMember(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.addMember(id, userId, user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member or leave group' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.removeMember(id, userId, user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message to the group chat' })
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendGroupMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.service.sendMessage(id, user.id, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List group messages (paginated)' })
  getMessages(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @CurrentUser() user: any,
  ) {
    return this.service.getMessages(id, user.id, Number(page), Number(limit));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group (creator only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteGroup(id, user.id);
  }
}
