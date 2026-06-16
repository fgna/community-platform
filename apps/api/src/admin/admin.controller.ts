import { Controller, Get, Patch, Post, Delete, Param, Body, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from '../invites/invites.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private invitesService: InvitesService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.getAllUsers(Number(page), Number(limit));
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: { id: string },
  ) {
    return this.adminService.updateUserRole(id, dto.role, actor.id);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status' })
  toggleUserActive(@Param('id') id: string, @CurrentUser() actor: { id: string }) {
    return this.adminService.toggleUserActive(id, actor.id);
  }

  @Patch('posts/:id/hide')
  @ApiOperation({ summary: 'Toggle post visibility' })
  hidePost(@Param('id') id: string, @CurrentUser() actor: { id: string }) {
    return this.adminService.hidePost(id, actor.id);
  }

  @Patch('posts/:id/pin')
  @ApiOperation({ summary: 'Toggle post pin status' })
  pinPost(@Param('id') id: string, @CurrentUser() actor: { id: string }) {
    return this.adminService.pinPost(id, actor.id);
  }

  @Get('moderation')
  @ApiOperation({ summary: 'Get moderation queue' })
  getModerationQueue() {
    return this.adminService.getModerationQueue();
  }

  @Get('audit-log')
  @ApiOperation({ summary: 'Get audit log' })
  getAuditLog(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.adminService.getAuditLog(Number(page), Number(limit));
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get platform analytics' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update platform settings' })
  updatePlatformSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.adminService.updatePlatformSettings(dto);
  }

  @Post('invites')
  @ApiOperation({ summary: 'Create an invite' })
  createInvite(@Body() dto: CreateInviteDto, @CurrentUser() user: { id: string }) {
    return this.invitesService.createInvite(dto.email, user.id);
  }

  @Get('invites')
  @ApiOperation({ summary: 'List all invites' })
  listInvites(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.invitesService.listInvites(Number(page), Number(limit));
  }

  @Delete('invites/:id')
  @ApiOperation({ summary: 'Revoke an invite' })
  revokeInvite(@Param('id') id: string) {
    return this.invitesService.revokeInvite(id);
  }
}
