import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import PlannerForm from './components/PlannerForm';
import ScheduleDisplay from './components/ScheduleDisplay';
import Analytics from './components/Analytics';
import Login from './components/Login';
import Signup from './components/Signup';
import { Calendar, GraduationCap, ArrowLeft, BarChart2, LogOut } from 'lucide-react';

function Home() {
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const generateSchedule = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Send data to Flask backend
      const response = await fetch('http://127.0.0.1:5000/api/generate-schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate schedule');
      }
      setSchedule(data);
    } catch (err) {
      if (err.message === 'Token is missing!' || err.message === 'Token is invalid!') {
        handleLogout();
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPlanner = () => setSchedule(null);
  const userName = localStorage.getItem('userName') || 'Student';

  return (
    <div className="container animate-slide-up">
      <header style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <button 
          onClick={handleLogout}
          className="glass-button glass-button-outline"
          style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', padding: '8px 16px' }}
        >
          <LogOut size={16} style={{ marginRight: '8px' }} /> Logout
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '1rem' }}>
          <GraduationCap size={48} color="#818cf8" />
        </div>
        <h1 style={{ fontSize: '3rem' }} className="text-gradient">Welcome, {userName}!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', marginBottom: '1.5rem' }}>
          Optimize your learning journey. Let our intelligent algorithm distribute your study hours perfectly before the big exam.
        </p>
        <Link to="/analytics" className="glass-button glass-button-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <BarChart2 size={18} style={{ marginRight: '8px' }} /> View Analytics Dashboard
        </Link>
      </header>

      <main>
        {error && (
          <div className="glass-panel" style={{ padding: '16px', margin: '0 auto 2rem', border: '1px solid var(--danger)', maxWidth: '600px', textAlign: 'center' }}>
            <p style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        {!schedule ? (
          <PlannerForm onSubmit={generateSchedule} isLoading={isLoading} />
        ) : (
          <div className="animate-slide-up">
            <button className="glass-button glass-button-outline" onClick={resetPlanner} style={{ marginBottom: '2rem' }}>
              <ArrowLeft size={18} /> Back to Planner
            </button>
            <ScheduleDisplay scheduleData={schedule} />
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
