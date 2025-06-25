"use client";
import { useState, useEffect } from 'react';
import styles from './EvaluationModal.module.css';

const EvaluationModal = ({ tgId }) => {
    const apiLessonsUrl = "/api/mini-app/parsers/get_evaluate_lesson_list";
    const feedbackUrl = "/api/mini-app/parsers/send_evaluate_lesson";

    const teacherTagMapping = [
        { id: 8, text: "Всё супер!" },
        { id: 9, text: "Не отвечал на вопросы" },
        { id: 10, text: "Понятно объясняет" },
        { id: 12, text: "Было шумно!" },
        { id: 11, text: "Классный преподаватель!" },
        { id: 13, text: "Тема не была объяснена!" },
        { id: 14, text: "Преподаватель кричит" }
    ];

    const lessonTagMapping = [
        { id: 15, text: "Всё супер!" },
        { id: 16, text: "Сложно" },
        { id: 17, text: "Скучно" },
        { id: 18, text: "Не успели пройти тему" },
        { id: 19, text: "Мало практики" },
        { id: 20, text: "Мало теории" },
        { id: 21, text: "Зачем мы это учим?" }
    ];

    const [lessons, setLessons] = useState([]);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentStep, setCurrentStep] = useState('teacher');
    const [teacherRating, setTeacherRating] = useState(0);
    const [teacherTags, setTeacherTags] = useState(new Set());
    const [teacherComment, setTeacherComment] = useState('');
    const [lessonRating, setLessonRating] = useState(0);
    const [lessonTags, setLessonTags] = useState(new Set());
    const [lessonComment, setLessonComment] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchLessonsData();
    }, []);

    const fetchLessonsData = async () => {
        try {
            const response = await fetch(apiLessonsUrl, { headers: { 'X-Telegram-ID': tgId } });
            if (!response.ok) throw new Error("Ошибка получения данных");
            const { success, evaluateLesson } = await response.json();
            if (success && evaluateLesson) {
                setLessons(evaluateLesson);
                if (evaluateLesson.length > 0) {
                    setIsModalOpen(true);
                }
            }
        } catch (error) {
            console.error("Ошибка:", error);
        }
    };

    const sendFeedback = async (payload) => {
        try {
            const response = await fetch(feedbackUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Telegram-ID": tgId },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Ошибка отправки данных");
            return await response.json();
        } catch (error) {
            console.error("Ошибка при отправке данных:", error);
        }
    };

    const handleStarClick = (value) => {
        if (currentStep === 'teacher') {
            setTeacherRating(value);
        } else {
            setLessonRating(value);
        }
    };

    const handleTagClick = (tagId) => {
        if (currentStep === 'teacher') {
            setTeacherTags(prev => {
                const newTags = new Set(prev);
                if (newTags.has(tagId)) {
                    newTags.delete(tagId);
                } else {
                    newTags.add(tagId);
                }
                return new Set(newTags);
            });
        } else {
            setLessonTags(prev => {
                const newTags = new Set(prev);
                if (newTags.has(tagId)) {
                    newTags.delete(tagId);
                } else {
                    newTags.add(tagId);
                }
                return new Set(newTags);
            });
        }
    };


    const handleNext = async () => {
        setErrorMessage("");

        const currentRating = currentStep === 'teacher' ? teacherRating : lessonRating;
        const currentComment = currentStep === 'teacher' ? teacherComment : lessonComment;

        if (currentRating === 0) {
            setErrorMessage("Пожалуйста, выберите оценку.");
            return;
        }

        if (currentComment.length > 0 && (currentComment.length < 20 || currentComment.length > 500)) {
            setErrorMessage("Комментарий должен быть от 20 до 500 символов.");
            return;
        }

        if (currentStep === 'teacher') {
            setCurrentStep('lesson');
        } else {
            const lesson = lessons[currentLessonIndex];
            const payload = {
                key: lesson.key,
                mark_lesson: lessonRating,
                mark_teach: teacherRating,
                tags_lesson: Array.from(lessonTags),
                tags_teach: Array.from(teacherTags),
                comment_lesson: lessonComment,
                comment_teach: teacherComment
            };

            const feedbackResponse = await sendFeedback(payload);

            if (currentLessonIndex + 1 < lessons.length) {
                setCurrentLessonIndex(currentLessonIndex + 1);
                setCurrentStep('teacher');
                setTeacherRating(0);
                setTeacherTags(new Set());
                setTeacherComment('');
                setLessonRating(0);
                setLessonTags(new Set());
                setLessonComment('');
            } else {
                setIsModalOpen(false);
            }
        }
    };

    const handleCommentChange = (e) => {
        const value = e.target.value;
        if (currentStep === 'teacher') {
            setTeacherComment(value);
        } else {
            setLessonComment(value);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (!isModalOpen || lessons.length === 0) return null;

    const currentLesson = lessons[currentLessonIndex];
    const dateObj = new Date(currentLesson.date_visit);
    const formattedDate = dateObj.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const currentTagMapping = currentStep === 'teacher' ? teacherTagMapping : lessonTagMapping;
    const currentRating = currentStep === 'teacher' ? teacherRating : lessonRating;

    return (
        <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <span className={styles.closeButton} onClick={closeModal}>×</span>
                <h2 className={styles.headText}>Оцените занятие</h2>
                <p className={styles.numberOfLessons}>{currentLessonIndex + 1} из {lessons.length}</p>
                <p className={styles.teacher}>{currentLesson.fio_teach}</p>
                <p className={styles.subject}><strong>{currentLesson.spec_name}</strong></p>
                <p className={styles.date}>{formattedDate}</p>

                <h3 className={styles.evaluationHeader}>
                    {currentStep === 'teacher' ? "Оцените работу преподавателя" : "Оцените качество урока"}
                </h3>

                <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <span
                            key={value}
                            className={`${styles.star} ${value <= currentRating ? styles.active : ''}`}
                            onClick={() => handleStarClick(value)}
                        >
                            ★
                        </span>
                    ))}
                </div>

                <div className={styles.tagButtons}>
                    {currentTagMapping.map((tag) => {
                        const isActive = currentStep === 'teacher'
                            ? teacherTags.has(tag.id)
                            : lessonTags.has(tag.id);
                        return (
                            <button
                                key={tag.id}
                                className={`${styles.tagButton} ${isActive ? styles.active : ''}`}
                                onClick={() => handleTagClick(tag.id)}
                            >
                                {tag.text}
                            </button>
                        );
                    })}
                </div>

                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        id="comment"
                        placeholder="Комментарий"
                        value={currentStep === 'teacher' ? teacherComment : lessonComment}
                        onChange={handleCommentChange}
                    />
                    <label htmlFor="comment">Введите ваш комментарий...</label>
                </div>

                {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

                <button className={styles.nextButton} onClick={handleNext}>
                    {currentStep === 'teacher' ? "Далее" : "Отправить"}
                </button>
            </div>
        </div>
    );
};

export default EvaluationModal;