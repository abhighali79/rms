import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ProfessorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [branchStats, setBranchStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [newBranch, setNewBranch] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/professor/dashboard');
      setBranches(res.data.branches);
      setBranchStats(res.data.branchStats);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.trim()) return;

    try {
      await api.post('/professor/branch', { branch: newBranch.trim().toUpperCase() });
      setMessage({ type: 'success', text: 'Branch added successfully' });
      setNewBranch('');
      fetchDashboard();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add branch' });
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.trim()) return;

    try {
      await api.post('/professor/batch', { batch: parseInt(newBatch) });
      setMessage({ type: 'success', text: 'Batch added successfully' });
      setNewBatch('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to add batch' });
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
          <h1 className="text-xl font-bold">Professor Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Welcome, {user?.first_name || user?.username}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4 md:p-6">
        {message.text && (
          <div className={`p-4 rounded-lg mb-4 ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Branches</h2>
              {loading ? (
                <p>Loading...</p>
              ) : branches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branches.map(branch => (
                    <Link
                      key={branch.id}
                      to={`/professor/batch/${branch.id}`}
                      className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition transform hover:scale-105"
                    >
                      <h3 className="text-2xl font-bold mb-2">{branch.branch}</h3>
                      <p className="text-blue-100">
                        {branchStats[branch.branch] || 0} Students
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No branches found</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Add Branch</h3>
              <form onSubmit={handleAddBranch} className="space-y-3">
                <input
                  type="text"
                  placeholder="Branch Name (e.g., CSE)"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
                >
                  Add Branch
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4">Add Batch</h3>
              <form onSubmit={handleAddBatch} className="space-y-3">
                <input
                  type="number"
                  placeholder="Batch Year (e.g., 2024)"
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
                >
                  Add Batch
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;
