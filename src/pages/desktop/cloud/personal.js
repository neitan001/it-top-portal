import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import styles from '@/styles/cloud/Personal.module.css';
import SearchPanel from '@/components/cloud/SearchPanel';

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
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [isResetAnimatingOut, setIsResetAnimatingOut] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const originalSwalFire = Swal.fire.bind(Swal);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState(null);
    const [selectionEnd, setSelectionEnd] = useState(null);

    const handleClickOutside = useCallback((e) => {
        // Если клик не по файлу и не по предпросмотру, снимаем выделение и закрываем предпросмотр
        if (!e.target.closest(`.${styles.fileCard}`) && !e.target.closest(`.${styles.previewContainer}`)) {
            setSelectedFiles(new Set());
            setPreviewFile(null);
        }
    }, []);

    useEffect(() => {
        if (selectedFiles.size > 0) {
            setShowBulkActions(true);
            setIsAnimatingOut(false);
        } else if (showBulkActions) {
            setIsAnimatingOut(true);
            const timer = setTimeout(() => {
                setShowBulkActions(false);
                setIsAnimatingOut(false);
            }, 300); // Должно совпадать с временем transition в CSS
            return () => clearTimeout(timer);
        }
    }, [selectedFiles, showBulkActions]);

    useEffect(() => {
        if (selectedFiles.size === 0 && !isResetAnimatingOut) {
            setIsResetAnimatingOut(true);
            const timer = setTimeout(() => {
                setIsResetAnimatingOut(false);
            }, 300);
            return () => clearTimeout(timer);
        } else if (selectedFiles.size > 0) {
            setIsResetAnimatingOut(false);
        }
    }, [selectedFiles, isResetAnimatingOut]);

    Swal.fire = function(config) {
        const darkTheme = {
            background: '#1a1a1a',
            color: 'white',
            confirmButtonColor: '#F32B3B',
            cancelButtonColor: '#333',
            iconColor: '#F32B3B',
            customClass: {
                popup: 'swal-dark',
                confirmButton: 'swal-dark-confirm',
                cancelButton: 'swal-dark-cancel'
            }
        };
        
        return originalSwalFire({
            ...darkTheme,
            ...config
        });
    };

    // Toast-уведомления
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        width: '380px',
        padding: '0.8rem',
        background: '#1a1a1a',
        color: 'white',
        iconColor: '#F32B3B',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        didOpen: (toast) => {
            toast.style.border = '1px solid rgba(243, 43, 59, 0.3)';
            toast.style.borderRadius = '8px';
        }
    });

    Swal.fire = Toast.fire;

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/cloud/auth/authenticate', {
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

            const response = await fetch(`/api/cloud/files/${fileId}`);

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || `file-${fileId}`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            Swal.fire({
                title: 'Ошибка при скачивании',
                text: 'Не удалось скачать файл: ' + error.message,
                icon: 'error',
                confirmButtonText: 'ОК'
            });
        } finally {
        }
    };

    const deleteFile = async (fileId) => {
        const result = await Swal.fire({
            title: 'Удалить файл?',
            text: 'Вы уверены, что хотите удалить этот файл?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Удалить',
            cancelButtonText: 'Отмена',
            customClass: {
                popup: 'swal-dark',
                confirmButton: 'swal-dark-confirm',
                cancelButton: 'swal-dark-cancel',
                timer: undefined
            }
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/cloud/files/${fileId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }

            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
            Toast.fire({
                icon: 'success',
                title: 'Файл успешно удалён',
                timer: 2000
            });
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Не удалось удалить файл: ' + error.message
            });
        }
    };

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

    const handleDragEnter = (e) => {
        e.preventDefault();
        if (!isDragging && e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };
    
    const handleFilesUpload = useCallback(async (formData) => {
        try {
            const res = await fetch('/api/cloud/files/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                Toast.fire({
                    icon: 'success',
                    title: `Загружено ${formData.getAll('files[]').length} файлов`
                });
                window.location.reload();
            } else {
                const errorData = await res.json();
                Toast.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: errorData.error || 'Не удалось загрузить файлы'
                });
            }
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: 'Ошибка сети',
                text: 'Проблемы при соединении с сервером'
            });
        }
    }, [Toast]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < droppedFiles.length; i++) {
            formData.append('files[]', droppedFiles[i]);
        }

        handleFilesUpload(formData);
    }, [handleFilesUpload]);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchFiles = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const res = await fetch('/api/cloud/files/get', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (res.ok) {
                    let data;
                    try {
                        const responseText = await res.text();
                        console.log('Files response text:', responseText);
                        data = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('JSON parse error in fetchFiles:', parseError);
                        setError('Ошибка парсинга ответа сервера');
                        return;
                    }
                    setFiles(data.files);
                } else {
                    let errorData;
                    try {
                        const responseText = await res.text();
                        console.log('Files error response text:', responseText);
                        errorData = JSON.parse(responseText);
                    } catch (parseError) {
                        console.error('JSON parse error in fetchFiles error:', parseError);
                        errorData = { error: 'Неизвестная ошибка сервера' };
                    }
                    setError(errorData.error || 'Не удалось загрузить данные файлов');
                }
            } catch (err) {
                console.error('Network error in fetchFiles:', err);
                setError('Ошибка сети при загрузке файлов');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [isAuthenticated]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionEnd(null);
        };

        const handleGlobalClick = (e) => {
            handleClickOutside(e);
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('click', handleGlobalClick);
        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [handleClickOutside]);

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
        for (let i = 0; i < files.length; i++) {
            formData.append('files[]', files[i]);
        }

        try {
            const res = await fetch('/api/cloud/files/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            if (res.ok) {
                Toast.fire({
                    icon: 'success',
                    title: `Загружено ${files.length} файлов`,
                });
                window.location.reload();
            } else {
                let errorData;
                try {
                    const responseText = await res.text();
                    console.log('Response text:', responseText);
                    errorData = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    errorData = { error: 'Ошибка парсинга ответа сервера' };
                }
                
                Toast.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: errorData.error || 'Не удалось загрузить файлы',
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            Toast.fire({
                position: "top-end",
                icon: 'error',
                title: 'Ошибка',
                text: 'Ошибка сети при загрузке файлов',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                width: '380px'
            });
        }
    };
    const handleLogout = async () => {
        try {
            await fetch('/api/cloud/auth/logout', {
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

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(fileId)) {
                newSelection.delete(fileId);
            } else {
                newSelection.add(fileId);
            }
            return newSelection;
        });
    };

    const selectAllFiles = () => {
        if (selectedFiles.size === files.length) {
            // Если все файлы уже выделены, снимаем выделение
            setSelectedFiles(new Set());
        } else {
            // Иначе выделяем все файлы
            setSelectedFiles(new Set(files.map(file => file.id)));
        }
    };

    const handleMouseDown = (e, fileId) => {
        if (e.button === 0) { // Левая кнопка мыши
            e.preventDefault(); // Предотвращаем выделение текста
            setIsSelecting(true);
            setSelectionStart(fileId);
            setSelectionEnd(fileId);
            
            // Если нажат Ctrl/Cmd, добавляем к выделению, иначе заменяем
            if (e.ctrlKey || e.metaKey) {
                setSelectedFiles(prev => {
                    const newSelection = new Set(prev);
                    if (newSelection.has(fileId)) {
                        newSelection.delete(fileId);
                    } else {
                        newSelection.add(fileId);
                    }
                    return newSelection;
                });
            } else if (e.shiftKey && selectedFiles.size > 0) {
                // Если нажат Shift, выделяем диапазон
                const lastSelected = Array.from(selectedFiles).pop();
                const startIndex = files.findIndex(f => f.id === lastSelected);
                const endIndex = files.findIndex(f => f.id === fileId);
                
                if (startIndex !== -1 && endIndex !== -1) {
                    const minIndex = Math.min(startIndex, endIndex);
                    const maxIndex = Math.max(startIndex, endIndex);
                    const filesToSelect = files.slice(minIndex, maxIndex + 1).map(f => f.id);
                    setSelectedFiles(new Set(filesToSelect));
                }
            } else {
                // Обычный клик - выделяем только этот файл
                setSelectedFiles(new Set([fileId]));
            }
        }
    };

    const handleDoubleClick = (e, file) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Позиция для предпросмотра
        const rect = e.currentTarget.getBoundingClientRect();
        const previewWidth = 400; // Примерная ширина предпросмотра
        const windowWidth = window.innerWidth;
        
        let x = rect.right + 10;
        let y = rect.top;
        
        // Если предпросмотр уйдет за правый край, показываем слева от файла
        if (x + previewWidth > windowWidth) {
            x = rect.left - previewWidth - 10;
        }
        
        // Если предпросмотр уйдет за верхний край, корректируем Y
        if (y < 0) {
            y = 10;
        }
        
        setPreviewPosition({ x, y });
        setPreviewFile(file);
    };

    const handleMouseEnter = (fileId) => {
        if (isSelecting) {
            setSelectionEnd(fileId);
            
            // Выделяем все файлы между начальной и текущей позицией
            const startIndex = files.findIndex(f => f.id === selectionStart);
            const endIndex = files.findIndex(f => f.id === fileId);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const minIndex = Math.min(startIndex, endIndex);
                const maxIndex = Math.max(startIndex, endIndex);
                const filesToSelect = files.slice(minIndex, maxIndex + 1).map(f => f.id);
                setSelectedFiles(new Set(filesToSelect));
            }
        }
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    const selectedCount = Object.keys(selectedFiles).length;

    const handleBulkDownload = async () => {
        if (selectedFiles.size === 0) return;

        try {
            // Для каждого выбранного файла создаем скрытую ссылку и кликаем по ней
            Array.from(selectedFiles).forEach(async fileId => {
                const file = files.find(f => f.id === fileId);
                if (file) {
                    await downloadFile(file.id, file.original_name);
                }
            });

            Toast.fire({
                icon: 'success',
                title: `Начато скачивание ${selectedFiles.size} файлов`
            });
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Не удалось скачать выбранные файлы'
            });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return;

        const result = await Swal.fire({
            title: 'Удалить выбранные файлы?',
            text: `Вы уверены, что хотите удалить ${selectedFiles.size} файлов?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Удалить',
            cancelButtonText: 'Отмена',
            customClass: {
                popup: 'swal-dark',
                confirmButton: 'swal-dark-confirm',
                cancelButton: 'swal-dark-cancel'
            }
        });

        if (!result.isConfirmed) return;

        try {
            const deletePromises = Array.from(selectedFiles).map(fileId => 
                fetch(`/api/cloud/files/${fileId}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
            setSelectedFiles(new Set());
            
            Toast.fire({
                icon: 'success',
                title: `Удалено ${selectedFiles.size} файлов`
            });
        } catch (error) {
            Toast.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Не удалось удалить выбранные файлы'
            });
        }
    };

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
        <div className={styles.dashboardLayout}>
            <nav className={styles.dashboardNav}>
                <div className={styles.navHeader}>
                    <div className={styles.logoContainerDashboard}>
                        <Logo />
                    </div>
                </div>

                <ul className={styles.navMenu}>
                    <li className={styles.navItem}>
                        <Link href="/desktop/cloud/dashboard" legacyBehavior>
                            <a>
                                <HomeIcon />
                                <span>Главная</span>
                            </a>
                        </Link>
                    </li>

                    <li className={styles.navItem}>
                        <a href="#" onClick={e => { e.preventDefault(); setShowSearchPanel(true); }}>
                            <SearchIcon />
                            <span>Поиск</span>
                        </a>
                    </li>

                    <div className={styles.navDivider}></div>

                    <li className={`${styles.navItem} ${styles.navHeaderItem}`}>
                        <a href="#" onClick={() => setExpandedSpaces(!expandedSpaces)}>
                            <WorkspaceIcon />
                            <span>Рабочие пространства</span>
                            <ChevronIcon expanded={expandedSpaces} />
                        </a>
                    </li>

                    {expandedSpaces && (
                        <>
                            <li className={`${styles.navItem} ${styles.navItemActive} ${styles.navSubitem}`}>
                                <Link href="/desktop/cloud/personal" legacyBehavior>
                                    <a>Личное</a>
                                </Link>
                            </li>
                            <li className={`${styles.navItem} ${styles.navSubitem}`}>
                                <Link href="/desktop/cloud/common" legacyBehavior>
                                    <a>Общие файлы</a>
                                </Link>
                            </li>
                        </>
                    )}
                </ul>

                <div className={styles.navFooter}>
                    <a href="#" className={styles.settingsLink}>
                        <SettingsIcon />
                        <span>Настройки</span>
                    </a>
                    <a href="#" className={styles.logoutLink} onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                    }}>
                        <LogoutIcon />
                    </a>
                </div>
            </nav>

            <main className={styles.dashboardContent}>
                {showSearchPanel && (
                    <SearchPanel onClose={() => setShowSearchPanel(false)} large files={files} />
                )}
                <div className={styles.topSection}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchBox}>
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Поиск файлов, документов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.glowInput}
                                onFocus={() => setShowSearchPanel(true)}
                                onClick={() => setShowSearchPanel(true)}
                            />
                        </div>
                    </div>

                    <div className={styles.userPanel}>
                        <button onClick={handleUploadClick} className={styles.uploadButton}>
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

                        <div className={styles.userInfo}>
                            <span className={styles.username}>{userName}</span>
                            <UserAvatar />
                        </div>
                    </div>
                </div>

                <div className={styles.mt8}>
                    <div 
                        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <UploadIcon />
                        <p>{isDragging ? 'Отпустите файлы здесь' : 'Перетащите файлы сюда'}</p>
                        <small>или нажмите &apos;Загрузить&apos; выше</small>
                    </div>

                    <div 
                        className={`${styles.bulkActions} ${showBulkActions ? styles.show : ''} ${isAnimatingOut ? styles.animateOut : ''}`}
                    >
                        <button 
                            onClick={handleBulkDownload}
                            className={styles.bulkButton}
                        >
                            Скачать выбранные ({selectedFiles.size})
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className={styles.bulkButton}
                        >
                            Удалить выбранные ({selectedFiles.size})
                        </button>
                    </div>

                    <div className={styles.filesContainer}>
                        <div className={styles.filesHeader}>
                            <h2 className={styles.sectionTitle}>Ваши файлы</h2>
                            <div className={styles.headerButtons}>
                                {selectedFiles.size > 0 && (
                                    <div className={`${styles.resetButtonContainer} ${isResetAnimatingOut ? styles.animateOut : ''}`}>
                                        <button 
                                            onClick={() => setSelectedFiles(new Set())}
                                            className={styles.resetButton}
                                        >
                                            Сбросить выбор
                                        </button>
                                    </div>
                                )}
                                <button 
                                    onClick={selectAllFiles}
                                    className={styles.selectAllButton}
                                >
                                    Выделить всё
                                </button>
                            </div>
                        </div>
                        {files.length === 0 && !isLoading ? (
                            <div className={styles.emptyState}>Файлы отсутствуют</div>
                        ) : (
                            <div className={styles.filesGrid} onMouseUp={handleMouseUp} onContextMenu={(e) => e.preventDefault()}>
                                {files.map((file) => (
                                    <div 
                                        key={file.id}
                                        className={`${styles.fileCard} ${selectedFiles.has(file.id) ? styles.selected : ''}`}
                                        onMouseDown={(e) => handleMouseDown(e, file.id)}
                                        onMouseEnter={() => handleMouseEnter(file.id)}
                                        onDoubleClick={(e) => handleDoubleClick(e, file)}
                                        onContextMenu={(e) => e.preventDefault()}
                                    >
                                        <p className={styles.fileName}>{file.original_name}</p>
                                        <p className={styles.fileSize}>
                                            {file.size > 1024 * 1024
                                                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                                : `${(file.size / 1024).toFixed(1)} KB`}
                                        </p>
                                        <div className={styles.fileActions}>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                downloadFile(file.id, file.original_name);
                                            }} className={styles.downloadButton}>
                                                Скачать
                                            </button>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                deleteFile(file.id);
                                            }} className={styles.deleteButton}>
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Компонент предпросмотра файлов */}
                {previewFile && (
                    <div 
                        className={styles.previewContainer}
                        style={{
                            left: previewPosition.x,
                            top: previewPosition.y
                        }}
                    >
                        <button 
                            className={styles.previewClose}
                            onClick={() => setPreviewFile(null)}
                        >
                            ×
                        </button>
                        
                        {previewFile.mime_type.startsWith('image/') ? (
                            <Image 
                                src={`/api/cloud/files/${previewFile.id}`}
                                alt={previewFile.original_name}
                                width={400}
                                height={400}
                                className={styles.previewImage}
                                unoptimized
                                style={{ objectFit: 'contain' }}
                            />
                        ) : previewFile.mime_type.startsWith('video/') ? (
                            <video 
                                src={`/api/cloud/files/${previewFile.id}`}
                                controls
                                className={styles.previewVideo}
                            />
                        ) : (
                            <div className={styles.previewDocument}>
                                <div>
                                    <div>📄</div>
                                    <div>Предпросмотр недоступен</div>
                                    <div>для этого типа файла</div>
                                </div>
                            </div>
                        )}
                        
                        <div className={styles.previewFileName}>{previewFile.original_name}</div>
                        <div className={styles.previewFileSize}>
                            {previewFile.size > 1024 * 1024
                                ? `${(previewFile.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${(previewFile.size / 1024).toFixed(1)} KB`}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}