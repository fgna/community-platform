import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: any,
  ) {
    return this.postsService.findAll(Number(page), Number(limit), user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.postsService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  update(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.postsService.update(id, body.content, user.id, user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.delete(id, user.id, user.role);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.postsService.addComment(id, dto, user.id);
  }

  @Post(':id/reactions/:type')
  @ApiOperation({ summary: 'Toggle a reaction on a post' })
  toggleReaction(
    @Param('id') id: string,
    @Param('type') type: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleReaction(id, type, user.id);
  }
}
