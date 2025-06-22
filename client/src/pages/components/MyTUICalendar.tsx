import React, { useEffect, useRef, useState } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';

export default function MonthlyCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<InstanceType<typeof Calendar> | null>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const calendar = new Calendar(containerRef.current, {
      defaultView: 'month',
      isReadOnly: false,
      usageStatistics: false,
      useFormPopup: true,
      useDetailPopup: true,
      month: {
        dayNames: ['일', '월', '화', '수', '목', '금', '토'],
        startDayOfWeek: 0,
        isAlways6Weeks: true,
        narrowWeekend: false,
        visibleEventCount: 5,
      },
      theme: {
        month: {
          weekend: {
            backgroundColor: '#fff7ed',
          },
        },
      },
      calendars: [
        { id: 'vacation', name: '휴가', backgroundColor: '#f87171', borderColor: '#ef4444', color: '#fff' },
        { id: 'meeting', name: '회의', backgroundColor: '#60a5fa', borderColor: '#3b82f6', color: '#fff' },
        { id: 'deadline', name: '마감', backgroundColor: '#facc15', borderColor: '#eab308', color: '#000' },
        { id: 'out', name: '외근', backgroundColor: '#34d399', borderColor: '#10b981', color: '#000' },
        { id: 'etc', name: '기타', backgroundColor: '#a78bfa', borderColor: '#8b5cf6', color: '#fff' },
      ],
      template: {
        titlePlaceholder() {
          return '제목을 입력하세요';
        },
        locationPlaceholder() {
          return '내용';
        },
        popupDetailBody({ body }) {
          return body || '';
        },
        popupDetailLocation() {
          return '';
        },
      },
    });

    // ✅ 팝업 열릴 때 All day 자동 체크
    calendar.on('beforeCreateEvent', () => {
      setTimeout(() => {
        const checkbox = document.querySelector<HTMLInputElement>('input[name="isAllday"]');
        if (checkbox && !checkbox.checked) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 100);
    });

    calendar.createEvents([
      {
        id: '1',
        calendarId: 'vacation',
        title: '여름 휴가',
        body: '제주도 여행',
        category: 'allday',
        start: '2025-06-25',
        end: '2025-06-27',
      },
      {
        id: '2',
        calendarId: 'meeting',
        title: '팀 회의',
        body: '신제품 기획',
        category: 'time',
        start: '2025-06-24T10:00:00',
        end: '2025-06-24T11:30:00',
      },
    ]);

    calendarRef.current = calendar;
    setCurrentDate(
      calendar.getDate().toDate().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
      })
    );

    return () => calendar.destroy();
  }, []);

  const moveCalendar = (type: 'prev' | 'next' | 'today') => {
    const calendar = calendarRef.current;
    if (!calendar) return;

    if (type === 'prev') calendar.prev();
    else if (type === 'next') calendar.next();
    else calendar.today();

    const newDate = calendar.getDate().toDate().toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
    });
    setCurrentDate(newDate);
  };

  return (
    <div className="p-4 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            📅 휴가 및 일정 관리 - {currentDate}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => moveCalendar('prev')}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              ◀ 이전
            </button>
            <button
              onClick={() => moveCalendar('today')}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              오늘
            </button>
            <button
              onClick={() => moveCalendar('next')}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-100"
            >
              다음 ▶
            </button>
          </div>
        </div>
        <div ref={containerRef} className="h-[800px] rounded border text-base" />
      </div>
    </div>
  );
}
