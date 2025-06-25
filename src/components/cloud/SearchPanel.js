import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import styles from '@/styles/cloud/SearchPanel.module.css';

// Временные данные для примера (если реальные файлы не переданы)
const recentFiles = [
  { id: 1, name: 'Travel 2026', type: 'folder' },
  { id: 2, name: 'blog-artic.docx', type: 'doc' },
  { id: 3, name: 'travelDiaryItaly.jpg', type: 'image', preview: '/public/images/fox-logo.png' },
  { id: 4, name: 'IRS-Returns-2026.xlsx', type: 'excel' },
];

function highlightMatch(name, query) {
  if (!query) return name;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return name.split(regex).map((part, i) =>
    regex.test(part) ? <span key={i} className={styles.highlight}>{part}</span> : part
  );
}

// Функция для определения типа файла по MIME типу
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
  if (mimeType.includes('text/')) return 'text';
  return 'file';
}

export default function SearchPanel({ onClose, large, files = [] }) {
  const [search, setSearch] = useState('');
  const [isHiding, setIsHiding] = useState(false);
  const panelRef = useRef(null);

  // Преобразуем реальные файлы в формат для отображения
  const allFiles = useMemo(() => {
    if (files.length === 0) {
      // Если файлы не переданы, используем тестовые данные
      return [
        { id: 5, name: "Simon's", type: 'folder' },
        { id: 6, name: 'Italy 2025', type: 'folder' },
        { id: 7, name: 'travelDiaryItaly.jpg', type: 'image', preview: '/public/images/fox-logo.png' },
        { id: 8, name: 'cart_mgmt.js', type: 'js' },
        { id: 9, name: 'peaceful_beach.jpg', type: 'image', preview: '/public/images/fox-logo.png' },
        { id: 10, name: 'exciting_concert.mp4', type: 'video', preview: '/public/images/fox-logo.png' },
      ];
    }
    
    return files.map(file => ({
      id: file.id,
      name: file.original_name,
      type: getFileType(file.mime_type),
      size: file.size,
      mime_type: file.mime_type
    }));
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!search) return allFiles;
    return allFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, allFiles]);

  // Закрытие по клику вне панели
  const handleOverlayClick = (e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      startHide();
    }
  };

  // Анимация закрытия
  const startHide = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsHiding(false);
      onClose();
    }, 300); // Должно совпадать с длительностью анимации
  };

  return (
    <div className={isHiding ? `${styles.overlay} ${styles.hide}` : styles.overlay} onMouseDown={handleOverlayClick}>
      <div
        ref={panelRef}
        className={large ? `${styles.panel} ${styles.large}${isHiding ? ' ' + styles.hide : ''}` : isHiding ? `${styles.panel} ${styles.hide}` : styles.panel}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={styles.searchHeader}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Поиск файлов, документов..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <button className={styles.closeBtn} onClick={startHide}>×</button>
        </div>
        <div className={styles.recentBlock}>
          <div className={styles.recentTitle}>Недавние</div>
          <div className={styles.recentFiles}>
            {recentFiles.map(file => (
              <div key={file.id} className={styles.recentFile}>
                {file.type === 'image' ? (
                  <Image
                    src={file.preview}
                    alt={file.name}
                    className={styles.previewImg}
                    width={48}
                    height={48}
                    style={{ objectFit: 'cover', borderRadius: '7px', marginBottom: '7px', background: '#19191d' }}
                  />
                ) : file.type === 'video' ? (
                  <div className={styles.previewVideo}>🎬</div>
                ) : (
                  <div className={styles.previewIcon}>📄</div>
                )}
                <span className={styles.recentName}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.allBlock}>
          <div className={styles.allTitle}>Все файлы</div>
          <div className={styles.allFiles}>
            {filteredFiles.length === 0 ? (
              <div className={styles.empty}>Нет файлов</div>
            ) : filteredFiles.map(file => (
              <div key={file.id} className={styles.fileItem}>
                <span className={styles.fileIcon}>
                  {file.type === 'folder' ? '📁' : 
                   file.type === 'image' ? '🖼️' : 
                   file.type === 'video' ? '🎬' : 
                   file.type === 'audio' ? '🎵' :
                   file.type === 'pdf' ? '📄' :
                   file.type === 'doc' ? '📝' :
                   file.type === 'excel' ? '📊' :
                   file.type === 'ppt' ? '📈' :
                   file.type === 'text' ? '📄' : '📄'}
                </span>
                <span className={styles.fileName}>{highlightMatch(file.name, search)}</span>
                {file.size && (
                  <span className={styles.fileSize}>
                    {file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(file.size / 1024).toFixed(1)} KB`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 