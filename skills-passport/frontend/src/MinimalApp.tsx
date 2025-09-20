import { useState } from 'react';
import StandaloneLogin from './StandaloneLogin';
import SimpleDashboard from './SimpleDashboard';
import CVUpload from './CVUpload';
import SkillsProfile from './SkillsProfile';

type AppState = 'login' | 'dashboard' | 'upload' | 'profile';

function MinimalApp() {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [userEmail, setUserEmail] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setCurrentState('dashboard');
  };

  const handleLogout = () => {
    setCurrentState('login');
    setUserEmail('');
    setUploadedFiles([]);
  };

  const handleUploadComplete = (filename: string) => {
    setUploadedFiles(prev => [...prev, filename]);
    setCurrentState('dashboard');
  };

  switch (currentState) {
    case 'login':
      return <StandaloneLogin onLogin={handleLogin} />;
    
    case 'dashboard':
      return (
        <SimpleDashboard 
          onLogout={handleLogout} 
          userEmail={userEmail}
          onNavigateToUpload={() => setCurrentState('upload')}
          onNavigateToProfile={() => setCurrentState('profile')}
          uploadedFiles={uploadedFiles}
        />
      );
    
    case 'upload':
      return (
        <CVUpload 
          onBack={() => setCurrentState('dashboard')}
          onUploadComplete={handleUploadComplete}
        />
      );
    
    case 'profile':
      return (
        <SkillsProfile 
          onBack={() => setCurrentState('dashboard')}
        />
      );
    
    default:
      return <StandaloneLogin onLogin={handleLogin} />;
  }
}

export default MinimalApp;
