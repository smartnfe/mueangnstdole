import { useState, useEffect, useCallback } from 'react';
import PinLock from './PinLock';
import Leaderboard from './Leaderboard';
import StatsView from './StatsView';
import Podium from './Podium';
import LoadingSpinner from '../shared/LoadingSpinner';
import { fetchLeaderboard, resetAllData, checkConnection } from '../../utils/api';
import { exportToCSV } from '../../utils/helpers';
import { POLL_INTERVAL, getAppsScriptUrl, setAppsScriptUrl, getDefaultAppsScriptUrl } from '../../config';

const TABS = [
  { id: 'leaderboard', label: '🏅 อันดับคะแนน', shortLabel: 'อันดับ' },
  { id: 'stats', label: '📊 สถิติ', shortLabel: 'สถิติ' },
  { id: 'podium', label: '🏆 Podium', shortLabel: 'Podium' },
];

export default function HostDashboard({ onBack }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSheetsEditor, setShowSheetsEditor] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [sheetsUrl, setSheetsUrl] = useState(getAppsScriptUrl());
  const [isResetting, setIsResetting] = useState(false);

  // ตรวจ session — ถ้าเพิ่งปลดล็อกไปแล้วไม่ต้องกรอก PIN ซ้ำ
  useEffect(() => {
    const session = sessionStorage.getItem('hostUnlocked');
    if (session === 'true') setIsUnlocked(true);
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem('hostUnlocked', 'true');
  };

  const loadData = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      setPlayers(data);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading data:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isUnlocked) loadData();
  }, [loadData, isUnlocked]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh || !isUnlocked) return;
    const interval = setInterval(loadData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData, isUnlocked]);

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCSV(players, `leaderboard_${timestamp}.csv`);
  };

  const handleReset = async () => {
    setIsResetting(true);
    const result = await resetAllData();
    if (result.success) {
      setPlayers([]);
      setShowResetConfirm(false);
    }
    setIsResetting(false);
  };

  const handleSaveSheetsUrl = async () => {
    setAppsScriptUrl(sheetsUrl);
    setShowSheetsEditor(false);
    setIsLoading(true);
    setConnectionStatus('checking');
    await loadData();
  };

  const handleResetUrl = () => {
    const defaultUrl = getDefaultAppsScriptUrl();
    setSheetsUrl(defaultUrl);
  };

  const currentTime = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // ======== PIN LOCK SCREEN ========
  if (!isUnlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  // ======== MAIN DASHBOARD ========
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="กลับ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                  🚦 แดชบอร์ดวิทยากร
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400">กิจกรรมฉีดวัคซีนจราจร</p>
                  {/* Connection Indicator */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${connectionStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-600'
                      : connectionStatus === 'error'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-yellow-50 text-yellow-600'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full
                      ${connectionStatus === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : connectionStatus === 'error'
                          ? 'bg-red-400'
                          : 'bg-yellow-400 animate-pulse'
                      }`} />
                    {connectionStatus === 'connected' ? 'Google Sheets เชื่อมต่อแล้ว' : connectionStatus === 'error' ? 'ขาดการเชื่อมต่อ' : 'กำลังเชื่อมต่อ...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Participant Count */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <span className="text-sm">👥</span>
                <span className="text-sm font-bold text-blue-600">{players.length}</span>
                <span className="text-xs text-blue-500">คน</span>
              </div>

              {/* Clock */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-mono">{currentTime}</span>
              </div>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-xl transition-colors ${
                  autoRefresh
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
                title={autoRefresh ? 'ปิด Auto-refresh' : 'เปิด Auto-refresh'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Manual Refresh */}
              <button
                onClick={loadData}
                className="p-2 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                title="รีเฟรช"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Mobile Stats Bar */}
        <div className="sm:hidden flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">👥</span>
            <span className="text-sm font-bold text-blue-600">{players.length} คน</span>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner message="กำลังโหลดข้อมูล..." />
        ) : (
          <>
            {activeTab === 'leaderboard' && <Leaderboard players={players} />}
            {activeTab === 'stats' && <StatsView players={players} />}
            {activeTab === 'podium' && <Podium players={players} />}
          </>
        )}

        {/* Action Buttons — Bottom Panel */}
        <div className="mt-8 card p-5 sm:p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            จัดการระบบ
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Reset Scores */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-red-700">รีเซ็ตคะแนน</p>
                <p className="text-xs text-red-400">ลบข้อมูลผู้เข้าร่วมทั้งหมด</p>
              </div>
            </button>

            {/* Edit Google Sheets Connection */}
            <button
              onClick={() => {
                setSheetsUrl(getAppsScriptUrl());
                setShowSheetsEditor(true);
              }}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-blue-700">แก้ไขการเชื่อมต่อ</p>
                <p className="text-xs text-blue-400">Google Sheets URL</p>
              </div>
            </button>

            {/* Download CSV */}
            <button
              onClick={handleExportCSV}
              disabled={players.length === 0}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 group text-left
                ${players.length === 0
                  ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                players.length === 0 ? 'bg-gray-100' : 'bg-emerald-100 group-hover:bg-emerald-200'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${players.length === 0 ? 'text-gray-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-bold ${players.length === 0 ? 'text-gray-400' : 'text-emerald-700'}`}>ดาวน์โหลด .CSV</p>
                <p className={`text-xs ${players.length === 0 ? 'text-gray-300' : 'text-emerald-400'}`}>
                  {players.length > 0 ? `${players.length} รายการ` : 'ไม่มีข้อมูล'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <p className="text-center text-xs text-gray-400 mt-6">
            อัปเดตล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
            {autoRefresh && (
              <span className="ml-2 text-emerald-500">• Auto-refresh ทุก {POLL_INTERVAL / 1000} วินาที</span>
            )}
          </p>
        )}
      </main>

      {/* ============ MODALS ============ */}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">ยืนยันรีเซ็ตคะแนน?</h3>
              <p className="text-sm text-gray-500">ข้อมูลผู้เข้าร่วมและคะแนนทั้งหมดจะถูกลบออกจาก Google Sheets ไม่สามารถกู้คืนได้</p>
              {players.length > 0 && (
                <p className="text-sm text-red-500 mt-2 font-medium">
                  ⚠️ มีข้อมูลอยู่ {players.length} รายการ
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-outline flex-1"
                disabled={isResetting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReset}
                className="btn-danger flex-1"
                disabled={isResetting}
              >
                {isResetting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    กำลังรีเซ็ต...
                  </span>
                ) : (
                  'ยืนยันรีเซ็ต'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets URL Editor Modal */}
      {showSheetsEditor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-scale-in">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">แก้ไขการเชื่อมต่อ Google Sheets</h3>
                  <p className="text-xs text-gray-500">วาง URL ของ Google Apps Script Web App</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Google Apps Script URL
                </label>
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="input-field text-sm font-mono"
                />
                <button
                  onClick={handleResetUrl}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  ↩️ คืนค่าเริ่มต้น
                </button>
              </div>

              {/* Connection Status */}
              <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm
                ${connectionStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700'
                  : connectionStatus === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                }`} />
                {connectionStatus === 'connected'
                  ? '✅ เชื่อมต่อ Google Sheets สำเร็จ'
                  : connectionStatus === 'error'
                    ? '❌ ไม่สามารถเชื่อมต่อได้'
                    : '⏳ กำลังตรวจสอบ...'
                }
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSheetsEditor(false)}
                className="btn-outline flex-1"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveSheetsUrl}
                className="btn-primary flex-1"
              >
                <span className="flex items-center justify-center gap-2">
                  💾 บันทึก
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
