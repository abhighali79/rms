import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function BatchView() {
  const { branchId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [batchStats, setBatchStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, [branchId]);

  const fetchBatches = async () => {
    try {
      const res = await api.get(`/professor/batches/${branchId}`);
      setBatches(res.data.batches);
      setBatchStats(res.data.batchStats);
    } catch (err) {
      console.error('Failed to fetch batches:', err);
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
            <Link to="/professor" className="hover:bg-blue-700 px-3 py-2 rounded transition">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Select Batch</h1>
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
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Batches</h2>
          {loading ? (
            <p>Loading...</p>
          ) : batches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {batches.map(batch => (
                <Link
                  key={batch.id}
                  to={`/professor/semester/${branchId}/${batch.id}`}
                  className="block p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white hover:from-green-600 hover:to-green-700 transition transform hover:scale-105"
                >
                  <h3 className="text-2xl font-bold mb-2">{batch.batch}</h3>
                  <p className="text-green-100">
                    {batchStats[batch.batch] || 0} Students
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No batches found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchView;
