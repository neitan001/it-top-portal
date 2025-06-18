// pages/api/get_schedule.js
export default function handler(req, res) {
  const { date } = req.query;

  // Фиксированные данные для тестирования
  const testSchedule = [
    {
      "date": "2025-06-02",
      "lesson": 1,
      "started_at": "08:30",
      "finished_at": "10:00",
      "teacher_name": "Фролова Ольга Дмитриевна",
      "subject_name": "Физика (РПО)",
      "room_name": "Конференц-зал"
    },
    {
      "date": "2025-06-02",
      "lesson": 2,
      "started_at": "10:10",
      "finished_at": "11:40",
      "teacher_name": "Сивер Иван Владимирович",
      "subject_name": "Конфигурирование Windows 10",
      "room_name": "2 [RED]"
    },
    {
      "date": "2025-06-02",
      "lesson": 3,
      "started_at": "12:00",
      "finished_at": "13:30",
      "teacher_name": "Коцуро Любовь Гарриевна",
      "subject_name": "Русский язык (РПО)",
      "room_name": "3 [BLUE]"
    },
    {
      "date": "2025-06-02",
      "lesson": 4,
      "started_at": "13:40",
      "finished_at": "15:10",
      "teacher_name": "Коцуро Любовь Гарриевна",
      "subject_name": "Русский язык (РПО)",
      "room_name": "3 [BLUE]"
    }
  ];

  // Меняем дату на запрошенную
  const responseData = testSchedule.map(item => ({
    ...item,
    date: date || item.date
  }));

  res.status(200).json({ 
    success: true,
    schedule: responseData 
  });
}