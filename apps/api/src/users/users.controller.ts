import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (member directory)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.findAll(Number(page), Number(limit));
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'avatars'),
      filename: (req: any, file, cb) => {
        const userId = req.user?.id ?? 'unknown';
        cb(null, `${userId}-${Date.now()}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
    const avatarUrl = `${protocol}://${host}/uploads/avatars/${file.filename}`;
    await this.usersService.updateProfile(user.id, { avatarUrl });
    return { avatarUrl };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOneWithFollow(id, user.id);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user' })
  follow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.follow(user.id, id);
  }

  @Delete(':id/follow')
  @ApiOperation({ summary: 'Unfollow a user' })
  unfollow(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.unfollow(user.id, id);
  }
}
