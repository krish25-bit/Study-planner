import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Minus, Plus, Settings2, Users } from 'lucide-react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export default function FocusTimer({ subjectName }) {
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // Real-time states
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomUsers, setRoomUsers] = useState(1);
  const socketRef = useRef(null);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished!
      setIsActive(false);
      setSessionsCompleted(s => s + 1);
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // When selectedMinutes changes, update timeLeft (only if not active)
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(selectedMinutes * 60);
    }
  }, [selectedMinutes, isActive]);

  // Socket setup
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('room-users', (count) => setRoomUsers(count));

    socketRef.current.on('timer-sync', (serverState) => {
      setIsActive(serverState.isActive);
      setTimeLeft(serverState.timeLeft);
      setSelectedMinutes(serverState.selectedMinutes);
    });

    socketRef.current.on('timer-action', ({ action, payload, serverState }) => {
      if (action === 'start') setIsActive(true);
      if (action === 'pause') setIsActive(false);
      if (action === 'reset' || action === 'change-minutes') {
        setIsActive(false);
        setTimeLeft(serverState.timeLeft);
        setSelectedMinutes(serverState.selectedMinutes);
      }
    });


    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (roomId.trim() && socketRef.current) {
      socketRef.current.emit('join-room', roomId);
      setIsInRoom(true);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
    }
    setIsInRoom(false);
    setRoomUsers(1);
    setRoomId('');
  };

  const toggleTimer = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    setIsEditing(false); // Close edit mode if active
    if (isInRoom && socketRef.current) {
      socketRef.current.emit('timer-action', { roomId, action: newIsActive ? 'start' : 'pause', payload: {} });
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(selectedMinutes * 60);
    if (isInRoom && socketRef.current) {
      socketRef.current.emit('timer-action', { roomId, action: 'reset', payload: { selectedMinutes } });
    }
  };

  const adjustTime = (amount) => {
    if (isActive) return;
    const newTime = Math.max(1, Math.min(120, selectedMinutes + amount));
    setSelectedMinutes(newTime);
    if (isInRoom && socketRef.current) {
      socketRef.current.emit('timer-action', { roomId, action: 'change-minutes', payload: { selectedMinutes: newTime } });
    }
  };


  // Calculate percentage for circular progress
  const totalSeconds = selectedMinutes * 60;
  const percentage = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 52; 
  const offset = circumference - (percentage / 100) * circumference;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Join Room UI */}
      <div style={{ padding: '0.8rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={18} color="var(--primary-glow)" />
          <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>Study Room</span>
          {isInRoom && <span style={{ fontSize: '0.8rem', background: 'rgba(0, 242, 254, 0.2)', color: 'var(--primary-glow)', padding: '2px 8px', borderRadius: '12px' }}>{roomUsers} {roomUsers === 1 ? 'Person' : 'People'}</span>}
        </div>
        {!isInRoom ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Room ID (e.g. math101)" 
              value={roomId} 
              onChange={e => setRoomId(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
            <button onClick={joinRoom} style={{ background: 'var(--primary-glow)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Join</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Room: <strong style={{color: 'var(--text-main)'}}>{roomId}</strong></span>
            <button onClick={leaveRoom} style={{ background: 'rgba(255,75,75,0.1)', color: 'var(--danger)', border: '1px solid rgba(255,75,75,0.3)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>Leave</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
      
      <div className="circular-timer" style={{ position: 'relative' }}>
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" />
          <circle 
            className="progress" 
            cx="60" 
            cy="60" 
            r="52" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
          />
        </svg>
        <div className="time-display">{formatTime(timeLeft)}</div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '800' }}>
            Focus Session Active
          </h4>
          {!isActive && (
             <button 
               onClick={() => setIsEditing(!isEditing)}
               style={{ background: 'transparent', border: 'none', color: isEditing ? 'var(--primary-glow)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', padding: '4px' }}
               title="Configure Timer"
             >
               <Settings2 size={18} />
             </button>
          )}
        </div>
        
        {/* Sleek Time Configuration Pill */}
        <div style={{ height: isEditing && !isActive ? 'auto' : 0, overflow: 'hidden', opacity: isEditing && !isActive ? 1 : 0, transition: 'all 0.3s ease-in-out', marginBottom: isEditing && !isActive ? '1rem' : 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
            <button onClick={() => adjustTime(-5)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              <Minus size={14} />
            </button>
            <div style={{ minWidth: '45px', textAlign: 'center', fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {selectedMinutes} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
            </div>
            <button onClick={() => adjustTime(5)} style={{ background: 'var(--primary-glow)', border: 'none', color: '#000', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(0, 242, 254, 0.4)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={toggleTimer}
            style={{
              background: isActive ? 'rgba(255, 75, 75, 0.15)' : 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.2))',
              border: `1px solid ${isActive ? 'var(--danger)' : 'var(--primary-glow)'}`,
              color: isActive ? 'var(--danger)' : '#fff',
              padding: '8px 20px', borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', transition: 'all 0.3s',
              boxShadow: isActive ? 'none' : '0 4px 15px rgba(0, 242, 254, 0.2)'
            }}
            onMouseOver={e => { if(!isActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { if(!isActive) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />} 
            {isActive ? 'Pause' : 'Start Focus'}
          </button>
          
          <button 
            onClick={resetTimer}
            style={{
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s', fontWeight: '600'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
          <CheckCircle size={16} color="var(--success)" />
          {sessionsCompleted} sessions completed
        </div>
      </div>
      </div>


    </div>
  );
}
