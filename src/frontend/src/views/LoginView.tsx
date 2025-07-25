import { useAuth } from '../context/AuthContext';
import { Button } from '../components';

const LoginView = () => {
  const { login } = useAuth();

  return (
    <div className="bg-gray-700 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-bold mb-4">Authentication</h3>
      <p className="mb-4">Please log in with Internet Identity to use this application.</p>
      <Button onClick={login}>
        Log in with Internet Identity
      </Button>
    </div>
  );
};

export default LoginView; 