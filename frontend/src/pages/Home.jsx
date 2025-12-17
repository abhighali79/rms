import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Result Management System
          </h1>
          <p className="text-xl text-blue-100">
            Your go-to platform for academic results and management
          </p>
        </header>

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 flex-1 min-w-[300px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Students</h2>
            <p className="text-gray-600 mb-6 text-center">
              Students can upload their results and view analytics
            </p>
            <div className="space-y-3">
              <Link
                to="/student-login"
                className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-center transition"
              >
                Login
              </Link>
              <Link
                to="/student-register"
                className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-center transition"
              >
                Register
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-8 flex-1 min-w-[300px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Professors</h2>
            <p className="text-gray-600 mb-6 text-center">
              Professors can view and manage student results
            </p>
            <div className="space-y-3">
              <Link
                to="/professor-login"
                className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-center transition"
              >
                Login
              </Link>
              <Link
                to="/professor-register"
                className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-center transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-white mb-6">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="text-lg font-semibold text-white mb-2">Real-time Analytics</h4>
              <p className="text-blue-100 text-sm">View passing rates, toppers, and performance trends</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-4xl mb-3">📄</div>
              <h4 className="text-lg font-semibold text-white mb-2">PDF Upload</h4>
              <p className="text-blue-100 text-sm">Upload result PDFs with automatic text extraction</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-4xl mb-3">📥</div>
              <h4 className="text-lg font-semibold text-white mb-2">Excel Export</h4>
              <p className="text-blue-100 text-sm">Download comprehensive reports in Excel format</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
