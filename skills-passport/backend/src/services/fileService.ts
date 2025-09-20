import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../utils/logger';

export interface ProcessedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  text: string;
  path: string;
}

export class FileService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  /**
   * Initialize upload directory
   */
  static async initializeUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Created uploads directory');
    }
  }

  /**
   * Process uploaded CV file and extract text
   */
  static async processUploadedFile(file: Express.Multer.File): Promise<ProcessedFile> {
    try {
      await this.initializeUploadDir();

      // Generate unique filename
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const filename = `${fileId}${fileExtension}`;
      const filePath = path.join(this.uploadDir, filename);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Extract text based on file type
      let extractedText = '';
      
      switch (file.mimetype) {
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(file.buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractTextFromDOCX(file.buffer);
          break;
        case 'text/plain':
          extractedText = file.buffer.toString('utf-8');
          break;
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      const processedFile: ProcessedFile = {
        id: fileId,
        originalName: file.originalname,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        text: extractedText,
        path: filePath
      };

      logger.info('Successfully processed uploaded file', {
        fileId,
        originalName: file.originalname,
        size: file.size,
        textLength: extractedText.length
      });

      return processedFile;

    } catch (error) {
      logger.error('Error processing uploaded file:', error);
      throw error;
    }
  }

  /**
   * Extract text from PDF file
   */
  private static async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Extract text from DOCX file
   */
  private static async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  /**
   * Delete uploaded file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('Deleted file:', filePath);
    } catch (error) {
      logger.error('Error deleting file:', error);
      // Don't throw error for file deletion failures
    }
  }

  /**
   * Validate file before processing
   */
  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF, DOCX, and TXT files are allowed.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.'
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty.'
      };
    }

    return { valid: true };
  }

  /**
   * Get file info by ID
   */
  static async getFileInfo(fileId: string): Promise<ProcessedFile | null> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const targetFile = files.find(f => f.startsWith(fileId));
      
      if (!targetFile) {
        return null;
      }

      const filePath = path.join(this.uploadDir, targetFile);
      const stats = await fs.stat(filePath);
      
      // This is a simplified version - in production, you'd store this metadata in the database
      return {
        id: fileId,
        originalName: targetFile,
        filename: targetFile,
        mimetype: this.getMimeTypeFromExtension(path.extname(targetFile)),
        size: stats.size,
        text: '', // Would need to re-extract or store in DB
        path: filePath
      };

    } catch (error) {
      logger.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Clean up old files (should be run periodically)
   */
  static async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
        }
      }

      logger.info(`Cleaned up old files older than ${maxAgeHours} hours`);

    } catch (error) {
      logger.error('Error cleaning up old files:', error);
    }
  }
}

export default FileService;
