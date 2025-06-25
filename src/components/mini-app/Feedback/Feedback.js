'use client';
import { useEffect, useState } from 'react';
import styles from './Feedback.module.css';

export default function Feedback({ tgId, onFeedbackReady }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState('');
  const [isFeedbackReady, setIsFeedbackReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/mini-app/parsers/get_feedback', {
          headers: { 'X-Telegram-ID': tgId },
        });
        if (!res.ok) throw new Error('Ошибка загрузки');
        const data = await res.json();
        if (!data.success) throw new Error('Ошибка в данных');

        const sortedFeedback = (data.feedback || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setFeedbacks(sortedFeedback);
        setIsFeedbackReady(true);
      } catch (err) {
        setError('Ошибка при загрузке. Попробуйте позже.');
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchData();
  }, [tgId]);

  useEffect(() => {
    if (isFeedbackReady && onFeedbackReady) {
      onFeedbackReady();
    }
  }, [isFeedbackReady, onFeedbackReady]);

  return (
    <div className={styles.container}>
      <header className={styles.feedbackHeader}>
        <div className={styles.feedback_h}>
          <h1 className={styles.feedbackH1}>Отзывы</h1>
        </div>
      </header>

      <div className={styles.feedback}>
        {error && <div>{error}</div>}

        {feedbacks.length > 0 && (
          <div className={styles.feedbackItems}>
            {feedbacks.map((item, index) => (
              <div
                key={`${item.date}-${item.teacher}-${index}`}
                className={styles.feedbackItem}
              >
                <h2 className={styles.feedbackH2}>
                  {item.teacher} ({item.spec})
                </h2>
                <p className={styles.feedbackDate}>
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p className={styles.feedbackMessage}>{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}