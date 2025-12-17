import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [marks, setMarks] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [semesterPercentages, setSemesterPercentages] = useState({});
  const [selectedSem, setSelectedSem] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const fetchMarks = useCallback(async () => {
    try {
      const res = await api.get('/student/marks');
      setMarks(res.data.marks);
      setSemesters(res.data.semesters);
      setSemesterPercentages(res.data.semesterPercentages);
      if (res.data.semesters.length > 0 && !selectedSem) {
        setSelectedSem(res.data.semesters[0]);
      }
    } catch (err) {
      console.error('Failed to fetch marks:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSem]);

  useEffect(() => {
    fetchMarks();
  }, []);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 10MB.' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/student/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      setMessage({ type: 'success', text: res.data.message });
      setFile(null);
      setUploadProgress(0);
      fetchMarks();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderAttemptStars = (attempts) => {
    if (!attempts || attempts <= 1) return null;
    return (
      <span className="ml-2 text-yellow-500" title={`Cleared in ${attempts} attempts`}>
        {'*'.repeat(attempts)}
      </span>
    );
  };

  const filteredMarks = selectedSem ? marks.filter(m => m.sem === selectedSem) : marks;

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-10"></div></td>
      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Student Dashboard</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Semester Performance</h2>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-4 rounded-lg bg-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : semesters.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {semesters.map(sem => (
                    <div
                      key={sem}
                      onClick={() => setSelectedSem(sem)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedSem === sem
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg font-bold">Sem {sem}</div>
                      <div className="text-2xl font-bold">
                        {semesterPercentages[sem] || 0}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No results uploaded yet</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedSem ? `Semester ${selectedSem} Results` : 'All Results'}
              </h2>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <strong>Note:</strong> Stars (*) indicate multiple attempts to clear a subject. 
                ** means cleared in 2nd attempt, *** means 3rd attempt, and so on.
              </div>
              {loading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3">Subject Code</th>
                        <th className="p-3">Internal</th>
                        <th className="p-3">External</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
                    </tbody>
                  </table>
                </div>
              ) : filteredMarks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3">Subject Code</th>
                        <th className="p-3">Internal</th>
                        <th className="p-3">External</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarks.map((m, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{m.subject_code}</td>
                          <td className="p-3">{m.internal}</td>
                          <td className="p-3">{m.external}</td>
                          <td className="p-3">
                            {m.total}
                            {renderAttemptStars(m.attempts)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              m.result === 'P' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {m.result === 'P' ? 'Pass' : 'Fail'}
                            </span>
                            {m.attempts > 1 && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({m.attempts} attempts)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No marks found</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Upload Result PDF</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload your semester result PDF. If you have cleared any backlogs, 
                they will be automatically updated in the original semester with attempt count.
              </p>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
                </div>
                {uploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Backlog Tracking</h2>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>How it works:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Upload your result PDF for each semester</li>
                  <li>If you fail a subject, it shows as "Fail"</li>
                  <li>When you clear the backlog later, upload that result</li>
                  <li>The system automatically updates the original semester</li>
                  <li>Stars indicate attempts taken to clear the subject</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
