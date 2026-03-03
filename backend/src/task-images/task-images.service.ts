import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TaskImagesService {
  constructor(private prisma: PrismaService) {}

  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'tasks');

  async createUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImages(taskId: number, files: Array<Express.Multer.File>) {
    // Check if task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.createUploadDir();

    const savedImages: any[] = [];
    
    for (const file of files) {
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Save to database
      const taskImage = await this.prisma.taskImage.create({
        data: {
          taskId,
          filename: uniqueFilename,
          filepath: filePath,
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date()
        }
      });

      savedImages.push(taskImage);
    }

    return savedImages;
  }

  async getTaskImages(taskId: number) {
    return this.prisma.taskImage.findMany({
      where: { taskId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async getImageStream(filename: string) {
    const filePath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image not found');
    }

    return fs.createReadStream(filePath);
  }

  async deleteImage(imageId: number) {
    const image = await this.prisma.taskImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete file from disk
    if (fs.existsSync(image.filepath)) {
      fs.unlinkSync(image.filepath);
    }

    // Delete from database
    await this.prisma.taskImage.delete({
      where: { id: imageId }
    });

    return { message: 'Image deleted successfully' };
  }

  async deleteAllTaskImages(taskId: number) {
    const images = await this.prisma.taskImage.findMany({
      where: { taskId }
    });

    for (const image of images) {
      if (fs.existsSync(image.filepath)) {
        fs.unlinkSync(image.filepath);
      }
    }

    await this.prisma.taskImage.deleteMany({
      where: { taskId }
    });

    return { message: 'All task images deleted successfully' };
  }
}