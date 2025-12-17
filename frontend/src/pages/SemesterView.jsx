import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function SemesterView() {
  const { branchId, batchId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState([]);
  const [semesterStats, setSemesterStats] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
  }, [branchId, batchId]);

  const fetchSemesters = async () => {
    try {
      const res = await api.get(`/professor/semesters/${branchId}/${batchId}`);
      setSemesters(res.data.semesters);
      setSemesterStats(res.data.semesterStats);
      setTotalStudents(res.data.totalStudents);
    } catch (err) {
      console.error('Failed to fetch semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={`/professor/batch/${branchId}`} className="hover:bg-blue-700 px-3 py-2 rounded transition">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Select Semester</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">{totalStudents}</h2>
            <p className="text-gray-600">Total Students Registered</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Semesters</h2>
          {loading ? (
            <p>Loading...</p>
          ) : semesters.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {semesters.map(sem => (
                <Link
                  key={sem}
                  to={`/professor/result/${branchId}/${batchId}/${sem}`}
                  className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white hover:from-purple-600 hover:to-purple-700 transition transform hover:scale-105 text-center"
                >
                  <h3 className="text-3xl font-bold mb-2">{sem}</h3>
                  <p className="text-purple-100 text-sm">
                    {semesterStats[sem] || 0} Results
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No semesters with results found. Students need to upload their results first.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SemesterView;
