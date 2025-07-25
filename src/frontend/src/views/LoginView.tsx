import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const LoginView = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="modern-card text-center"
        >
          <h2 className="text-2xl font-bold text-text mb-4">
            Welcome to ToknTalk
          </h2>
          <p className="text-text-secondary mb-8">
            Connect with your Internet Identity to get started
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="modern-button w-full relative overflow-hidden"
          >
            <span>Connect with Internet Identity</span>
            {/* Loading animation overlay */}
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView; 