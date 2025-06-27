import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../../api/events';

// ✅ 타입 정의
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  body?: string;
  calendarId: string;
  category: 'allday' | 'time';
  isAllday: boolean;
  isReadOnly: boolean;
}

interface ToastNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
}

interface ApiEventData {
  id: string;
  title?: string;
  start: string | Date;
  end: string | Date;
  location?: string;
  body?: string;
  calendarId: string;
  isReadOnly?: boolean;
}

export default function MonthlyCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<InstanceType<typeof Calendar> | null>(null);
  const eventsCache = useRef<Map<string, CalendarEvent[]>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);
  
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastNotification>({ type: 'info', message: '', visible: false });
  const [containerHeight, setContainerHeight] = useState(800);

  // ✅ 토스트 알림 시스템 (자동 닫기 타이머 정리 추가)
  const showToast = useCallback((type: ToastNotification['type'], message: string) => {
    setToast({ type, message, visible: true });
    
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);

    // 컴포넌트 언마운트 시 타이머 정리를 위해 ref에 저장
    return () => clearTimeout(timer);
  }, []);

  // ✅ 반응형 높이 계산 (디바운싱 추가)
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    
    const updateHeight = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const vh = window.innerHeight;
        const headerHeight = 200;
        const footerHeight = 180;
        const availableHeight = vh - headerHeight - footerHeight;
        setContainerHeight(Math.max(800, Math.min(1200, availableHeight)));
      }, 100); // 리사이즈 디바운싱
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(resizeTimer);
    };
  }, []);

  // ✅ 캘린더 설정을 메모이제이션으로 최적화
  const calendarOptions = useMemo(() => ({
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
      visibleEventCount: 999,
    },
    theme: {
      month: {
        dayExceptThisMonth: {
          color: '#d1d5db',
        },
        holiday: {
          color: '#ef4444',
        },
        weekend: {
          backgroundColor: '#fef7f7',
        },
        gridCell: {
          headerHeight: 34,
          footerHeight: 4,
        },
      },
    },
    calendars: [
      { 
        id: 'vacation', 
        name: '휴가', 
        backgroundColor: '#fee2e2', 
        borderColor: '#ef4444', 
        color: '#dc2626',
      },
      { 
        id: 'meeting', 
        name: '회의', 
        backgroundColor: '#dbeafe', 
        borderColor: '#3b82f6', 
        color: '#1d4ed8',
      },
      { 
        id: 'deadline', 
        name: '마감', 
        backgroundColor: '#fef3c7', 
        borderColor: '#f59e0b', 
        color: '#d97706',
      },
      { 
        id: 'out', 
        name: '외근', 
        backgroundColor: '#d1fae5', 
        borderColor: '#10b981', 
        color: '#047857',
      },
      { 
        id: 'etc', 
        name: '기타', 
        backgroundColor: '#e0e7ff', 
        borderColor: '#8b5cf6', 
        color: '#7c3aed',
      },
    ],
    template: {
      time({ title }: { title: string }) {
        return title || '(제목 없음)';
      },
      allday({ title }: { title: string }) {
        return title || '(제목 없음)';
      },
      monthGridTitle({ title }: { title: string }) {
        return title || '(제목 없음)';
      },
      popupDetailBody({ body }: { body?: string }) {
        return body ?? '';
      },
      popupDetailLocation({ location }: { location?: string }) {
        return location ? `📍 ${location}` : '';
      },
    },
  }), []);

  // ✅ 캐시 키 생성
  const getCacheKey = useCallback((year: number, month: number) => {
    return `${year}-${month.toString().padStart(2, '0')}`;
  }, []);

  // ✅ 날짜 변환 헬퍼 함수
  const parseDate = useCallback((dateInput: string | Date): Date => {
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
  }, []);

  // ✅ 이벤트 로드 (에러 처리 개선)
  const loadEvents = useCallback(async () => {
    const calendar = calendarRef.current;
    if (!calendar || loading) return;

    const baseDate = calendar.getDate().toDate();
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const cacheKey = getCacheKey(year, month);

    // 캐시 확인
    if (eventsCache.current.has(cacheKey)) {
      const cachedEvents = eventsCache.current.get(cacheKey)!;
      try {
        calendar.clear();
        calendar.createEvents(cachedEvents);
        return;
      } catch (error) {
        console.warn('캐시된 이벤트 로드 실패, 새로 불러옵니다:', error);
        eventsCache.current.delete(cacheKey);
      }
    }

    setLoading(true);
    
    try {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      const data: ApiEventData[] = await getEvents(start, end);
      
      const events: CalendarEvent[] = data.map((e) => ({
        id: e.id,
        title: e.title ?? '(제목 없음)',
        start: parseDate(e.start),
        end: parseDate(e.end),
        location: e.location ?? '',
        body: e.body ?? '',
        calendarId: e.calendarId,
        category: 'allday',
        isAllday: true,
        isReadOnly: e.isReadOnly ?? false,
      }));
      
      // 캐시에 저장
      eventsCache.current.set(cacheKey, events);
      
      // 캘린더에 적용
      calendar.clear();
      calendar.createEvents(events);
      
      showToast('success', `${events.length}개의 일정을 불러왔습니다.`);
    } catch (err) {
      console.error('일정 불러오기 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정을 불러오는데 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [loading, getCacheKey, showToast, parseDate]);

  // ✅ 캐시 무효화
  const invalidateCache = useCallback((date?: Date) => {
    if (date) {
      const cacheKey = getCacheKey(date.getFullYear(), date.getMonth());
      eventsCache.current.delete(cacheKey);
    } else {
      eventsCache.current.clear();
    }
  }, [getCacheKey]);

  // ✅ 이벤트 핸들러들 (타입 안전성 개선)
  const handleCreateEvent = useCallback(async (eventData: any) => {
    if (!eventData.title?.trim()) {
      showToast('error', '일정 제목을 입력해주세요.');
      return;
    }

    const { calendarId, title, body, start, end, location } = eventData;

    try {
      const res = await createEvent({
        calendarId,
        title: title.trim(),
        body: body?.trim() || '',
        category: 'allday',
        isAllday: true,
        location: location?.trim() || '',
        isReadOnly: false,
        start: start.toDate(),
        end: end.toDate(),
      });

      const newEvent: CalendarEvent = {
        ...res.data,
        start: parseDate(res.data.start),
        end: parseDate(res.data.end),
      };

      calendarRef.current?.createEvents([newEvent]);
      invalidateCache(newEvent.start);
      showToast('success', '일정이 생성되었습니다.');
    } catch (err) {
      console.error('일정 저장 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 저장에 실패했습니다: ${errorMessage}`);
    }
  }, [invalidateCache, showToast, parseDate]);

  const handleUpdateEvent = useCallback(async ({ event, changes }: any) => {
    try {
      const payload = {
        ...event,
        ...changes,
        start: changes.start ? changes.start.toDate?.() : event.start.toDate(),
        end: changes.end ? changes.end.toDate?.() : event.end.toDate(),
        location: changes.location ?? event.location ?? '',
        title: changes.title?.trim() || event.title || '(제목 없음)',
        body: changes.body?.trim() ?? event.body ?? '',
        isAllday: true,
        category: 'allday',
      };

      await updateEvent(event.id, payload);
      calendarRef.current?.updateEvent(event.id, event.calendarId, changes);
      invalidateCache(payload.start);
      showToast('success', '일정이 수정되었습니다.');
    } catch (err) {
      console.error('일정 수정 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 수정에 실패했습니다: ${errorMessage}`);
    }
  }, [invalidateCache, showToast]);

  const handleDeleteEvent = useCallback(async ({ id, calendarId }: any) => {
    const confirmDelete = window.confirm('정말 이 일정을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      await deleteEvent(id);
      calendarRef.current?.deleteEvent(id, calendarId);
      eventsCache.current.clear(); // 삭제 시 전체 캐시 클리어
      showToast('success', '일정이 삭제되었습니다.');
    } catch (err) {
      console.error('일정 삭제 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 삭제에 실패했습니다: ${errorMessage}`);
    }
  }, [showToast]);

  // ✅ 캘린더 초기화 (메모리 누수 방지 개선)
  useEffect(() => {
    if (!containerRef.current) return;

    const calendar = new Calendar(containerRef.current, calendarOptions);

    // 이벤트 리스너 등록
    const createHandler = (eventData: any) => handleCreateEvent(eventData);
    const updateHandler = (eventData: any) => handleUpdateEvent(eventData);
    const deleteHandler = (eventData: any) => handleDeleteEvent(eventData);

    calendar.on('beforeCreateEvent', createHandler);
    calendar.on('beforeUpdateEvent', updateHandler);
    calendar.on('beforeDeleteEvent', deleteHandler);

    calendarRef.current = calendar;
    
    setCurrentDate(
      calendar.getDate().toDate().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
      })
    );

    // 초기 데이터 로드
    const loadTimer = setTimeout(() => {
      loadEvents();
    }, 100);

    // ✅ CSS 추가: "+more" 버튼 숨기기 (메모리 누수 방지)
    const style = document.createElement('style');
    style.textContent = `
      .toastui-calendar-month-more-btn {
        display: none !important;
      }
      .toastui-calendar-month-event-block {
        overflow: visible !important;
        max-height: none !important;
      }
      .toastui-calendar-month-events {
        overflow: visible !important;
        max-height: none !important;
      }
      .toastui-calendar-month-date {
        height: auto !important;
        min-height: 120px !important;
      }
    `;
    document.head.appendChild(style);
    styleElementRef.current = style;

    return () => {
      clearTimeout(loadTimer);
      
      // 이벤트 리스너 정리
      if (calendarRef.current) {
        calendarRef.current.off('beforeCreateEvent', createHandler);
        calendarRef.current.off('beforeUpdateEvent', updateHandler);
        calendarRef.current.off('beforeDeleteEvent', deleteHandler);
        calendarRef.current.destroy();
        calendarRef.current = null;
      }
      
      // 스타일 정리
      if (styleElementRef.current?.parentNode) {
        styleElementRef.current.parentNode.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
      
      // 디바운스 타이머 정리
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 수정

  // ✅ 스마트 디바운싱이 적용된 월 이동
  const moveCalendar = useCallback((type: 'prev' | 'next' | 'today') => {
    const calendar = calendarRef.current;
    if (!calendar || loading) return;

    try {
      if (type === 'prev') calendar.prev();
      else if (type === 'next') calendar.next();
      else calendar.today();

      const newDate = calendar.getDate().toDate().toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
      });
      setCurrentDate(newDate);

      // 디바운싱 적용
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        loadEvents();
      }, 150);
    } catch (error) {
      console.error('캘린더 이동 실패:', error);
      showToast('error', '캘린더 이동에 실패했습니다.');
    }
  }, [loading, loadEvents, showToast]);

  // ✅ 버튼 스타일 메모이제이션
  const buttonStyles = useMemo(() => ({
    navigation: "px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
    today: "px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* ✅ 모던 토스트 알림 */}
      {toast.visible && (
        <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform ${
          toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-xl">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-3xl shadow-xl mb-6 p-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* 제목 */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">📅</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  휴가 및 일정 - {currentDate}
                </h1>

              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => moveCalendar('prev')}
                disabled={loading}
                className={buttonStyles.navigation}
                aria-label="이전 달"
              >
                <span className="flex items-center space-x-2">
                  <span>◀</span>
                  <span>이전</span>
                </span>
              </button>
              
              <button 
                onClick={() => moveCalendar('today')}
                disabled={loading}
                className={buttonStyles.today}
                aria-label="오늘"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>로딩</span>
                  </div>
                ) : (
                  '오늘'
                )}
              </button>
              
              <button 
                onClick={() => moveCalendar('next')}
                disabled={loading}
                className={buttonStyles.navigation}
                aria-label="다음 달"
              >
                <span className="flex items-center space-x-2">
                  <span>다음</span>
                  <span>▶</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 캘린더 섹션 */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div 
            ref={containerRef} 
            className="rounded-2xl border border-gray-200 overflow-hidden"
            style={{ height: `${containerHeight}px` }}
          />
          
          {/* ✅ 캘린더 범례 */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-600">캘린더 유형:</span>
            {calendarOptions.calendars.map((cal) => (
              <div key={cal.id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border-2" 
                  style={{ 
                    backgroundColor: cal.backgroundColor, 
                    borderColor: cal.borderColor 
                  }}
                ></div>
                <span className="text-sm text-gray-700">{cal.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 도움말 */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-xl">💡</span>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">사용 방법</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>일정 추가:</strong> 원하는 날짜를 클릭하여 새 일정을 생성하세요</li>
                <li>• <strong>일정 수정:</strong> 기존 일정을 클릭하여 내용을 수정할 수 있습니다</li>
                <li>• <strong>일정 이동:</strong> 일정을 드래그하여 다른 날짜로 이동하세요</li>
                <li>• <strong>일정 삭제:</strong> 일정 상세보기에서 삭제 버튼을 클릭하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}