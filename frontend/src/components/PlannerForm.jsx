import { useState } from 'react';
import { Plus, Trash2, CalendarDays, BookOpen, Send, Zap } from 'lucide-react';

export default function PlannerForm({ onSubmit, isLoading }) {
  const [examDate, setExamDate] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState(4);
  const [subjects, setSubjects] = useState([
    { id: 1, name: '', difficulty: 'Medium' }
  ]);

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), name: '', difficulty: 'Medium' }]);
  };

  const removeSubject = (id) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(sub => sub.id !== id));
    }
  };

  const updateSubject = (id, field, value) => {
    setSubjects(subjects.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!examDate || subjects.some(s => !s.name.trim())) {
      alert("Please fill all subject names and the exam date.");
      return;
    }
    onSubmit({ examDate, dailyCapacity, subjects });
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ padding: '3rem', maxWidth: '850px', margin: '0 auto', position: 'relative' }}>
      {/* Decorative background glow inside the panel */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'var(--primary-glow)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px', background: 'var(--secondary-glow)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }}></div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', zIndex: 1 }}>
        
        {/* Top Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="animate-slide-up stagger-1">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--text-main)', fontWeight: '600', fontSize: '1.1rem' }}>
              <CalendarDays size={20} color="var(--primary-glow)"/> Target Exam Date
            </label>
            <input 
              type="date"
              className="glass-input"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>
          <div className="animate-slide-up stagger-2">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--text-main)', fontWeight: '600', fontSize: '1.1rem' }}>
              <BookOpen size={20} color="var(--secondary-glow)" /> Max Daily Study Hours
            </label>
            <input 
              type="number"
              min="1" max="24"
              className="glass-input"
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(Number(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Subjects List */}
        <div className="animate-slide-up stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={24} color="var(--accent-glow)" /> Syllabus Subjects
            </h3>
            <button type="button" onClick={addSubject} className="glass-button glass-button-outline" style={{ padding: '8px 16px', fontSize: '0.95rem' }}>
              <Plus size={18} /> Add Subject
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {subjects.map((sub, index) => (
              <div key={sub.id} className="glass-panel" style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(0,0,0,0.2)',
                  animation: `slideUpFade 0.4s ease forwards ${index * 0.1}s`,
                  opacity: 0
                }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))', 
                  width: '36px', height: '36px', 
                  borderRadius: '50%', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0, fontWeight: '800', color: '#000',
                  boxShadow: '0 0 15px rgba(0,242,254,0.3)'
                }}>
                  {index + 1}
                </div>
                <input 
                  type="text"
                  placeholder="e.g. Advanced Calculus"
                  className="glass-input"
                  style={{ flex: 2 }}
                  value={sub.name}
                  onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                  required
                />
                <select 
                  className="glass-input"
                  style={{ flex: 1, cursor: 'pointer', appearance: 'none' }}
                  value={sub.difficulty}
                  onChange={(e) => updateSubject(sub.id, 'difficulty', e.target.value)}
                >
                  <option value="Easy" style={{ background: '#0b0c10' }}>🍃 Easy</option>
                  <option value="Medium" style={{ background: '#0b0c10' }}>⚖️ Medium</option>
                  <option value="Hard" style={{ background: '#0b0c10' }}>🔥 Hard</option>
                </select>
                {subjects.length > 1 && (
                  <button type="button" onClick={() => removeSubject(sub.id)} style={{ 
                    background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.3)', 
                    color: 'var(--danger)', cursor: 'pointer', padding: '10px', borderRadius: '12px',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
                     onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 75, 75, 0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }} className="animate-slide-up stagger-4">
          <button type="submit" className="glass-button" style={{ width: '100%', maxWidth: '350px', fontSize: '1.2rem', padding: '18px' }} disabled={isLoading}>
            {isLoading ? 'Synthesizing...' : <><Send size={22} /> Generate Intelligence Plan</>}
          </button>
        </div>

      </form>
    </div>
  );
}
