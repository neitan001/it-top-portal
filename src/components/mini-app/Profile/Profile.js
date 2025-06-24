import { useEffect, useState } from 'react';
import Image from 'next/image'
import { versions } from '@/lib/versions';
import styles from './Profile.module.css';

export default function Profile({ tgId }) {
  const [profile, setProfile] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [currentRatingType, setCurrentRatingType] = useState('group');
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [groupPlace, setGroupPlace] = useState(null);
  const [streamPlace, setStreamPlace] = useState(null);


  useEffect(() => {
    if (tgId) fetchProfileData();
  }, [tgId]);

  const fetchJSON = async (url, errorMsg) => {
    const res = await fetch(url, {
      headers: {
        'X-Telegram-ID': tgId,
      },
    });

    if (!res.ok) throw new Error(errorMsg);

    return res.json();
  };

  const fetchProfileData = async () => {
    const loadingMessages = ['Загрузка профиля...', 'Ожидайте...'];
    setStatusMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    setShowStatus(true);

    try {
      const [profileRes, performanceRes, attendanceRes] = await Promise.all([
        fetchJSON('/api/mini-app/parsers/get_profile_info', 'Ошибка при получении данных с сервера'),
        fetchJSON('/api/mini-app/parsers/get_profile_performance_metric_grade', 'Ошибка при получении данных о среднем балле'),
        fetchJSON('/api/mini-app/parsers/get_profile_performance_metric_attendance', 'Ошибка при получении данных о посещаемости')
      ]);

      setProfile(profileRes.profileinfo);
      setPerformanceData(performanceRes.metricgrade);
      setAttendanceData(attendanceRes.metricattendance);
      setShowStatus(false);

      loadRating('/api/mini-app/parsers/get_rating_group_info');

      const fullName = profileRes.profileinfo?.full_name;
      if (fullName) {
        const places = await updatePlaces(fullName);
        setGroupPlace(places.groupPlace);
        setStreamPlace(places.streamPlace);
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error);
      setStatusMessage('Ошибка при загрузке профиля. Попробуйте позже.');
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  const getPlaceFromRating = async (apiEndpoint, fullName) => {
    try {
      const response = await fetchJSON(apiEndpoint, 'Ошибка при получении данных рейтинга');

      const ratingKey = apiEndpoint.includes('group')
        ? 'ratinggroupinfo'
        : 'ratingstreaminfo';

      const ratingData = response[ratingKey];
      if (!Array.isArray(ratingData)) return null;

      const user = ratingData.find(item => item.full_name === fullName);
      return user ? user.position : null;
    } catch (error) {
      console.error(`Ошибка при загрузке данных из ${apiEndpoint}:`, error);
      return null;
    }
  };

  const updatePlaces = async (fullName) => {
    try {
      const [groupPlace, streamPlace] = await Promise.all([
        getPlaceFromRating('/api/mini-app/parsers/get_rating_group_info', fullName),
        getPlaceFromRating('/api/mini-app/parsers/get_rating_stream_info', fullName)
      ]);
      return { groupPlace, streamPlace };
    } catch (error) {
      console.error('Ошибка при обновлении мест:', error);
      return { groupPlace: null, streamPlace: null };
    }
  };

  const loadRating = async (apiEndpoint) => {
    try {
      const data = await fetchJSON(apiEndpoint, 'Ошибка при получении данных рейтинга');

      const ratingKey = apiEndpoint.includes('group')
        ? 'ratinggroupinfo'
        : 'ratingstreaminfo';

      setRatingData(data[ratingKey] || []);
      setCurrentRatingType(apiEndpoint.includes('group') ? 'group' : 'stream');
    } catch (error) {
      console.error('Ошибка при загрузке рейтинга:', error);
      setRatingData([]);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = JSON.parse(sessionStorage.getItem('userData'))?.id || null;
      const response = await fetch('api/mini-app/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = '/';
      } else {
        const result = await response.json();
        console.error('Ошибка при выходе:', result.error);
      }
    } catch (error) {
      console.error("Ошибка при выполнении запроса:", error);
    }
  };

  const handleOpenSettings = async (onLogout) => {
    const modal = document.createElement('div');
    modal.className = styles.modalOverlay;

    const modalContent = document.createElement('div');
    modalContent.className = styles.modalContent;

    const title = document.createElement('h2');
    title.className = styles.modalTitle;
    title.textContent = 'Параметры';

    const themeBlock = document.createElement('div');
    themeBlock.className = styles.block;

    const themeTextContainer = document.createElement('div');
    themeTextContainer.className = styles.textContainer;

    const themeTitle = document.createElement('h3');
    themeTitle.textContent = 'Тема';

    const themeDesc = document.createElement('p');
    themeDesc.textContent = 'Выберите тему приложения.';

    themeTextContainer.appendChild(themeTitle);
    themeTextContainer.appendChild(themeDesc);

    const themeSwitch = document.createElement('button');
    themeSwitch.className = styles.themeSwitch;

    const themeIcon = document.createElement('span');
    const themeLabel = document.createElement('span');

    themeSwitch.appendChild(themeIcon);
    themeSwitch.appendChild(themeLabel);

    // Получаем сохранённую тему из localStorage или ставим по умолчанию 'light'
    let savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
      localStorage.setItem('theme', savedTheme);
    }
    document.documentElement.setAttribute('data-theme', savedTheme);

    let isDarkTheme = savedTheme !== 'light';
    updateThemeSwitchIcon();

    themeSwitch.addEventListener('click', () => {
      isDarkTheme = !isDarkTheme;
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);  // Сохраняем выбранную тему
      updateThemeSwitchIcon();
    });

    function updateThemeSwitchIcon() {
      themeIcon.innerHTML = isDarkTheme ? `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ` : `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
      themeLabel.textContent = isDarkTheme ? 'Тёмная' : 'Светлая';
    }

    themeBlock.appendChild(themeTextContainer);
    themeBlock.appendChild(themeSwitch);

    const divider = document.createElement('div');
    divider.className = styles.divider;

    const versionBlock = document.createElement('div');
    versionBlock.className = styles.block;

    const versionTextContainer = document.createElement('div');
    versionTextContainer.className = styles.textContainer;

    const versionTitle = document.createElement('h3');
    versionTitle.textContent = 'Версия';

    const versionDesc = document.createElement('p');
    versionDesc.textContent = 'Версия мини-приложения.';

    versionTextContainer.appendChild(versionTitle);
    versionTextContainer.appendChild(versionDesc);

    const versionLabel = document.createElement('span');
    versionLabel.className = styles.versionLabel;
    versionLabel.textContent = versions.MINI_APP;

    versionBlock.appendChild(versionTextContainer);
    versionBlock.appendChild(versionLabel);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = styles.buttonsContainer;

    const logoutBtn = document.createElement('button');
    logoutBtn.className = styles.logoutButton;
    logoutBtn.textContent = 'Выйти из аккаунта';
    logoutBtn.addEventListener('click', () => {
      if (onLogout) onLogout();
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = styles.closeButton;
    closeBtn.textContent = 'Закрыть';
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    buttonsContainer.appendChild(logoutBtn);
    buttonsContainer.appendChild(closeBtn);

    modalContent.appendChild(title);
    modalContent.appendChild(themeBlock);
    modalContent.appendChild(divider);
    modalContent.appendChild(versionBlock);
    modalContent.appendChild(buttonsContainer);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  if (!profile || !performanceData || !attendanceData) {
    return (
      <div className={styles.statusMessage} style={{ display: showStatus ? 'flex' : 'none' }}>
        {statusMessage}
      </div>
    );
  }

  const lastPerformance = performanceData?.[performanceData.length - 1];
  const averageGrade = lastPerformance?.points !== undefined && lastPerformance.points !== null ? lastPerformance.points : '?';
  const lastAttendance = attendanceData?.[attendanceData.length - 1];
  const attendancePoints = lastAttendance?.points !== undefined && lastAttendance.points !== null ? lastAttendance.points : '?';

  const totalPoints = Array.isArray(profile.gaming_points)
    ? profile.gaming_points.reduce((sum, p) => sum + p.points, 0)
    : 0;
  const coinsPoints = Array.isArray(profile.gaming_points)
    ? profile.gaming_points.find(p => p.new_gaming_point_types__id === 1)?.points || 0
    : 0;

  const gemsPoints = Array.isArray(profile.gaming_points)
    ? profile.gaming_points.find(p => p.new_gaming_point_types__id === 2)?.points || 0
    : 0;

  return (
    <>
      <div className={styles.statusMessage} style={{ display: showStatus ? 'flex' : 'none' }}>
        {statusMessage}
      </div>

      <div className={styles.profileHeader}>
        <div className={styles.settingsButton}>
          <button onClick={handleOpenSettings}>
            <svg width="30" height="30" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.61915 3.28333C8.69415 2.83167 9.08581 2.5 9.54415 2.5H10.455C10.9133 2.5 11.305 2.83167 11.38 3.28333L11.5041 4.02833C11.5625 4.38167 11.8241 4.665 12.1541 4.80333C12.4858 4.94 12.8666 4.92167 13.1583 4.71333L13.7725 4.27417C13.9531 4.14505 14.1737 4.08423 14.395 4.10254C14.6163 4.12085 14.8239 4.21711 14.9808 4.37417L15.625 5.01917C15.95 5.34333 15.9916 5.85417 15.725 6.2275L15.2858 6.84167C15.0775 7.13333 15.0591 7.51333 15.1966 7.845C15.3341 8.17583 15.6175 8.43667 15.9716 8.495L16.7158 8.62C17.1683 8.695 17.4991 9.08583 17.4991 9.54417V10.4558C17.4991 10.9142 17.1683 11.3058 16.7158 11.3808L15.9708 11.505C15.6175 11.5633 15.3341 11.8242 15.1966 12.155C15.0591 12.4867 15.0775 12.8667 15.2858 13.1583L15.725 13.7733C15.9916 14.1458 15.9491 14.6567 15.625 14.9817L14.98 15.6258C14.8231 15.7827 14.6156 15.8788 14.3946 15.8971C14.1735 15.9154 13.953 15.8547 13.7725 15.7258L13.1575 15.2867C12.8658 15.0783 12.4858 15.06 12.155 15.1975C11.8233 15.335 11.5633 15.6183 11.5041 15.9717L11.38 16.7167C11.305 17.1683 10.9133 17.5 10.455 17.5H9.54331C9.08498 17.5 8.69415 17.1683 8.61831 16.7167L8.49498 15.9717C8.43581 15.6183 8.17498 15.335 7.84415 15.1967C7.51248 15.06 7.13248 15.0783 6.84081 15.2867L6.22581 15.7258C5.85331 15.9925 5.34248 15.95 5.01748 15.6258L4.37331 14.9808C4.21625 14.8239 4.12 14.6163 4.10168 14.395C4.08337 14.1737 4.14419 13.9531 4.27331 13.7725L4.71248 13.1583C4.92081 12.8667 4.93915 12.4867 4.80248 12.155C4.66498 11.8242 4.38081 11.5633 4.02748 11.505L3.28248 11.38C2.83081 11.305 2.49915 10.9133 2.49915 10.4558V9.54417C2.49915 9.08583 2.83081 8.69417 3.28248 8.61917L4.02748 8.495C4.38081 8.43667 4.66498 8.17583 4.80248 7.845C4.93998 7.51333 4.92165 7.13333 4.71248 6.84167L4.27415 6.22667C4.14502 6.04604 4.0842 5.82544 4.10252 5.60416C4.12083 5.38288 4.21709 5.17528 4.37415 5.01833L5.01831 4.37417C5.17526 4.21711 5.38286 4.12085 5.60414 4.10254C5.82542 4.08423 6.04601 4.14505 6.22665 4.27417L6.84081 4.71333C7.13248 4.92167 7.51331 4.94 7.84415 4.8025C8.17498 4.665 8.43581 4.38167 8.49415 4.02833L8.61915 3.28333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 10C7.5 9.33696 7.76339 8.70107 8.23223 8.23223C8.70107 7.76339 9.33696 7.5 10 7.5C10.663 7.5 11.2989 7.76339 11.7678 8.23223C12.2366 8.70107 12.5 9.33696 12.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <img src={profile.photo} alt="Аватарка пользователя" />
        <h1 id="profile-name">{profile.full_name}</h1>
        <p>{profile.group_name}</p>
      </div>

      <div className={styles.profilePerformance}>
        <div className={`${styles.profilePerformance__metric} ${styles['profilePerformance__metric--grade']}`}>
          <span className={styles.profilePerformance__value}>{averageGrade}</span>
          <span className={styles.profilePerformance__label}>Средний балл</span>
        </div>
        <div className={`${styles.profilePerformance__metric} ${styles['profilePerformance__metric--attendance']}`}>
          <span className={styles.profilePerformance__value}>{attendancePoints}%</span>
          <span className={styles.profilePerformance__label}>Процент посещений</span>
        </div>
      </div>

      <div className={styles.profileDetails}>
        <p>
          <span className={styles.imageWrapper}>
            {totalPoints}
            <span style={{ marginRight: '15px' }}><Image src="/images/coins/top-money.svg" alt="Топ моней" width={20} height={20} className={styles.topMoneySvg} /></span>
            {coinsPoints}
            <span style={{ marginRight: '15px' }}><Image src="/images/coins/coins.png" alt="Топ коины" width={20} height={20} className={styles.topCoinsPng} /></span>
            {gemsPoints}
            <span style={{ marginRight: '15px' }}><Image src="/images/coins/gems.png" alt="Топ гемы" width={20} height={20} className={styles.topGemsPng} /></span>
          </span>
        </p>
      </div>

      <div className={styles.profileRating}>
        <p className={styles.ratingP}>
          <span className={styles.ratingPlace}>
            <span className={styles.placeNumber}>
              {groupPlace || '—'}
            </span>
            <span className={styles.placeText}>Место в группе</span>
          </span>
          <span className={styles.ratingPlace}>
            <span className={styles.placeNumber}>
              {streamPlace || '—'}
            </span>
            <span className={styles.placeText}>Место на потоке</span>
          </span>
        </p>

        <div className={styles.leaderboardButtons}>
          <button
            onClick={() => loadRating('/api/mini-app/parsers/get_rating_group_info')}
            className={`${styles.leaderboardButton} ${currentRatingType === 'group' ? styles.active : ''}`}
          >
            Группа
          </button>
          <button
            onClick={() => loadRating('/api/mini-app/parsers/get_rating_stream_info')}
            className={`${styles.leaderboardButton} ${currentRatingType === 'stream' ? styles.active : ''}`}
          >
            Поток
          </button>
        </div>

        <div className={styles.ratingTableContainer}>
          {ratingData ? (
            <table className={styles.ratingTable} id="leaderboardTable">
              <tbody>
                {ratingData
                  .sort((a, b) => a.position - b.position)
                  .map((item, index) => (
                    item.full_name ? (
                      <tr key={index} style={{ animationDelay: `${index * 0.2}s` }}>
                        <td>{item.position}</td>
                        <td>{item.full_name}</td>
                        <td>{item.amount} <Image src="/images/coins/top-money.svg" alt="Топ моней" width={20} height={20} className={styles.topMoneySvg} /></td>
                      </tr>
                    ) : (
                      <tr key={index} className={styles.dividerRow}>
                        <td colSpan="3" className={styles.divider}></td>
                      </tr>
                    )
                  ))
                }
              </tbody>
            </table>
          ) : (
            <p className={styles.error}>Ошибка при загрузке рейтинга. Попробуйте позже.</p>
          )}
        </div>
      </div>
    </>
  );
}