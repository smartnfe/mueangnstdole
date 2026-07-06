import { useState, useEffect } from 'react';
import { checkConnection } from '../utils/api';
import { getAppsScriptUrl } from '../config';

export default function LandingPage({ onSelectRole }) {
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking' | 'connected' | 'error'
  const [connectionMessage, setConnectionMessage] = useState('กำลังตรวจสอบ...');
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    const url = getAppsScriptUrl();
    if (!url) {
      setConnectionStatus('error');
      setConnectionMessage('ยังไม่ได้ตั้งค่า Google Sheets URL');
      return;
    }

    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setConnectionStatus('checking');
    setConnectionMessage('กำลังตรวจสอบการเชื่อมต่อ...');

    const result = await checkConnection();
    if (result.connected) {
      setConnectionStatus('connected');
      setConnectionMessage('เชื่อมต่อ Real-time คลาวด์สำเร็จ');
      setPlayerCount(result.playerCount || 0);
    } else {
      setConnectionStatus('error');
      setConnectionMessage(result.message || 'ไม่สามารถเชื่อมต่อได้');
    }
  };

  const statusConfig = {
    checking: {
      bg: 'bg-yellow-50 border-yellow-200',
      dot: 'bg-yellow-400 animate-pulse',
      text: 'text-yellow-700',
      icon: '⏳',
    },
    connected: {
      bg: 'bg-emerald-50 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
      text: 'text-emerald-700',
      icon: '✅',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-400',
      text: 'text-red-700',
      icon: '❌',
    },
  };

  const status = statusConfig[connectionStatus];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="mb-6 relative inline-block">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <span className="text-5xl sm:text-6xl">🚦</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-bounce-in">
              30
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2 leading-tight">
            กิจกรรมตอบคำถาม
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent mb-3">
            ฉีดวัคซีนจราจร
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full text-sm text-blue-600 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            30 ข้อ • วินัยและกฎจราจร
          </div>
        </div>

        {/* Connection Status Card */}
        <div className={`mb-6 rounded-xl border-2 p-4 transition-all duration-500 ${status.bg}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{status.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`}></div>
                <p className={`text-sm font-semibold ${status.text}`}>
                  {connectionMessage}
                </p>
              </div>
              {connectionStatus === 'connected' && (
                <p className="text-xs text-emerald-600 mt-1 ml-4">
                  Google Sheets (ฝังในโค้ดแล้ว) • {playerCount > 0 ? `มีข้อมูลผู้เข้าร่วม ${playerCount} คน` : 'พร้อมรับข้อมูล'}
                </p>
              )}
              {connectionStatus === 'error' && (
                <p className="text-xs text-red-500 mt-1 ml-4">
                  กรุณาตรวจสอบการตั้งค่า Google Apps Script
                </p>
              )}
            </div>
            {connectionStatus !== 'checking' && (
              <button
                onClick={checkConnectionStatus}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                title="ตรวจสอบอีกครั้ง"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          {/* Player Button */}
          <button
            onClick={() => onSelectRole('player')}
            className="w-full card p-5 sm:p-6 text-left group hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                📱
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-0.5">ผู้เข้ารับการอบรม</h3>
                <p className="text-sm text-gray-500">เข้าร่วมตอบคำถาม 30 ข้อ</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Host Button */}
          <button
            onClick={() => onSelectRole('host')}
            className="w-full card p-5 sm:p-6 text-left group hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                🖥️
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-0.5">วิทยากร</h3>
                <p className="text-sm text-gray-500">แดชบอร์ดสำหรับจอ Projector</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          ระบบตอบคำถามออนไลน์ • เพื่อส่งเสริมวินัยจราจร
        </p>
      </div>
    </div>
  );
}
