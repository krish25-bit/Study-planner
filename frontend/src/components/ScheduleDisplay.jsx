import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CalendarDays, BrainCircuit, Activity } from 'lucide-react';
import FocusTimer from './FocusTimer';

export default function ScheduleDisplay({ scheduleData }) {
  const { remainingDays, totalAvailableHours, schedule } = scheduleData;
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  
  // Animation state for progress bars
  const [barsWidth, setBarsWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setBarsWidth(100), 100);
    return () => clearTimeout(timer);
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#4ade80';
      case 'Medium': return '#fbbf24';
      case 'Hard': return '#ff4b4b';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel stagger-1" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'var(--primary-glow)', filter: 'blur(60px)', opacity: 0.2 }}></div>
          <CalendarDays size={40} color="var(--primary-glow)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '3rem', color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1 }}>{remainingDays}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Days Until Exam</p>
        </div>
        
        <div className="glass-panel stagger-2" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'var(--secondary-glow)', filter: 'blur(60px)', opacity: 0.2 }}></div>
          <Clock size={40} color="var(--secondary-glow)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '3rem', color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1 }}>{totalAvailableHours}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Total Study Hours</p>
        </div>

        <div className="glass-panel stagger-3" style={{ padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'var(--warning)', filter: 'blur(60px)', opacity: 0.2 }}></div>
          <BrainCircuit size={40} color="var(--warning)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '3rem', color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1 }}>{schedule.length}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Subjects to Master</p>
        </div>
      </div>

      {/* Recommended Strategy Dashboard */}
      <div className="glass-panel stagger-4" style={{ padding: '2.5rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', fontSize: '1.8rem' }}>
          <Activity color="var(--primary-glow)" size={28} />
          Your Optimal Daily Plan
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {schedule.map((item, index) => {
            const maxDaily = Math.max(...schedule.map(s => s.dailyHours));
            const barWidthPercent = (item.dailyHours / maxDaily) * 100;
            const diffColor = getDifficultyColor(item.difficulty);
            
            return (
              <div 
                key={index} 
                style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  borderRadius: '20px', 
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'transform 0.3s',
                  animation: `slideUpFade 0.5s ease forwards ${0.3 + index * 0.1}s`,
                  opacity: 0
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700 }}>{item.subject}</h3>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '8px', 
                      fontSize: '0.85rem', fontWeight: '700',
                      color: diffColor, backgroundColor: 'rgba(0,0,0,0.4)',
                      border: `1px solid ${diffColor}40`
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: diffColor }}></div>
                      {item.difficulty} Priority
                    </span>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-glow)', textShadow: '0 0 10px rgba(0,242,254,0.3)' }}>
                      {item.dailyHours} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500}}>hrs/day</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      {item.totalHours} hrs total allocated
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Daily Weight</span>
                    <span>{Math.round(barWidthPercent)}%</span>
                  </div>
                  <div className="progress-bar-container" style={{height: '10px'}}>
                    <div className="progress-bar-fill" style={{ width: `${(barsWidth * barWidthPercent) / 100}%`, background: `linear-gradient(90deg, var(--primary-glow), ${diffColor})` }}></div>
                  </div>
                </div>

                {/* Focus Timer Trigger */}
                <div style={{ marginTop: '0.5rem' }}>
                  {activeSubjectId === index ? (
                    <div style={{ animation: 'slideUpFade 0.4s ease' }}>
                      <FocusTimer subjectName={item.subject} />
                      <button 
                        onClick={() => setActiveSubjectId(null)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '12px', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                      >
                        Hide Timer
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setActiveSubjectId(index)} 
                      className="glass-button glass-button-outline" 
                      style={{ padding: '8px 16px', fontSize: '0.95rem' }}
                    >
                      <Clock size={16} /> Enter Focus Mode
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
