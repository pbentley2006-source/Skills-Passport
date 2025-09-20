const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export class FileProcessor {
  /**
   * Extract text from uploaded file based on its type
   */
  static async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    console.log('📄 Processing file:', file.originalname, 'Type:', file.mimetype);

    try {
      switch (file.mimetype) {
        case 'application/pdf':
          return await this.extractFromPDF(file.buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDOCX(file.buffer);
        
        case 'text/plain':
          return file.buffer.toString('utf-8');
        
        default:
          throw new Error(`Unsupported file type: ${file.mimetype}`);
      }
    } catch (error: any) {
      console.error('❌ File processing error:', error);
      throw new Error(`Failed to process ${file.mimetype} file: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF buffer
   */
  private static async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      console.log('📖 Extracting text from PDF...');
      const data = await pdfParse(buffer);
      const text = data.text.trim();
      console.log('✅ PDF text extracted, length:', text.length);
      return text;
    } catch (error) {
      console.error('❌ PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF file');
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  private static async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      console.log('📖 Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();
      console.log('✅ DOCX text extracted, length:', text.length);
      
      if (result.messages.length > 0) {
        console.log('⚠️ DOCX extraction warnings:', result.messages);
      }
      
      return text;
    } catch (error) {
      console.error('❌ DOCX extraction failed:', error);
      throw new Error('Failed to extract text from DOCX file');
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
}

export default FileProcessor;
