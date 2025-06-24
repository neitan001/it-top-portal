export default function handler(req, res) {

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Метод не разрешен' });
    }

    const currentDate = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const mockLessons = [
        {
            key: "lesson_001",
            fio_teach: "Иванова Анна Петровна",
            spec_name: "Алгебра",
            spec_id: "math_101",
            date_visit: new Date(currentDate.getTime() - oneDay * 2).toISOString(),
            group_name: "10-А класс",
            duration: 45,
            topic: "Решение квадратных уравнений",
        },
        {
            key: "lesson_002",
            fio_teach: "Сидоров Дмитрий Иванович",
            spec_name: "Физика",
            spec_id: "phys_201",
            date_visit: new Date(currentDate.getTime() - oneDay).toISOString(),
            group_name: "11-Б класс",
            duration: 90,
            topic: "Законы термодинамики",
        },
        {
            key: "lesson_003",
            fio_teach: "Петрова Елена Владимировна",
            spec_name: "Русская литература",
            spec_id: "lit_301",
            date_visit: currentDate.toISOString(),
            group_name: "9-В класс",
            duration: 45,
            topic: "Анализ 'Горе от ума'",
        },
    ];

    // Add authentication check if needed
    // const session = await getSession({ req });
    // if (!session) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    // In a real implementation, you would fetch from your database:
    // try {
    //   const lessons = await prisma.lessons.findMany({
    //     where: {
    //       student_id: session.user.id,
    //       evaluation_completed: false,
    //       date_visit: { lte: new Date() }
    //     },
    //     orderBy: { date_visit: 'desc' }
    //   });
    //   return res.status(200).json(lessons);
    // } catch (error) {
    //   return res.status(500).json({ message: 'Database error', error });
    // }

    res.status(200).json(mockLessons);
}