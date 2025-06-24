import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styles from './Grades.module.css';

export default function Grades({ tgId }) {
  const perPage = 24;

  const [allGrades, setAllGrades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [examGrades, setExamGrades] = useState([]);

  const getColorExamMark = (mark) => {
    switch (mark) {
      case 2: return '#d9534f';
      case 3: return '#f0ad4e';
      case 4: return '#5cb85c';
      case 5: return '#4cae4c';
      default: return '#6c757d';
    }
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        setError(null);

        const [gradesResp, examResp] = await Promise.all([
          fetch('/api/mini-app/parsers/get_grades', { headers: { 'X-Telegram-ID': tgId } }),
          fetch('/api/mini-app/parsers/get_exam_grades', { headers: { 'X-Telegram-ID': tgId } })
        ]);

        if (!gradesResp.ok || !examResp.ok) throw new Error('Ошибка при получении данных');

        const gradesData = await gradesResp.json();
        const examData = await examResp.json();

        if (gradesData.success && Array.isArray(gradesData.grades)) {
          setAllGrades(gradesData.grades);
        }

        if (examData.success && Array.isArray(examData.examgradesinfo)) {
          const sorted = [...examData.examgradesinfo].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
          });
          setExamGrades(sorted);
        }
      } catch (e) {
        console.error(e);
        setError('Ошибка при загрузке оценок. Попробуйте позже.');
        setTimeout(() => setError(null), 3000);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);


  const filteredGrades = useMemo(() => {
    return currentFilter === 'all'
      ? allGrades
      : allGrades.filter(g => g.spec_name === currentFilter);
  }, [allGrades, currentFilter]);

  const totalPages = Math.ceil(filteredGrades.length / perPage);

  const gradesToDisplay = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredGrades.slice(start, start + perPage);
  }, [filteredGrades, currentPage]);

  const uniqueSubjects = useMemo(() => {
    const set = Array.from(new Set(allGrades.map(g => g.spec_name)));
    return set.sort((a, b) => {
      const ca = a.replace(/\s*\([^)]*\)/g, '').trim();
      const cb = b.replace(/\s*\([^)]*\)/g, '').trim();
      if (ca < cb) return -1;
      if (ca > cb) return 1;
      return a.localeCompare(b);
    });
  }, [allGrades]);

  const generateCircle = useCallback((mark, type) => {
    if (mark === null || mark === undefined) return null;
    const colors = {
      homework: '#D91842',
      'lab-work': '#A388E2',
      'class-work': '#188194',
      'test-work': '#69E77B',
    };
    return (
      <div
        key={type}
        className={`${styles.circle} ${styles[type]}`}
        style={{ backgroundColor: colors[type] }}
      >
        {mark}
      </div>
    );
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.navButton} onClick={() => currentPage > 1 && setCurrentPage(prev => prev - 1)}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        </button>
        <h1 className={styles.gradeH1}>Оценки</h1>
        <button className={styles.navButton} onClick={() => currentPage < totalPages && setCurrentPage(prev => prev + 1)}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        </button>
      </header>

      <select
        value={currentFilter}
        onChange={e => {
          setCurrentFilter(e.target.value);
          setCurrentPage(1);
        }}
        className={styles.subjectFilter}
      >
        <option value="all">Все предметы</option>
        {uniqueSubjects.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>

      {loading && (
        <div className={styles.statusMessage}>{['Загрузка оценок...', 'Ожидайте...'][Math.floor(Math.random() * 2)]}</div>
      )}
      {error && <div className={styles.statusMessage}>{error}</div>}

      <div className={styles.grade}>
        {gradesToDisplay.map((grade, idx) => {
          const revIndex = filteredGrades.length - 1 - ((currentPage - 1) * perPage + idx);
          const date = new Date(grade.date_visit).toLocaleDateString('ru-RU');
          const statusClasses = grade.status_was === 0 ? styles.pass
            : grade.status_was === 2 ? styles.late
              : '';
          return (
            <div
              key={idx}
              className={`${styles.gradeItem} ${statusClasses}`}
              onClick={() => setModalData(grade)}
            >
              <span className={`${styles.date} ${grade.status_was !== 1 ? styles.whiteDate : ''}`}>{date}</span>
              <span className={styles.pairNumber}>{revIndex + 1}</span>
              <div className={styles.gradeCircles}>
                {generateCircle(grade.home_work_mark, 'homework')}
                {generateCircle(grade.lab_work_mark, 'lab-work')}
                {generateCircle(grade.class_work_mark, 'class-work')}
                {generateCircle(grade.control_work_mark, 'test-work')}
              </div>
            </div>
          );
        })}
      </div>

      {examGrades.length > 0 && (
        <div className={styles.examSection}>
          <header className={styles.examHeader}>
            <h1 className={styles.examTextHeader}>Экзамены</h1>
          </header>
          <div className={styles.examTable}>
            <div className={styles.examRow + ' ' + styles.examHead}>
              <span>Предмет</span>
              <span>Оценка</span>
              <span>Преподаватель</span>
              <span>Дата</span>
            </div>
            {examGrades.map((exam, idx) => (
              <div key={idx} className={styles.examRow}>
                <span>{exam.spec}</span>
                <span
                  className={styles.markCircle}
                  style={{ backgroundColor: getColorExamMark(exam.mark > 0 ? exam.mark : 0) }}
                >
                  {exam.mark > 0 ? exam.mark : '—'}
                </span>
                <span>{exam.teacher || '—'}</span>
                <span>{exam.date ? new Date(exam.date).toLocaleDateString('ru-RU') : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalData && (
        <div className={styles.modal} onClick={() => setModalData(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <span className={styles.close} onClick={() => setModalData(null)}>×</span>
            <h2 className={styles.gradeH2}>{modalData.spec_name}</h2>
            <hr className={styles.divider} />
            <p className={styles.gradeP}><strong>Пара</strong></p>
            <p className={styles.gradeP}>№{modalData.lesson_number}</p>
            <hr className={styles.divider} />
            <p className={styles.gradeP}><strong>Преподаватель</strong></p>
            <p className={styles.gradeP}>{modalData.teacher_name}</p>
            <hr className={styles.divider} />
            <p className={styles.gradeP}><strong>Тема</strong></p>
            <p className={styles.gradeP}>{modalData.lesson_theme}</p>
          </div>
        </div>
      )}
    </div>
  );
}