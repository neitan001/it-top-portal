import React, { useRef, useEffect, useState } from 'react';
import styles from '@/styles/cloud/Personal.module.css';

const MENU_STRUCTURE = [
    { value: 'name', label: 'Имя' },
    { value: 'dateModified', label: 'Дата изменения' },
    { value: 'type', label: 'Тип' },
    {
        label: 'Дополнительно',
        submenu: [
            { value: 'size', label: 'Размер' },
            { value: 'dateCreated', label: 'Дата создания' },
            { value: 'authors', label: 'Авторы' },
            { value: 'tags', label: 'Теги' },
            { value: 'title', label: 'Название' },
        ]
    },
    { divider: true },
    { value: 'asc', label: 'По возрастанию', isDirection: true },
    { value: 'desc', label: 'По убыванию', isDirection: true },
    { divider: true }
];

export default function SortMenu({ open, anchorRef, sortField, sortDirection, onSelect, onDirectionChange, onClose }) {
    const menuRef = useRef(null);
    const [submenuOpen, setSubmenuOpen] = useState(null); // null | 'Дополнительно' | 'Группировать'

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                (!anchorRef || !anchorRef.current || !anchorRef.current.contains(e.target))
            ) {
                onClose && onClose();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    const handleMenuItemClick = (item) => {
        if (item.submenu) {
            setSubmenuOpen(item.label);
        } else if (item.isDirection) {
            onDirectionChange && onDirectionChange(item.value);
            onClose && onClose();
        } else if (item.value) {
            onSelect(item.value);
            onClose && onClose();
        }
    };

    const handleSubmenuClose = () => setSubmenuOpen(null);

    return (
        <div ref={menuRef} className={styles.sortMenuPopup} style={{ position: 'absolute', top: 36, right: 0 }}>
            {MENU_STRUCTURE.map((item, idx) => {
                if (item.divider) return <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />;
                let isActive = item.isDirection
                    ? sortDirection === item.value
                    : sortField === item.value;
                if (item.label === 'Дополнительно' && item.submenu) {
                    isActive = item.submenu.some(sub => sortField === sub.value);
                }
                return (
                    <div
                        key={item.label || item.value}
                        className={isActive ? styles.sortMenuItemActive : styles.sortMenuItem}
                        onClick={() => handleMenuItemClick(item)}
                        onMouseEnter={() => item.submenu && setSubmenuOpen(item.label)}
                        onMouseLeave={() => item.submenu && setTimeout(() => setSubmenuOpen(null), 200)}
                        style={{ position: 'relative' }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            {isActive && (
                                <span className={styles.sortMenuDot} />
                            )}
                            <span style={{marginLeft: isActive ? 8 : 0}}>{item.label}</span>
                            {item.submenu && (
                                <span style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.7 }}>▶</span>
                            )}
                        </span>
                        {item.submenu && submenuOpen === item.label && (
                            <>
                                {/* Расширенный hover buffer вокруг всей строки и между меню */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 'calc(100% - 12px)', // перекрытие и влево
                                        top: '-10px', // чуть выше
                                        width: 38,
                                        height: `calc(100% + 20px)`, // чуть выше и ниже
                                        zIndex: 1002,
                                        background: 'transparent',
                                        pointerEvents: 'auto',
                                    }}
                                    onMouseEnter={() => setSubmenuOpen(item.label)}
                                    onMouseLeave={handleSubmenuClose}
                                />
                                <div
                                    className={styles.sortMenuPopup}
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        top: 0,
                                        minWidth: 150,
                                        zIndex: 1003,
                                    }}
                                    onMouseEnter={() => setSubmenuOpen(item.label)}
                                    onMouseLeave={handleSubmenuClose}
                                >
                                    {item.submenu.map((subitem) => {
                                        const subActive = sortField === subitem.value;
                                        return (
                                            <div
                                                key={subitem.value}
                                                className={subActive ? styles.sortMenuItemActive : styles.sortMenuItem}
                                                onClick={() => {
                                                    onSelect(subitem.value);
                                                    onClose && onClose();
                                                }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    {subActive && (
                                                        <span className={styles.sortMenuDot} />
                                                    )}
                                                    <span style={{marginLeft: subActive ? 8 : 0}}>{subitem.label}</span>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
} 