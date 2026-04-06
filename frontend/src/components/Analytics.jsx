import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowLeft, PieChart as PieChartIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

function Analytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchAnalytics(token);
    }
  }, [navigate]);

  const fetchAnalytics = async (token) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to fetch analytics');
      }
      setData(result);
    } catch (err) {
      if (err.message === 'Token is missing!' || err.message === 'Token is invalid!') {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="text-center" style={{ margin: '5rem' }}>Loading analytics...</div>;
  
  if (error) return (
    <div className="glass-panel" style={{ padding: '16px', margin: '2rem auto', border: '1px solid var(--danger)', maxWidth: '600px', textAlign: 'center' }}>
      <p style={{ color: '#fca5a5' }}>{error}</p>
      <Link to="/" className="glass-button glass-button-outline" style={{ marginTop: '1rem', display: 'inline-flex' }}>
        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Home
      </Link>
    </div>
  );

  if (!data || data.total_plans === 0) {
    return (
      <div className="container animate-slide-up" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>No analytics available yet.</h2>
        <p>Create some study plans to see the data!</p>
        <Link to="/" className="glass-button glass-button-outline" style={{ marginTop: '2rem', display: 'inline-flex' }}>
          <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Go Create a Plan
        </Link>
      </div>
    );
  }

  // Format data for Recharts
  const pieData = data.difficulty_distribution ? Object.entries(data.difficulty_distribution).map(([name, value]) => ({ name, value })) : [];
  const barData = data.popular_subjects ? Object.entries(data.popular_subjects).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="container animate-slide-up">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(52, 211, 153, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '1rem' }}>
          <PieChartIcon size={48} color="#34d399" />
        </div>
        <h1 style={{ fontSize: '3rem' }} className="text-gradient">Data Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Insights on how students are planning their studies. Data processed with Pandas.
        </p>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="glass-button glass-button-outline">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to Planner
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', animation: 'slideUpFade 0.4s ease forwards 0.1s', opacity: 0 }}>
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Plans</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', margin: '10px 0 0 0', color: 'var(--primary-glow)' }}>{data.total_plans}</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', animation: 'slideUpFade 0.4s ease forwards 0.2s', opacity: 0 }}>
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Avg Days Left</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', margin: '10px 0 0 0', color: 'var(--secondary-glow)' }}>{data.average_remaining_days}</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem', animation: 'slideUpFade 0.4s ease forwards 0.3s', opacity: 0 }}>
          <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Avg Daily Hours</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', margin: '10px 0 0 0', color: 'var(--warning)' }}>{data.average_daily_capacity}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', animation: 'slideUpFade 0.4s ease forwards 0.4s', opacity: 0 }}>
        {barData.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-main)' }}>Most Popular Subjects</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-main)' }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-main)' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: 'var(--text-muted)', marginBottom: '5px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="value" fill="url(#colorB)" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-main)' }}>Subject Difficulty</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={2}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
