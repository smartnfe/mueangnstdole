import { useState } from 'react';

export default function PlayerForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'กรุณากรอกชื่อ-นามสกุล/ชื่อเล่น';
    if (!organization.trim()) newErrors.organization = 'กรุณากรอก ศกร.ตำบล';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ name: name.trim(), organization: organization.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
            <span className="text-3xl">✏️</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">ลงทะเบียนเข้าร่วม</h2>
          <p className="text-sm text-gray-500">กรุณากรอกข้อมูลก่อนเริ่มทำข้อสอบ</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-5">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                ชื่อ-นามสกุล / ชื่อเล่น
              </span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
              placeholder="เช่น สมชาย ใจดี"
              className={`input-field ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
              autoComplete="name"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          {/* Organization Field */}
          <div>
            <label htmlFor="organization" className="block text-sm font-semibold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                ศกร.ตำบล
              </span>
            </label>
            <input
              id="organization"
              type="text"
              value={organization}
              onChange={(e) => { setOrganization(e.target.value); setErrors(prev => ({ ...prev, organization: '' })); }}
              placeholder="เช่น ศกร.ตำบลในเมือง"
              className={`input-field ${errors.organization ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`}
            />
            {errors.organization && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errors.organization}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-primary w-full text-center text-base py-3.5">
            <span className="flex items-center justify-center gap-2">
              เริ่มทำข้อสอบ
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-xs text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ข้อสอบปรนัย 30 ข้อ • จับเวลารวม
          </div>
        </div>
      </div>
    </div>
  );
}
