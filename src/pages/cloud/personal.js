import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

export default function Personal() {
    const router = useRouter();
    const [expandedSpaces, setExpandedSpaces] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [userName, setUserName] = useState('');
    const fileInputRef = useRef(null);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/authenticate', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    router.replace('/');
                }
            } catch (error) {
                router.replace('/');
            }
        }

        checkAuth();
    }, [router]);

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    const downloadFile = async (fileId, fileName) => {
        try {

            const response = await fetch(`/api/files/${fileId}`);

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            // Создаем blob из ответа
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Создаем временную ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || `file-${fileId}`;
            document.body.appendChild(a);
            a.click();

            // Очищаем
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            alert('Не удалось скачать файл: ' + error.message);
        } finally {
        }
    };

    const deleteFile = async (fileId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот файл?')) {
            return;
        }

        try {

            const response = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            // Обновляем список файлов после удаления
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
            alert('Файл успешно удален');
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            alert('Не удалось удалить файл: ' + error.message);
        } finally {
    
        }
    };

    // Функция для категоризации файлов
    const categorizeFiles = (files) => {
        const categories = {
            'Файлы': 0,
            'Фотографии': 0,
            'Документы': 0,
            'Видео': 0
        };

        let totalSize = 0;

        files.forEach(file => {
            totalSize += file.size;

            if (file.mime_type.startsWith('image/')) {
                categories['Фотографии']++;
            } else if (file.mime_type.startsWith('video/')) {
                categories['Видео']++;
            } else if (file.mime_type.startsWith('application/') ||
                file.mime_type.includes('document') ||
                file.mime_type.includes('pdf') ||
                file.mime_type.includes('text')) {
                categories['Документы']++;
            } else {
                categories['Файлы']++;
            }
        });

        return {
            categories,
            totalSize
        };
    };

    // Загрузка данных файлов
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchFiles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch('/api/files/get', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    const { categories, totalSize } = categorizeFiles(data.files);

                    setFiles(data.files);

                    setFileStats(prev => ({
                        totalFiles: data.files.length,
                        categories: prev.categories.map(cat => ({
                            ...cat,
                            count: categories[cat.name] || 0
                        }))
                    }));

                    setStorageStats(prev => ({
                        ...prev,
                        used: Math.round(totalSize / (1024 * 1024)), // Байты в MB
                        free: prev.total - Math.round(totalSize / (1024 * 1024))
                    }));
                } else {
                    setError('Не удалось загрузить данные файлов');
                }
            } catch (err) {
                setError('Ошибка сети при загрузке файлов');
                console.error('Ошибка при загрузке файлов:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [isAuthenticated]);

    ChartJS.register(ArcElement, Tooltip, Legend);

    if (isAuthenticated === null) {
        return null;
    }

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const res = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                alert('Файл успешно загружен!');
                // Обновляем данные после загрузки
                window.location.reload();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Ошибка при загрузке файла');
            }
        } catch (error) {
            alert('Ошибка сети');
            console.error(error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Компоненты иконок остаются без изменений
    const Logo = () => (
        <svg width="81" height="41" viewBox="0 0 81 41" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.3261 27.8818L14.3314 37.0869L10.0527 20.0216L80.1005 1L19.3261 27.8818Z" fill="#C1C1C1" stroke="black" strokeLinejoin="round" />
            <path d="M25.2483 32.4757L14.3857 37.087L19.3804 27.8818L25.2483 32.4757Z" fill="black" stroke="black" strokeLinejoin="round" />
            <path d="M4.07947 8.37109L80.0475 1L10.0521 20.0216L2.42038 14.537C-0.129352 12.7029 0.953431 8.6855 4.07947 8.37109Z" fill="white" stroke="black" strokeLinejoin="round" />
            <path d="M80.0492 1L19.3271 27.8818L33.6475 38.5716C36.5116 40.7026 40.5109 40.4231 43.0431 37.9079L80.0492 1Z" fill="white" stroke="black" strokeLinejoin="round" />
        </svg>
    );

    const HomeIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9.29297 2.293C9.4805 2.10553 9.73481 2.00021 9.99997 2.00021C10.2651 2.00021 10.5194 2.10553 10.707 2.293L17.707 9.293C17.8468 9.43285 17.942 9.61102 17.9806 9.80497C18.0191 9.99892 17.9993 10.2 17.9236 10.3827C17.848 10.5654 17.7198 10.7215 17.5554 10.8314C17.391 10.9413 17.1977 11 17 11H16V17C16 17.2652 15.8946 17.5196 15.7071 17.7071C15.5195 17.8946 15.2652 18 15 18H13C12.7348 18 12.4804 17.8946 12.2929 17.7071C12.1053 17.5196 12 17.2652 12 17V14C12 13.7348 11.8946 13.4804 11.7071 13.2929C11.5195 13.1054 11.2652 13 11 13H8.99997C8.73475 13 8.4804 13.1054 8.29286 13.2929C8.10533 13.4804 7.99997 13.7348 7.99997 14V17C7.99997 17.2652 7.89461 17.5196 7.70708 17.7071C7.51954 17.8946 7.26519 18 6.99997 18H4.99997C4.73475 18 4.4804 17.8946 4.29286 17.7071C4.10533 17.5196 3.99997 17.2652 3.99997 17V11H2.99997C2.80222 11 2.60892 10.9413 2.44451 10.8314C2.2801 10.7215 2.15196 10.5654 2.07629 10.3827C2.00062 10.2 1.98082 9.99892 2.01939 9.80497C2.05795 9.61102 2.15316 9.43285 2.29297 9.293L9.29297 2.293Z" fill="#F32B3B" />
        </svg>
    );

    const WorkspaceIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" fill="#F32B3B" />
            <path d="M7 7H13V9H7V7Z" fill="white" />
            <path d="M7 11H13V13H7V11Z" fill="white" />
        </svg>
    );

    const SearchIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M9 3.5C7.54131 3.5 6.14236 4.07946 5.11091 5.11091C4.07946 6.14236 3.5 7.54131 3.5 9C3.5 10.4587 4.07946 11.8576 5.11091 12.8891C6.14236 13.9205 7.54131 14.5 9 14.5C10.4587 14.5 11.8576 13.9205 12.8891 12.8891C13.9205 11.8576 14.5 10.4587 14.5 9C14.5 7.54131 13.9205 6.14236 12.8891 5.11091C11.8576 4.07946 10.4587 3.5 9 3.5ZM2 9C2.00009 7.88067 2.26861 6.77768 2.78303 5.78356C3.29745 4.78944 4.04276 3.93318 4.95645 3.28659C5.87015 2.64001 6.92557 2.22197 8.0342 2.06754C9.14282 1.9131 10.2723 2.02677 11.3279 2.39902C12.3836 2.77127 13.3345 3.39123 14.101 4.20691C14.8676 5.02259 15.4273 6.0102 15.7333 7.08689C16.0393 8.16358 16.0827 9.29795 15.8597 10.3949C15.6368 11.4918 15.154 12.5192 14.452 13.391L17.78 16.72C17.8537 16.7887 17.9128 16.8715 17.9538 16.9635C17.9948 17.0555 18.0168 17.1548 18.0186 17.2555C18.0204 17.3562 18.0018 17.4562 17.9641 17.5496C17.9264 17.643 17.8703 17.7278 17.799 17.799C17.7278 17.8703 17.643 17.9264 17.5496 17.9641C17.4562 18.0018 17.3562 18.0204 17.2555 18.0186C17.1548 18.0168 17.0555 17.9948 16.9635 17.9538C16.8715 17.9128 16.7887 17.8537 16.72 17.78L13.391 14.452C12.3625 15.2804 11.1207 15.8009 9.80901 15.9536C8.49727 16.1062 7.16912 15.8846 5.97795 15.3145C4.78677 14.7444 3.78117 13.849 3.07727 12.7316C2.37338 11.6143 1.99991 10.3206 2 9Z" fill="#F32B3B" />
        </svg>
    );

    const SettingsIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.61915 3.28333C8.69415 2.83167 9.08581 2.5 9.54415 2.5H10.455C10.9133 2.5 11.305 2.83167 11.38 3.28333L11.5041 4.02833C11.5625 4.38167 11.8241 4.665 12.1541 4.80333C12.4858 4.94 12.8666 4.92167 13.1583 4.71333L13.7725 4.27417C13.9531 4.14505 14.1737 4.08423 14.395 4.10254C14.6163 4.12085 14.8239 4.21711 14.9808 4.37417L15.625 5.01917C15.95 5.34333 15.9916 5.85417 15.725 6.2275L15.2858 6.84167C15.0775 7.13333 15.0591 7.51333 15.1966 7.845C15.3341 8.17583 15.6175 8.43667 15.9716 8.495L16.7158 8.62C17.1683 8.695 17.4991 9.08583 17.4991 9.54417V10.4558C17.4991 10.9142 17.1683 11.3058 16.7158 11.3808L15.9708 11.505C15.6175 11.5633 15.3341 11.8242 15.1966 12.155C15.0591 12.4867 15.0775 12.8667 15.2858 13.1583L15.725 13.7733C15.9916 14.1458 15.9491 14.6567 15.625 14.9817L14.98 15.6258C14.8231 15.7827 14.6156 15.8788 14.3946 15.8971C14.1735 15.9154 13.953 15.8547 13.7725 15.7258L13.1575 15.2867C12.8658 15.0783 12.4858 15.06 12.155 15.1975C11.8233 15.335 11.5633 15.6183 11.5041 15.9717L11.38 16.7167C11.305 17.1683 10.9133 17.5 10.455 17.5H9.54331C9.08498 17.5 8.69415 17.1683 8.61831 16.7167L8.49498 15.9717C8.43581 15.6183 8.17498 15.335 7.84415 15.1967C7.51248 15.06 7.13248 15.0783 6.84081 15.2867L6.22581 15.7258C5.85331 15.9925 5.34248 15.95 5.01748 15.6258L4.37331 14.9808C4.21625 14.8239 4.12 14.6163 4.10168 14.395C4.08337 14.1737 4.14419 13.9531 4.27331 13.7725L4.71248 13.1583C4.92081 12.8667 4.93915 12.4867 4.80248 12.155C4.66498 11.8242 4.38081 11.5633 4.02748 11.505L3.28248 11.38C2.83081 11.305 2.49915 10.9133 2.49915 10.4558V9.54417C2.49915 9.08583 2.83081 8.69417 3.28248 8.61917L4.02748 8.495C4.38081 8.43667 4.66498 8.17583 4.80248 7.845C4.93998 7.51333 4.92165 7.13333 4.71248 6.84167L4.27415 6.22667C4.14502 6.04604 4.0842 5.82544 4.10252 5.60416C4.12083 5.38288 4.21709 5.17528 4.37415 5.01833L5.01831 4.37417C5.17526 4.21711 5.38286 4.12085 5.60414 4.10254C5.82542 4.08423 6.04601 4.14505 6.22665 4.27417L6.84081 4.71333C7.13248 4.92167 7.51331 4.94 7.84415 4.8025C8.17498 4.665 8.43581 4.38167 8.49415 4.02833L8.61915 3.28333Z" stroke="#F32B3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.5 10C12.5 10.663 12.2366 11.2989 11.7678 11.7678C11.2989 12.2366 10.663 12.5 10 12.5C9.33696 12.5 8.70107 12.2366 8.23223 11.7678C7.76339 11.2989 7.5 10.663 7.5 10C7.5 9.33696 7.76339 8.70107 8.23223 8.23223C8.70107 7.76339 9.33696 7.5 10 7.5C10.663 7.5 11.2989 7.76339 11.7678 8.23223C12.2366 8.70107 12.5 9.33696 12.5 10Z" stroke="#F32B3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const LogoutIcon = () => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 7L16 10M16 10L13 13M16 10H6M6 3H5C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H6" stroke="#F32B3B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const ChevronIcon = ({ expanded }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={expanded ? "M19 9L12 16L5 9" : "M9 5L16 12L9 19"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const UploadIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#F32B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 8L12 3L7 8" stroke="#F32B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3V15" stroke="#F32B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const UserAvatar = () => (
        <div className="user-avatar">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#F32B3B" />
                <path d="M16 17C18.7614 17 21 14.7614 21 12C21 9.23858 18.7614 7 16 7C13.2386 7 11 9.23858 11 12C11 14.7614 13.2386 17 16 17Z" fill="white" />
                <path d="M8 25C8 20.5817 11.5817 17 16 17C20.4183 17 24 20.5817 24 25" fill="white" />
            </svg>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <nav className="dashboard-nav">
                <div className="nav-header">
                    <div className="logo-container-dashboard">
                        <Logo />
                    </div>
                </div>

                <ul className="nav-menu">
                    <li className="nav-item">
                        <Link href="/dashboard" legacyBehavior>
                            <a>
                                <HomeIcon />
                                <span>Главная</span>
                            </a>
                        </Link>
                    </li>

                    <li className="nav-item">
                        <a href="#">
                            <SearchIcon />
                            <span>Поиск</span>
                        </a>
                    </li>

                    <div className="nav-divider"></div>

                    <li className="nav-item nav-header-item">
                        <a href="#" onClick={() => setExpandedSpaces(!expandedSpaces)}>
                            <WorkspaceIcon />
                            <span>Рабочие пространства</span>
                            <ChevronIcon expanded={expandedSpaces} />
                        </a>
                    </li>

                    {expandedSpaces && (
                        <>
                            <li className="nav-item active nav-subitem">
                                <Link href="/personal" legacyBehavior>
                                    <a>Личное</a>
                                </Link>
                            </li>
                            <li className="nav-item nav-subitem">
                                <Link href="/common" legacyBehavior>
                                    <a>Общие файлы</a>
                                </Link>
                            </li>
                        </>
                    )}
                </ul>

                <div className="nav-footer">
                    <a href="#" className="settings-link">
                        <SettingsIcon />
                        <span>Настройки</span>
                    </a>
                    <a href="#" className="logout-link" onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}>
                        <LogoutIcon />
                    </a>
                </div>
            </nav>

            <main className="dashboard-content">
                <div className="top-section">
                    <div className="search-container">
                        <div className="search-box">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Поиск файлов, документов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="user-panel">
                        <button onClick={handleUploadClick} className="upload-button">
                            <UploadIcon />
                            <span>Загрузить</span>
                        </button>

                        <input
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        <div className="user-info">
                            <span className="username">{userName}</span>
                            <UserAvatar />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="section-title">Ваши файлы</h2>
                    {files.length === 0 && !isLoading ? (
                        <div className="empty-state">Файлы отсутствуют</div>
                    ) : (
                        <div className="files-grid">
                            {files.map((file) => (
                                <div key={file.id} className="file-card"> {/* Используем file.id как ключ */}
                                    <p className="file-name" title={file.original_name}>
                                        {file.original_name}
                                    </p>
                                    <p className="file-size">
                                        {file.size > 1024 * 1024
                                            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                            : `${(file.size / 1024).toFixed(1)} KB`}
                                    </p>
                                    <div className="file-actions">
                                        <button
                                            onClick={() => downloadFile(file.id, file.original_name)}
                                            className="download-button"
                                        >
                                            Скачать
                                        </button>
                                        <button
                                            onClick={() => deleteFile(file.id)}
                                            className="delete-button"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}