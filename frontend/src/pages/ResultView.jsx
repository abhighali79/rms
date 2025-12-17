import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function ResultView() {
  const { branchId, batchId, sem } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [branchId, batchId, sem]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/professor/analytics/${branchId}/${batchId}/${sem}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const exportToCSV = () => {
    if (!data?.tableData) return;

    const subjects = Object.keys(data.tableData[0]?.subjects || {});
    const headers = ['USN', 'Name', ...subjects.flatMap(s => [`${s} INT`, `${s} EXT`, `${s} TOT`]), 'Total', 'Percentage', 'Result', 'Class'];
    
    const rows = data.tableData.map(student => {
      const subjectData = subjects.flatMap(s => {
        const sub = student.subjects[s] || {};
        return [sub.internal || '', sub.external || '', sub.total || ''];
      });
      return [student.usn, student.name, ...subjectData, student.total, student.percentage, student.result, student.class];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${data.branch}_${data.batch}_sem${sem}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl text-red-500">Failed to load data</p>
      </div>
    );
  }

  const subjects = data.tableData.length > 0 ? Object.keys(data.tableData[0].subjects) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={`/professor/semester/${branchId}/${batchId}`} className="hover:bg-blue-700 px-3 py-2 rounded transition">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Result Analysis</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToCSV}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition"
            >
              Export CSV
            </button>
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
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">
            {data.branch} - Batch {data.batch} - Semester {sem}
          </h2>
          <p className="text-center text-gray-600">Total Students: {data.totalStudents}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">FCD (First Class Distinction)</h3>
            <p className="text-4xl font-bold">{data.classStats.FCD}</p>
            <p className="text-green-100">80% and above</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">FC (First Class)</h3>
            <p className="text-4xl font-bold">{data.classStats.FC}</p>
            <p className="text-blue-100">60% - 79%</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">SC (Second Class)</h3>
            <p className="text-4xl font-bold">{data.classStats.SC}</p>
            <p className="text-yellow-100">40% - 59%</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Fail</h3>
            <p className="text-4xl font-bold">{data.classStats.Fail}</p>
            <p className="text-red-100">Below 40%</p>
          </div>
        </div>

        {data.toppers.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Top Performers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.toppers.map(topper => (
                <div
                  key={topper.rank}
                  className={`p-4 rounded-lg ${
                    topper.rank === 1 ? 'bg-yellow-100 border-2 border-yellow-400' :
                    topper.rank === 2 ? 'bg-gray-100 border-2 border-gray-400' :
                    'bg-orange-100 border-2 border-orange-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {topper.rank === 1 ? '🥇' : topper.rank === 2 ? '🥈' : '🥉'}
                    </span>
                    <div>
                      <p className="font-bold">{topper.name}</p>
                      <p className="text-sm text-gray-600">{topper.usn}</p>
                      <p className="text-lg font-semibold text-blue-600">{topper.percentage}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Subject-wise Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Pass</th>
                  <th className="p-3">Fail</th>
                  <th className="p-3">Pass %</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.subjectStats).map(([code, stats]) => (
                  <tr key={code} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{code}</td>
                    <td className="p-3">{stats.total}</td>
                    <td className="p-3 text-green-600">{stats.pass}</td>
                    <td className="p-3 text-red-600">{stats.fail}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{stats.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Student Results</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2">USN</th>
                  <th className="p-2">Name</th>
                  {subjects.map(sub => (
                    <th key={sub} className="p-2 text-center" colSpan="3">
                      {sub}
                    </th>
                  ))}
                  <th className="p-2">Total</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Result</th>
                  <th className="p-2">Class</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  {subjects.map(sub => (
                    <React.Fragment key={sub}>
                      <th className="p-1 text-xs text-center">INT</th>
                      <th className="p-1 text-xs text-center">EXT</th>
                      <th className="p-1 text-xs text-center">TOT</th>
                    </React.Fragment>
                  ))}
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody>
                {data.tableData.map((student, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{student.usn}</td>
                    <td className="p-2">{student.name}</td>
                    {subjects.map(sub => {
                      const s = student.subjects[sub] || {};
                      return (
                        <React.Fragment key={sub}>
                          <td className="p-1 text-center">{s.internal || '-'}</td>
                          <td className="p-1 text-center">{s.external || '-'}</td>
                          <td className="p-1 text-center">{s.total || '-'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-2 font-medium">{student.total}</td>
                    <td className="p-2">{student.percentage}%</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.result}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.class === 'FCD' ? 'bg-green-100 text-green-700' :
                        student.class === 'FC' ? 'bg-blue-100 text-blue-700' :
                        student.class === 'SC' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.class}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultView;
