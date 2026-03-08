import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Logout from './pages/logout';
import SignIn from './pages/signin';
import Task from './pages/task';
import { useAuth } from './pages/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading... (Ruko bhai check kar raha hoon)</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();
  return (
    <div className="App">
      <Router>
        <div style={{ padding: "10px", backgroundColor: "#282c34" }}>
          <Link to="/login" style={{ color: "white", margin: "10px" }}>Login</Link>
          <Link to="/signin" style={{ color: "white", margin: "10px" }}>Sign Up</Link>
          <Link to="/tasks" style={{ color: "white", margin: "10px" }}>My Tasks</Link>
          <span style={{ padding: "10px", color: "white", margin: '5px', fontSize: '22px', textTransform: "uppercase" }}>{user?.name}</span>
          <Logout />
        </div>

        <header className="App-header">
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <Task />
              </ProtectedRoute>
            } />

            <Route path="*" element={<h1>404: Bhai galat raste aa gaye!</h1>} />
          </Routes>
        </header>
      </Router>
    </div >
  );
}

export default App;
