// components/mini-app/Profile/Profile.js
import { useEffect, useState } from 'react';
import styles from './Profile.module.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [currentRatingType, setCurrentRatingType] = useState('group');
  const [statusMessage, setStatusMessage] = useState('');
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchJSON = async (url, errorMsg) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(errorMsg);
    return res.json();
  };

  const fetchProfileData = async () => {
    const loadingMessages = ['Загрузка профиля...', 'Ожидайте...'];
    setStatusMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    setShowStatus(true);

    try {
      const [profileRes, performanceRes, attendanceRes] = await Promise.all([
        fetchJSON('/api/get_profile_info', 'Ошибка при получении данных с сервера'),
        fetchJSON('/api/get_profile_performance_metric_grade', 'Ошибка при получении данных о среднем балле'),
        fetchJSON('/api/get_profile_performance_metric_attendance', 'Ошибка при получении данных о посещаемости')
      ]);

      setProfile(profileRes);
      setPerformanceData(performanceRes);
      setAttendanceData(attendanceRes);
      setShowStatus(false);

      loadRating('/api/get_rating_group_info');
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error);
      setStatusMessage('Ошибка при загрузке профиля. Попробуйте позже.');
      setTimeout(() => setShowStatus(false), 3000);
    }
  };

  const getPlaceFromRating = async (apiEndpoint, fullName) => {
    try {
      const ratingData = await fetchJSON(apiEndpoint, 'Ошибка при получении данных рейтинга');
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
        getPlaceFromRating('/api/get_rating_group_info', fullName),
        getPlaceFromRating('/api/get_rating_stream_info', fullName)
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
      setRatingData(data);
      setCurrentRatingType(apiEndpoint.includes('group') ? 'group' : 'stream');
    } catch (error) {
      console.error('Ошибка при загрузке рейтинга:', error);
      setRatingData(null);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = JSON.parse(sessionStorage.getItem('userData'))?.id || null;
      const response = await fetch('/auth/logout', {
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

  if (!profile || !performanceData || !attendanceData) {
    return (
      <div className={styles.statusMessage} style={{ display: showStatus ? 'flex' : 'none' }}>
        {statusMessage}
      </div>
    );
  }

  const lastPerformance = performanceData[performanceData.length - 1];
  const averageGrade = lastPerformance.points !== null ? lastPerformance.points : '?';
  const lastAttendance = attendanceData[attendanceData.length - 1];
  const attendancePoints = lastAttendance.points !== null ? lastAttendance.points : '?';

  const totalPoints = profile.gaming_points.reduce((sum, p) => sum + p.points, 0);
  const coinsPoints = profile.gaming_points.find(p => p.new_gaming_point_types__id === 1)?.points || 0;
  const gemsPoints = profile.gaming_points.find(p => p.new_gaming_point_types__id === 2)?.points || 0;

  return (
    <>
      <div className={styles.statusMessage} style={{ display: showStatus ? 'flex' : 'none' }}>
        {statusMessage}
      </div>

      <div className={styles.profileHeader}>
        <div className={styles.exitButton}>
          <button onClick={handleLogout}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.7481 23.7268L4.18894 23.12L3.7481 23.7268ZM2.27322 22.2519L2.87998 21.8111L2.27322 22.2519ZM23.7268 22.2519L23.12 21.8111L23.7268 22.2519ZM22.2519 23.7268L21.8111 23.12L22.2519 23.7268ZM22.2519 2.27322L21.8111 2.87998L22.2519 2.27322ZM23.7268 3.7481L23.12 4.18894L23.7268 3.7481ZM3.7481 2.27322L4.18894 2.87998L3.7481 2.27322ZM2.27322 3.7481L2.87998 4.18894L2.27322 3.7481ZM18.9958 15.3313C18.8106 15.7017 18.9608 16.1522 19.3313 16.3375C19.7017 16.5227 20.1522 16.3726 20.3375 16.0021L18.9958 15.3313ZM14.9958 15.3313C14.8106 15.7017 14.9608 16.1523 15.3313 16.3375C15.7017 16.5227 16.1523 16.3726 16.3375 16.0021L14.9958 15.3313ZM15.737 15.5259L15.0662 15.1905L15.0662 15.1905L15.737 15.5259ZM15.737 13.1408L16.4079 12.8054L16.4079 12.8054L15.737 13.1408ZM16.3375 12.6646C16.1522 12.2941 15.7017 12.1439 15.3313 12.3292C14.9608 12.5144 14.8106 12.9649 14.9958 13.3354L16.3375 12.6646ZM13 24.25C10.4835 24.25 8.65632 24.249 7.23713 24.0952C5.83198 23.943 4.916 23.6483 4.18894 23.12L3.30726 24.3335C4.33264 25.0785 5.54278 25.4204 7.07556 25.5865C8.5943 25.751 10.5169 25.75 13 25.75V24.25ZM0.25 13C0.25 15.4831 0.248971 17.4057 0.413516 18.9244C0.579582 20.4572 0.921476 21.6674 1.66646 22.6927L2.87998 21.8111C2.35174 21.084 2.05703 20.168 1.90479 18.7629C1.75103 17.3437 1.75 15.5165 1.75 13H0.25ZM4.18894 23.12C3.68664 22.7551 3.24492 22.3134 2.87998 21.8111L1.66646 22.6927C2.12391 23.3224 2.67762 23.8761 3.30726 24.3335L4.18894 23.12ZM24.25 13C24.25 15.5165 24.249 17.3437 24.0952 18.7629C23.943 20.168 23.6483 21.084 23.12 21.8111L24.3335 22.6927C25.0785 21.6674 25.4204 20.4572 25.5865 18.9244C25.751 17.4057 25.75 15.4831 25.75 13H24.25ZM13 25.75C15.4831 25.75 17.4057 25.751 18.9244 25.5865C20.4572 25.4204 21.6674 25.0785 22.6927 24.3335L21.8111 23.12C21.084 23.6483 20.168 23.943 18.7629 24.0952C17.3437 24.249 15.5165 24.25 13 24.25V25.75ZM23.12 21.8111C22.7551 22.3134 22.3134 22.7551 21.8111 23.12L22.6927 24.3335C23.3224 23.8761 23.8761 23.3224 24.3335 22.6927L23.12 21.8111ZM13 1.75C15.5165 1.75 17.3437 1.75103 18.7629 1.90479C20.168 2.05703 21.084 2.35174 21.8111 2.87998L22.6927 1.66646C21.6674 0.921476 20.4572 0.579582 18.9244 0.413516C17.4057 0.248971 15.4831 0.25 13 0.25V1.75ZM25.75 13C25.75 10.5169 25.751 8.5943 25.5865 7.07556C25.4204 5.54278 25.0785 4.33264 24.3335 3.30726L23.12 4.18894C23.6483 4.916 23.943 5.83198 24.0952 7.23713C24.249 8.65632 24.25 10.4835 24.25 13H25.75ZM21.8111 2.87998C22.3134 3.24492 22.7551 3.68664 23.12 4.18894L24.3335 3.30726C23.8761 2.67762 23.3224 2.12391 22.6927 1.66646L21.8111 2.87998ZM13 0.25C10.5169 0.25 8.5943 0.248971 7.07556 0.413516C5.54278 0.579582 4.33264 0.921476 3.30726 1.66646L4.18894 2.87998C4.916 2.35174 5.83198 2.05703 7.23713 1.90479C8.65632 1.75103 10.4835 1.75 13 1.75V0.25ZM1.75 13C1.75 10.4835 1.75103 8.65632 1.90479 7.23713C2.05703 5.83198 2.35174 4.916 2.87998 4.18894L1.66646 3.30726C0.921476 4.33264 0.579582 5.54278 0.413516 7.07556C0.248971 8.5943 0.25 10.5169 0.25 13H1.75ZM3.30726 1.66646C2.67762 2.12391 2.12391 2.67762 1.66646 3.30726L2.87998 4.18894C3.24492 3.68664 3.68664 3.24492 4.18894 2.87998L3.30726 1.66646ZM10.9167 13C10.9167 14.0585 10.0585 14.9167 9 14.9167V16.4167C10.887 16.4167 12.4167 14.887 12.4167 13H10.9167ZM9 14.9167C7.94145 14.9167 7.08333 14.0585 7.08333 13H5.58333C5.58333 14.887 7.11303 16.4167 9 16.4167V14.9167ZM7.08333 13C7.08333 11.9415 7.94145 11.0833 9 11.0833V9.58333C7.11303 9.58333 5.58333 11.113 5.58333 13H7.08333ZM9 11.0833C10.0585 11.0833 10.9167 11.9415 10.9167 13H12.4167C12.4167 11.113 10.887 9.58333 9 9.58333V11.0833ZM11.6667 13.75H19.5093V12.25H11.6667V13.75ZM20.3375 16.0021L20.4079 15.8613L19.0662 15.1905L18.9958 15.3313L20.3375 16.0021ZM20.4079 15.8613C20.8888 14.8994 20.8888 13.7672 20.4079 12.8054L19.0662 13.4762C19.336 14.0158 19.336 14.6509 19.0662 15.1905L20.4079 15.8613ZM16.3375 16.0021L16.4079 15.8613L15.0662 15.1905L14.9958 15.3313L16.3375 16.0021ZM16.4079 12.8054L16.3375 12.6646L14.9958 13.3354L15.0662 13.4762L16.4079 12.8054ZM16.4079 15.8613C16.8888 14.8994 16.8888 13.7672 16.4079 12.8054L15.0662 13.4762C15.336 14.0158 15.336 14.6509 15.0662 15.1905L16.4079 15.8613ZM19.5093 13.75C19.3217 13.75 19.1501 13.644 19.0662 13.4762L20.4079 12.8054C20.2377 12.465 19.8898 12.25 19.5093 12.25V13.75Z" fill="#ffffff"/>
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
          {totalPoints}
          <span style={{ marginRight: '15px' }}>
            <img width="20" height="20" src="/static/images/coins/top-money.svg" alt="Топ моней" className={styles.topMoneySvg} />
          </span>
          <span className={styles.imageWrapper}>
            {coinsPoints}
            <span style={{ marginRight: '15px' }}>
              <img width="20" height="20" src="/static/images/coins/coins.png" alt="Топ коины" className={styles.topCoinsPng} />
            </span>
            {gemsPoints}
            <span style={{ marginRight: '15px' }}>
              <img width="20" height="20" src="/static/images/coins/gems.png" alt="Топ гемы" className={styles.topGemsPng} />
            </span>
          </span>
        </p>
      </div>

      <div className={styles.profileRating}>
        <p> 
          <span className={styles.ratingPlace}>
            <span className={styles.placeNumber}>
              {profile.groupPlace || '—'}
            </span>
            <span className={styles.placeText}>Место в группе</span>
          </span>
          <span className={styles.ratingPlace}>
            <span className={styles.placeNumber}>
              {profile.streamPlace || '—'}
            </span>
            <span className={styles.placeText}>Место на потоке</span>
          </span>
        </p>
    
        <div className={styles.leaderboardButtons}>
          <button 
            onClick={() => loadRating('/api/get_rating_group_info')}
            className={`${styles.leaderboardButton} ${currentRatingType === 'group' ? styles.active : ''}`}
          >
            Группа
          </button>
          <button 
            onClick={() => loadRating('/api/get_rating_stream_info')}
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
                        <td>{item.amount} <img src="/static/images/coins/top-money.svg" alt="Топ моней" className={styles.topMoneySvg} /></td>
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