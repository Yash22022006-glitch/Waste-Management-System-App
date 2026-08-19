import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password);
      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      setError('An unexpected error occurred during login.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg)] overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[320px] p-6 glass-panel relative z-10 border-t-2 border-b-2 border-blue-600 shadow-[0_0_25px_var(--primary-glow)]"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[var(--text-main)] tracking-widest uppercase mono">SmartWaste<span className="text-blue-600">OS</span></h1>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 mono">Terminal Access</p>
        </div>

        <AuthForm type="login" onSubmit={handleLogin} isLoading={isLoading} error={error} />
        
        <div className="mt-6 text-center">
          <Link to="/signup" className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mono hover:text-blue-400">
            Create Profile
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;