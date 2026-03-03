import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFiles,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TaskImagesService } from './task-images.service';

@Controller('task-images')
export class TaskImagesController {
  constructor(private readonly taskImagesService: TaskImagesService) {}

  @Post(':taskId/upload')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 files
  async uploadImages(
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.taskImagesService.uploadImages(taskId, files);
  }

  @Get(':taskId')
  async getTaskImages(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskImagesService.getTaskImages(taskId);
  }

  @Get('image/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const stream = await this.taskImagesService.getImageStream(filename);
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    stream.pipe(res);
  }

  @Delete(':imageId')
  async deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.taskImagesService.deleteImage(imageId);
  }

  @Delete('task/:taskId')
  async deleteAllTaskImages(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.taskImagesService.deleteAllTaskImages(taskId);
  }
}