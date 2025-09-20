const fs = require('fs');
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUpload() {
  try {
    console.log('🧪 Testing CV upload and processing...');
    
    // Create a simple test CV content
    const testCV = `
John Doe
Software Engineer

Experience:
- 3 years of Python development
- Worked with Django and Flask
- Database management with PostgreSQL
- Team leadership and project management
- Strong communication skills

Education:
- Bachelor's in Computer Science
- University of Technology, 2020

Skills:
- Python, SQL, Git
- Problem solving, teamwork
`;

    // Create a temporary file
    fs.writeFileSync('/tmp/test-cv.txt', testCV);
    
    // First, login to get a token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData.success ? 'Success' : 'Failed');
    
    if (!loginData.success) {
      throw new Error('Login failed');
    }
    
    const token = loginData.data.token;
    
    // Upload the CV
    console.log('📄 Uploading CV...');
    const formData = new FormData();
    formData.append('cv', fs.createReadStream('/tmp/test-cv.txt'));
    
    const uploadResponse = await fetch('http://localhost:3001/api/cvs/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const uploadData = await uploadResponse.json();
    console.log('📤 Upload response:', uploadData);
    
    if (!uploadData.success) {
      throw new Error('Upload failed: ' + JSON.stringify(uploadData));
    }
    
    const uploadId = uploadData.data.uploadId;
    console.log('🆔 Upload ID:', uploadId);
    
    // Wait for processing and check results
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check skills
    console.log('🔍 Checking extracted skills...');
    const skillsResponse = await fetch(`http://localhost:3001/api/cvs/${uploadId}/skills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const skillsData = await skillsResponse.json();
    console.log('🎯 Skills extraction result:', JSON.stringify(skillsData, null, 2));
    
    // Cleanup
    fs.unlinkSync('/tmp/test-cv.txt');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUpload();
