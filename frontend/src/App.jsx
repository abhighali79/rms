import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import ProfessorLogin from './pages/ProfessorLogin';
import ProfessorRegister from './pages/ProfessorRegister';
import StudentDashboard from './pages/StudentDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import BatchView from './pages/BatchView';
import SemesterView from './pages/SemesterView';
import ResultView from './pages/ResultView';

function PrivateRoute({ children, requireStudent, requireProfessor }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  if (requireStudent && !user.is_student) {
    return <Navigate to="/" />;
  }
  
  if (requireProfessor && !user.is_professor) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/student-register" element={<StudentRegister />} />
      <Route path="/professor-login" element={<ProfessorLogin />} />
      <Route path="/professor-register" element={<ProfessorRegister />} />
      
      <Route path="/student" element={
        <PrivateRoute requireStudent>
          <StudentDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/professor" element={
        <PrivateRoute requireProfessor>
          <ProfessorDashboard />
        </PrivateRoute>
      } />
      
      <Route path="/professor/batch/:branchId" element={
        <PrivateRoute requireProfessor>
          <BatchView />
        </PrivateRoute>
      } />
      
      <Route path="/professor/semester/:branchId/:batchId" element={
        <PrivateRoute requireProfessor>
          <SemesterView />
        </PrivateRoute>
      } />
      
      <Route path="/professor/result/:branchId/:batchId/:sem" element={
        <PrivateRoute requireProfessor>
          <ResultView />
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default App;
