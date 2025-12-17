import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StudentRegister() {
  const [formData, setFormData] = useState({
    usn: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    batch_id: '',
    branch_id: ''
  });
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, batchRes] = await Promise.all([
          api.get('/auth/branches'),
          api.get('/auth/batches')
        ]);
        setBranches(branchRes.data);
        setBatches(batchRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerStudent(formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/student-login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Student Registration</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">USN</label>
            <input
              type="text"
              name="usn"
              value={formData.usn}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 2JR21CS001"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Branch</label>
              <select
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branch}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Batch</label>
              <select
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.batch}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/student-login" className="text-blue-500 hover:underline">
              Login here
            </Link>
          </p>
          <Link to="/" className="text-gray-500 hover:underline text-sm mt-2 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;
