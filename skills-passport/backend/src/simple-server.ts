import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { FileProcessor } from './services/fileProcessor';
import { SimpleAIService } from './services/simpleAI';

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Basic middleware
app.use(cors({
  origin: 'https://skills-passport-ai-mvp.netlify.app',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for demo
const users = new Map();
const uploads = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    features: {
      openai: !!process.env.OPENAI_API_KEY,
      fileUpload: true,
      aiAnalysis: true,
      marketInsights: true
    }
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' }
    });
  }

  // Demo authentication - accept any email/password
  const user = {
    id: `user_${Date.now()}`,
    email,
    firstName: 'Demo',
    lastName: 'User'
  };

  users.set(user.id, user);

  res.json({
    success: true,
    data: {
      user,
      token: `demo_token_${user.id}`
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'No token provided' }
    });
  }

  const token = authHeader.substring(7);
  const userId = token.replace('demo_token_', '');
  const user = users.get(userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid token' }
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

// CV upload endpoint
app.post('/api/cvs/upload', upload.single('cv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'No file uploaded' }
    });
  }

  // Validate file
  const validation = FileProcessor.validateFile(req.file);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: { message: validation.error }
    });
  }

  const uploadId = `upload_${Date.now()}`;
  const uploadData = {
    id: uploadId,
    filename: req.file.originalname,
    status: 'UPLOADED',
    uploadedAt: new Date().toISOString(),
    extractedSkills: null,
    anonymizedCV: null
  };

  uploads.set(uploadId, uploadData);

  // Start real processing in background
  processCV(uploadId, req.file).catch(error => {
    console.error('❌ Background CV processing failed:', error);
    const upload = uploads.get(uploadId);
    if (upload) {
      upload.status = 'FAILED';
      upload.error = error.message;
      uploads.set(uploadId, upload);
    }
  });

  res.json({
    success: true,
    data: {
      uploadId,
      filename: req.file.originalname,
      status: 'UPLOADED',
      message: 'CV uploaded successfully. AI processing will begin shortly.'
    }
  });
});

// Real CV processing function
async function processCV(uploadId: string, file: Express.Multer.File) {
  console.log('🚀 Starting real CV processing for:', uploadId);
  
  try {
    // Update status to processing
    const upload = uploads.get(uploadId);
    if (upload) {
      upload.status = 'PROCESSING';
      uploads.set(uploadId, upload);
    }

    // Extract text from file
    console.log('📄 Extracting text from file...');
    const cvText = await FileProcessor.extractTextFromFile(file);
    
    if (!cvText || cvText.length < 10) {
      throw new Error('Could not extract meaningful text from the uploaded file');
    }

    console.log('✅ Text extracted successfully, length:', cvText.length);

    // Extract skills using AI
    console.log('🤖 Starting AI analysis...');
    const extractedSkills = await SimpleAIService.extractSkillsFromCV(cvText);
    
    // Anonymize CV content
    console.log('🔒 Anonymizing CV content...');
    const anonymizedCV = SimpleAIService.anonymizeCV(cvText);

    // Update upload with results
    const finalUpload = uploads.get(uploadId);
    if (finalUpload) {
      finalUpload.status = 'PARSED';
      finalUpload.extractedSkills = extractedSkills;
      finalUpload.anonymizedCV = anonymizedCV;
      finalUpload.profile = {
        id: `profile_${Date.now()}`,
        candidateId: `ANON_${Date.now()}`,
        createdAt: new Date().toISOString(),
        skills: extractedSkills
      };
      uploads.set(uploadId, finalUpload);
    }

    console.log('✅ CV processing completed successfully for:', uploadId);
    console.log('📊 Extracted', extractedSkills.technicalSkills.length, 'technical skills');
    console.log('📊 Extracted', extractedSkills.softSkills.length, 'soft skills');

  } catch (error) {
    console.error('❌ CV processing failed for', uploadId, ':', error);
    throw error;
  }
}

// Get user uploads
app.get('/api/cvs/user/uploads', (req, res) => {
  const uploadsArray = Array.from(uploads.values());
  
  res.json({
    success: true,
    data: { uploads: uploadsArray }
  });
});

// Get extracted skills for a specific upload
app.get('/api/cvs/:uploadId/skills', (req, res) => {
  const { uploadId } = req.params;
  const upload = uploads.get(uploadId);

  if (!upload) {
    return res.status(404).json({
      success: false,
      error: { message: 'Upload not found' }
    });
  }

  if (upload.status !== 'PARSED' || !upload.extractedSkills) {
    return res.status(200).json({
      success: true,
      data: {
        status: upload.status,
        message: upload.status === 'PROCESSING' ? 'Still processing...' : 
                upload.status === 'FAILED' ? 'Processing failed' : 'Not yet processed'
      }
    });
  }

  res.json({
    success: true,
    data: {
      status: upload.status,
      skills: upload.extractedSkills,
      profile: upload.profile
    }
  });
});

// Get upload status
app.get('/api/cvs/:uploadId/status', (req, res) => {
  const { uploadId } = req.params;
  const upload = uploads.get(uploadId);

  if (!upload) {
    return res.status(404).json({
      success: false,
      error: { message: 'Upload not found' }
    });
  }

  res.json({
    success: true,
    data: {
      id: upload.id,
      filename: upload.filename,
      status: upload.status,
      uploadedAt: upload.uploadedAt,
      ...(upload.error && { error: upload.error })
    }
  });
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Catch all
app.get('*', (req, res) => {
  res.json({ message: 'Skills Passport API - Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS enabled for: https://skills-passport-ai-mvp.netlify.app`);
});
