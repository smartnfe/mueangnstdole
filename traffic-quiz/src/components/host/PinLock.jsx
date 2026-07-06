import { useState, useRef, useEffect } from 'react';
import { HOST_PIN } from '../../config';

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index, value) => {
    // อนุญาตเฉพาะตัวเลข
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus ไปช่องถัดไป
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // ตรวจ PIN เมื่อกรอกครบ 4 หลัก
    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin === HOST_PIN) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(['', '', '', '']);
          inputRefs[0].current?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pastedData.length === 4) {
      const newPin = pastedData.split('');
      setPin(newPin);
      if (pastedData === HOST_PIN) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin(['', '', '', '']);
          inputRefs[0].current?.focus();
        }, 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">เข้าสู่ระบบวิทยากร</h2>
          <p className="text-sm text-gray-500">กรุณาใส่รหัส PIN 4 หลัก</p>
        </div>

        <div className="card p-8">
          {/* PIN Input */}
          <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200
                  ${error
                    ? 'border-red-400 bg-red-50 text-red-600 focus:ring-red-200'
                    : digit
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                      : 'border-gray-200 bg-white text-gray-800 focus:border-blue-400 focus:ring-blue-200'
                  }
                  focus:ring-4
                `}
                autoComplete="off"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center mb-4 animate-fade-in">
              <p className="text-sm text-red-500 font-medium flex items-center justify-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                รหัส PIN ไม่ถูกต้อง
              </p>
            </div>
          )}

          {/* Hint */}
          <p className="text-center text-xs text-gray-400">
            🔒 สำหรับวิทยากรเท่านั้น
          </p>
        </div>
      </div>

      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
