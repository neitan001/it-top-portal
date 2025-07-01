import { useEffect, useState, useRef } from 'react';
import styles from './Calendar.module.css';
import { coreAlert } from '@/components/CoreAlert';

const Calendar = ({ tgId }) => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const weekdays = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentSelectedDay, setCurrentSelectedDay] = useState(new Date().getDate());
    const [isFirstRender, setIsFirstRender] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);
    const touchStartX = useRef(0);
    const dayTouchStartX = useRef(0);
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!loading && hasFetched && !error && schedule.length === 0) {
            coreAlert({
                type: "warning",
                title: "Нет расписания",
                subtitle: "На выбранный день данных нет.",
                timer: 650,
                successButton: {
                    show: false,
                },
                cancelButton: {
                    show: false,
                },
            });
        }
    }, [loading, hasFetched, error, schedule]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAcademicTime = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const startAcademicDay = 8 * 60 + 30;
        const endAcademicDay = 15 * 60 + 10;

        return currentTime >= startAcademicDay && currentTime <= endAcademicDay;
    };

    const isPairActive = (startTime, endTime, date) => {
        const now = new Date();

        if (
            now.getFullYear() !== date.getFullYear() ||
            now.getMonth() !== date.getMonth() ||
            now.getDate() !== date.getDate()
        ) {
            return false;
        }

        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);

        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;

        return currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes;
    };

    const fetchSchedule = async (date) => {
        const formattedDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/mini-app/parsers/get_schedule?date=${formattedDate}`, {
                headers: {
                    'X-Telegram-ID': tgId,
                },
            });
            if (!response.ok) return; //throw new Error('Ошибка при получении расписания'); - это тут было но вызыво падение (переделаю потом на красивое сообщение в UI)
            const data = await response.json();

            if (Array.isArray(data.schedule) && data.schedule.length > 0) {
                const now = new Date();
                const isToday = (
                    now.getFullYear() === date.getFullYear() &&
                    now.getMonth() === date.getMonth() &&
                    now.getDate() === date.getDate()
                );

                let activeIndex = data.schedule.findIndex(item => isPairActive(item.started_at, item.finished_at, date));

                if (!isToday) {
                    activeIndex = 0;
                }
                else if (activeIndex === -1 && isAcademicTime()) {
                    activeIndex = -1;
                }
                else if (activeIndex === -1) {
                    activeIndex = 0;
                }

                const formattedSchedule = data.schedule.map((item, index) => ({
                    ...item,
                    isActive: index === activeIndex && activeIndex !== -1
                }));

                setSchedule(formattedSchedule);
            } else {
                setSchedule([]);
            }
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Ошибка загрузки расписания');
        } finally {
            setLoading(false);
            setHasFetched(true);
            setIsVisible(true);
        }
    };

    const renderCalendarDays = () => {
        const days = [];
        const rawFirstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const firstDayIndex = (rawFirstDayIndex === 0 ? 6 : rawFirstDayIndex - 1);

        const lastDayPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        const lastDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

        for (let i = firstDayIndex; i > 0; i--) {
            days.push(
                <button key={`prev-${i}`} className={styles.nonactive}>
                    {lastDayPrevMonth - i + 1}
                </button>
            );
        }

        for (let i = 1; i <= lastDayCurrentMonth; i++) {
            const isActive = i === currentSelectedDay &&
                currentDate.getMonth() === selectedDate.getMonth() &&
                currentDate.getFullYear() === selectedDate.getFullYear();

            const isToday = (
                i === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
            );

            days.push(
                <button
                    key={`current-${i}`}
                    className={`${isToday ? styles.today : ''} ${isActive ? styles.active : ''}`}
                    onClick={() => handleDayClick(i)}
                >
                    {i}
                </button>
            );
        }

        const totalDays = firstDayIndex + lastDayCurrentMonth;
        const remainingDays = totalDays <= 35 ? 35 - totalDays : 42 - totalDays;

        for (let i = 1; i <= remainingDays; i++) {
            days.push(
                <button key={`next-${i}`} className={styles.nonactive}>
                    {i}
                </button>
            );
        }

        return days;
    };

    const handleDayClick = (day) => {
        setCurrentSelectedDay(day);
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
        fetchSchedule(newDate);
    };

    const prevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            return newDate;
        });
        setCurrentSelectedDay(1);
    };

    const nextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            return newDate;
        });
        setCurrentSelectedDay(1);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextMonth() : prevMonth();
        }
    };

    const handleDayTouchStart = (e) => {
        if (!e.target.classList.contains(styles.nonactive)) {
            dayTouchStartX.current = e.touches[0].clientX;
        }
    };

    const handleDayTouchEnd = (e) => {
        if (dayTouchStartX.current === 0 || e.target.classList.contains(styles.nonactive)) return;

        const diff = dayTouchStartX.current - e.changedTouches[0].clientX;
        dayTouchStartX.current = 0;

        if (Math.abs(diff) > 50) {
            const daysInMonth = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                0
            ).getDate();

            let newDay;

            if (diff > 0) {
                newDay = Math.min(currentSelectedDay + 1, daysInMonth);
            } else {
                newDay = Math.max(currentSelectedDay - 1, 1);
            }

            setCurrentSelectedDay(newDay);

            const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), newDay);
            setSelectedDate(newSelectedDate);
            fetchSchedule(newSelectedDate);
        }
    };

    useEffect(() => {
        const today = new Date();
        setSelectedDate(today);
        setCurrentSelectedDay(today.getDate());
        fetchSchedule(today);
    }, []);

    return (
        <>
            <header className={styles.calendarHeader}>
                <button className={styles.navButton} onClick={prevMonth}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" strokeWidth="2" />
                    </svg>
                </button>
                <div
                    className={styles.monthYear}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <h1>{months[currentDate.getMonth()]}</h1>
                    <span>{currentDate.getFullYear()}</span>
                </div>
                <button className={styles.navButton} onClick={nextMonth}>
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path d="M9 6l6 6-6 6" stroke="currentColor" fill="none" strokeWidth="2" />
                    </svg>
                </button>
            </header>

            <div className={styles.calendar}>
                <div className={styles.weekdays}>
                    {weekdays.map((day, index) => (
                        <div key={index}>{day}</div>
                    ))}
                </div>
                <div
                    className={styles.days}
                    onTouchStart={handleDayTouchStart}
                    onTouchEnd={handleDayTouchEnd}
                >
                    {renderCalendarDays()}
                </div>
            </div>

            <div className={`${styles.schedule} ${!loading && isVisible ? styles.visible : ''}`}>
                {loading && (
                    <div className={styles.statusMessage}>Загрузка...</div>
                )}

                {!loading && error && (
                    <div className={styles.errorMessage}>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && schedule.length > 0 && (
                    <div className={styles.scheduleItems}>
                        {schedule.map((item, index) => (
                            <div
                                key={index}
                                className={`
                                ${styles.scheduleItem} 
                                ${mounted ? styles.animate : ''} 
                                ${item.isActive ? styles.highlight : ''}
                            `}
                            >
                                <div className={styles.scheduleHeader}>
                                    <span className={styles.dot}></span>
                                    <span className={`${styles.time} ${item.isActive ? styles.highlightTime : ''}`}>
                                        {item.started_at} - {item.finished_at}
                                    </span>
                                    <span className={styles.location}>{item.room_name}</span>
                                </div>
                                <h2 className={styles.scheduleH2}>{item.subject_name}</h2>
                                <p className={styles.scheduleP}>{item.teacher_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Calendar;