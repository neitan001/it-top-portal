'use client';
import { useEffect, useState } from 'react';
import styles from './Feedback.module.css';

export default function Feedback({ tgId }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/mini-app/parsers/get_feedback', {
                    headers: {
                        'X-Telegram-ID': tgId,
                    },
                });
                if (!res.ok) throw new Error('Ошибка загрузки');
                setFeedbacks(await res.json());
            } catch (err) {
                setError('Ошибка при загрузке. Попробуйте позже.');
                setTimeout(() => setError(''), 3000);
            }
        };
        fetchData();
    }, []);

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
                        {feedbacks.map((item) => (
                            <div key={item.id} className={styles.feedbackItem}>
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