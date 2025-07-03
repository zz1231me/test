import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Calendar from '@toast-ui/calendar';
import '@toast-ui/calendar/dist/toastui-calendar.min.css';
// ✅ 공식 문서: useFormPopup 사용 시 필수 CSS imports
import 'tui-date-picker/dist/tui-date-picker.css';
import 'tui-time-picker/dist/tui-time-picker.css';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../../api/events';

// ✅ 공식 API 문서 기반 정확한 타입 정의
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

function MonthlyCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<Calendar | null>(null);
  const eventsCache = useRef<Map<string, CalendarEvent[]>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const currentViewDate = useRef(new Date());
  
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastNotification>({ type: 'info', message: '', visible: false });

  // ✅ 토스트 알림 시스템
  const showToast = useCallback((type: ToastNotification['type'], message: string) => {
    setToast({ type, message, visible: true });
    
    const timer = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // ✅ 공식 문서 기반 정확한 Calendar 옵션 (3주 뷰 포함)
  const calendarOptions = useMemo(() => ({
    // 기본 뷰 설정
    defaultView: 'month',
    isReadOnly: false,
    usageStatistics: false,
    useFormPopup: true,
    useDetailPopup: true,
    
    // 타임존 설정 (공식 문서 기준)
    timezone: {
      zones: [
        {
          timezoneName: 'Asia/Seoul',
          displayLabel: 'Seoul',
          tooltip: 'Korea Standard Time',
        },
      ],
    },
    
    // ✅ 월 뷰 설정 - 순수한 한 달만 표시
    month: {
      dayNames: ['일', '월', '화', '수', '목', '금', '토'],
      startDayOfWeek: 0,
      // ✅ 실제 한 달의 주 수만 표시 (4-6주 가변)
      isAlways6Weeks: false,  // 6주 고정 해제
      narrowWeekend: false,
      visibleEventCount: 4,   // ✅ 한 셀에 4개 이벤트까지 표시
    },
    
    // 주 뷰 설정 (공식 문서 기준)
    week: {
      dayNames: ['일', '월', '화', '수', '목', '금', '토'],
      startDayOfWeek: 0,
      narrowWeekend: false,
      showNowIndicator: true,
      showTimezoneCollapseButton: false,
    },
    
    // 캘린더 목록 (공식 예제 기준)
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
    
    // 템플릿 설정 (공식 문서 기준)
    template: {
      time(event: any) {
        const { start, end, title } = event;
        return `<div class="time-event">${title}</div>`;
      },
      allday(event: any) {
        return `<div class="allday-event">${event.title}</div>`;
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

  // ✅ 현재 뷰 날짜 관리 (공식 API에서 제공하지 않으므로 직접 관리)
  const getCurrentDate = useCallback(() => {
    return currentViewDate.current;
  }, []);

  // ✅ 안전한 이벤트 로드 (성능 최적화)
  const loadEvents = useCallback(async () => {
    const calendar = calendarRef.current;
    if (!calendar || loading || !isInitialized.current) return;

    setLoading(true);
    
    try {
      const baseDate = getCurrentDate();
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const cacheKey = getCacheKey(year, month);

      // 캐시 확인
      if (eventsCache.current.has(cacheKey)) {
        const cachedEvents = eventsCache.current.get(cacheKey)!;
        try {
          // 공식 API: clear() 후 createEvents() 사용
          calendar.clear();
          if (cachedEvents.length > 0) {
            calendar.createEvents(cachedEvents);
          }
          showToast('success', `${cachedEvents.length}개의 일정을 불러왔습니다.`);
          return;
        } catch (error) {
          console.warn('캐시된 이벤트 로드 실패:', error);
          eventsCache.current.delete(cacheKey);
        }
      }

      // 더 넓은 범위로 데이터 로드 (이전/다음 달 포함)
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month + 2, 0, 23, 59, 59, 999);
      
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
      
      eventsCache.current.set(cacheKey, events);
      
      // 공식 API 사용
      try {
        calendar.clear();
        if (events.length > 0) {
          calendar.createEvents(events);
        }
      } catch (createError) {
        console.warn('이벤트 생성 실패:', createError);
        // 대안: 개별 생성 시도
        events.forEach((event, index) => {
          try {
            calendar.createEvents([event]);
          } catch (individualError) {
            console.warn(`이벤트 ${index + 1} 생성 실패:`, individualError);
          }
        });
      }
      
      showToast('success', `${events.length}개의 일정을 불러왔습니다.`);
    } catch (err) {
      console.error('일정 불러오기 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정을 불러오는데 실패했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [loading, getCacheKey, showToast, parseDate, getCurrentDate]);

  // ✅ 캐시 무효화
  const invalidateCache = useCallback((date?: Date) => {
    if (date) {
      const cacheKey = getCacheKey(date.getFullYear(), date.getMonth());
      eventsCache.current.delete(cacheKey);
    } else {
      eventsCache.current.clear();
    }
  }, [getCacheKey]);

  // ✅ 공식 API 기반 이벤트 핸들러들
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
        start: start instanceof Date ? start : new Date(start),
        end: end instanceof Date ? end : new Date(end),
      });

      const newEvent: CalendarEvent = {
        ...res.data,
        start: parseDate(res.data.start),
        end: parseDate(res.data.end),
      };

      // 공식 API 사용 - createEvents 메서드는 배열을 받음
      try {
        calendarRef.current?.createEvents([newEvent]);
      } catch (createError) {
        console.warn('새 이벤트 UI 생성 실패:', createError);
        // ✅ 대안: 전체 다시 로드
        loadEvents();
      }
      
      invalidateCache(newEvent.start);
      showToast('success', '일정이 생성되었습니다.');
    } catch (err) {
      console.error('일정 저장 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 저장에 실패했습니다: ${errorMessage}`);
    }
  }, [invalidateCache, showToast, parseDate, loadEvents]);

  const handleUpdateEvent = useCallback(async ({ event, changes }: any) => {
    try {
      const payload = {
        ...event,
        ...changes,
        start: changes.start instanceof Date ? changes.start : 
               (event.start instanceof Date ? event.start : new Date(event.start)),
        end: changes.end instanceof Date ? changes.end : 
             (event.end instanceof Date ? event.end : new Date(event.end)),
        location: changes.location ?? event.location ?? '',
        title: changes.title?.trim() || event.title || '(제목 없음)',
        body: changes.body?.trim() ?? event.body ?? '',
        isAllday: true,
        category: 'allday',
      };

      await updateEvent(event.id, payload);
      
      // 공식 API 사용 - updateEvent는 세 개의 매개변수를 받음
      try {
        calendarRef.current?.updateEvent(event.id, event.calendarId, changes);
      } catch (updateError) {
        console.warn('이벤트 UI 업데이트 실패:', updateError);
        // ✅ 대안: 전체 다시 로드
        loadEvents();
      }
      
      invalidateCache(payload.start);
      showToast('success', '일정이 수정되었습니다.');
    } catch (err) {
      console.error('일정 수정 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 수정에 실패했습니다: ${errorMessage}`);
    }
  }, [invalidateCache, showToast, loadEvents]);

  const handleDeleteEvent = useCallback(async ({ id, calendarId }: any) => {
    const confirmDelete = window.confirm('정말 이 일정을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
      await deleteEvent(id);
      
      // 공식 API 사용 - deleteEvent는 두 개의 매개변수를 받음
      try {
        calendarRef.current?.deleteEvent(id, calendarId);
      } catch (deleteError) {
        console.warn('이벤트 UI 삭제 실패:', deleteError);
        // ✅ 대안: 전체 다시 로드
        loadEvents();
      }
      
      eventsCache.current.clear();
      showToast('success', '일정이 삭제되었습니다.');
    } catch (err) {
      console.error('일정 삭제 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('error', `일정 삭제에 실패했습니다: ${errorMessage}`);
    }
  }, [showToast, loadEvents]);

  // ✅ 날짜 표시 업데이트 (한 달 뷰)
  const updateCurrentDateDisplay = useCallback(() => {
    try {
      const currentDate = getCurrentDate();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      setCurrentDate(`${year}년 ${month}월`);
    } catch (error) {
      console.error('날짜 표시 업데이트 오류:', error);
      setCurrentDate(new Date().toLocaleDateString('ko-KR'));
    }
  }, [getCurrentDate]);

  // ✅ 공식 문서 기반 캘린더 초기화
  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return;

    try {
      // 공식 문서: DOM 요소를 직접 전달
      const calendar = new Calendar(containerRef.current, calendarOptions);

      // 공식 문서 기반 이벤트 리스너 등록
      calendar.on('beforeCreateEvent', handleCreateEvent);
      calendar.on('beforeUpdateEvent', handleUpdateEvent);
      calendar.on('beforeDeleteEvent', handleDeleteEvent);

      calendarRef.current = calendar;
      isInitialized.current = true;
      
      // 초기화 완료 후 데이터 로드
      setTimeout(() => {
        updateCurrentDateDisplay();
        loadEvents();
      }, 100);

      return () => {
        try {
          if (calendarRef.current) {
            // 공식 API: 이벤트 리스너 해제 후 인스턴스 파괴
            calendarRef.current.off('beforeCreateEvent');
            calendarRef.current.off('beforeUpdateEvent');
            calendarRef.current.off('beforeDeleteEvent');
            calendarRef.current.destroy();
            calendarRef.current = null;
          }
          
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = null;
          }
          
          isInitialized.current = false;
        } catch (cleanupError) {
          console.error('Cleanup 오류:', cleanupError);
        }
      };
    } catch (error) {
      console.error('캘린더 초기화 오류:', error);
      showToast('error', '캘린더 초기화에 실패했습니다.');
    }
  }, []); // 의존성 배열 비움 - 한 번만 실행

  // ✅ 공식 API 기반 월 이동 (상태 동기화 개선)
  const moveCalendar = useCallback((type: 'prev' | 'next' | 'today') => {
    const calendar = calendarRef.current;
    if (!calendar || loading || !isInitialized.current) return;

    try {
      // 공식 API 메서드 사용
      if (type === 'prev') {
        calendar.prev();
        const newDate = new Date(currentViewDate.current);
        newDate.setMonth(newDate.getMonth() - 1);
        currentViewDate.current = newDate;
      } else if (type === 'next') {
        calendar.next();
        const newDate = new Date(currentViewDate.current);
        newDate.setMonth(newDate.getMonth() + 1);
        currentViewDate.current = newDate;
      } else {
        calendar.today();
        currentViewDate.current = new Date();
      }

      // UI 업데이트를 즉시 실행
      updateCurrentDateDisplay();

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        loadEvents();
      }, 150); // 응답성 개선을 위해 200ms → 150ms
    } catch (error) {
      console.error('캘린더 이동 실패:', error);
      showToast('error', '캘린더 이동에 실패했습니다.');
    }
  }, [loading, updateCurrentDateDisplay, loadEvents, showToast]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 토스트 알림 */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform ${
          toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2 text-sm">
            <span>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 헤더 - 크기 축소 */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => moveCalendar('today')}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => moveCalendar('prev')}
                disabled={loading}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => moveCalendar('next')}
                disabled={loading}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900">
              {currentDate}
            </h1>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">로딩중...</span>
            </div>
          )}
        </div>
      </div>

      {/* 캘린더 영역 */}
      <div className="flex-1 p-6">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200">
          <div 
            ref={containerRef} 
            className="h-full w-full"
            style={{ 
              height: 'calc(100vh - 120px)',  // ✅ 헤더 높이 줄어든 만큼 조정
              minHeight: '800px'              // ✅ 4개 이벤트를 위한 충분한 높이
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default MonthlyCalendar;