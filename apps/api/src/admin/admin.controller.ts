import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

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
  updateUserRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status' })
  toggleUserActive(@Param('id') id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('posts/:id/hide')
  @ApiOperation({ summary: 'Toggle post visibility' })
  hidePost(@Param('id') id: string) {
    return this.adminService.hidePost(id);
  }

  @Patch('posts/:id/pin')
  @ApiOperation({ summary: 'Toggle post pin status' })
  pinPost(@Param('id') id: string) {
    return this.adminService.pinPost(id);
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
}
