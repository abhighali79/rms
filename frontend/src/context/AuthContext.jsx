import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password, role) => {
    const response = await api.post('/auth/login', { username, password, role });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const registerStudent = async (data) => {
    await api.post('/auth/register/student', data);
  };

  const registerProfessor = async (data) => {
    await api.post('/auth/register/professor', data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      registerStudent, 
      registerProfessor, 
      loading,
      isStudent: user?.is_student,
      isProfessor: user?.is_professor,
      isAdmin: user?.is_staff
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
