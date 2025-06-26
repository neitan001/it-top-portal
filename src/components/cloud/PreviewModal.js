import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/cloud/Personal.module.css';

const fileIcons = {
  psd: 'psd',
  ai: 'ai',
  fig: 'fig',
  pdf: 'pdf',
  zip: 'zip',
  rar: 'zip',
  doc: 'doc',
  docx: 'doc',
  xls: 'xls',
  xlsx: 'xls',
  ppt: 'ppt',
  pptx: 'ppt',
  txt: 'txt',
  js: 'js',
  ts: 'ts',
  py: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  html: 'html',
  css: 'css',
  json: 'json',
  default: 'file',
};

const emojiFallback = {
  psd: '🅿️', ai: '🎨', fig: '🎛️', pdf: '📄', zip: '🗜️', rar: '🗜️', doc: '📄', xls: '📊', ppt: '📈', txt: '📄', js: '💻', ts: '💻', py: '🐍', java: '☕', c: '💻', cpp: '💻', html: '🌐', css: '🎨', json: '🔢', default: '📁',
};

function getFileIconPath(file) {
  const ext = file.original_name.split('.').pop().toLowerCase();
  const icon = fileIcons[ext] || fileIcons.default;
  return `/file-icons/${icon}.svg`;
}

function getFileEmoji(file) {
  const ext = file.original_name.split('.').pop().toLowerCase();
  return emojiFallback[ext] || emojiFallback.default;
}

export default function PreviewModal({ file, onClose }) {
  const [textContent, setTextContent] = useState(null);
  useEffect(() => {
    if (!file) return;
    const isText = file.mime_type && (file.mime_type.startsWith('text/') || file.mime_type.includes('json') || file.mime_type.includes('xml'));
    if (isText) {
      fetch(`/api/cloud/files/${file.id}`)
        .then(res => res.text())
        .then(setTextContent)
        .catch(() => setTextContent('Ошибка загрузки содержимого файла.'));
    } else {
      setTextContent(null);
    }
  }, [file]);

  if (!file) return null;
  const isImage = file.mime_type && file.mime_type.startsWith('image/');
  const isVideo = file.mime_type && file.mime_type.startsWith('video/');
  const isText = file.mime_type && (file.mime_type.startsWith('text/') || file.mime_type.includes('json'));
  const isIframe = file.mime_type && (file.mime_type.includes('html') || file.mime_type.includes('xml') || file.mime_type.includes('pdf'));

  return (
    <div className={styles.previewContainer} onClick={onClose}>
      <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
        <button className={styles.previewClose} onClick={onClose}>&times;</button>
        <div className={styles.previewContent}>
          {isImage ? (
            <Image
              src={`/api/cloud/files/${file.id}`}
              alt={file.original_name}
              width={480}
              height={360}
              className={styles.previewImage}
              unoptimized
              style={{ objectFit: 'contain', borderRadius: '12px', maxHeight: 400, background: '#18181a' }}
            />
          ) : isVideo ? (
            <video
              src={`/api/cloud/files/${file.id}`}
              className={styles.previewVideo}
              style={{ width: '100%', maxHeight: 400, borderRadius: 12, background: '#18181a' }}
              controls
              autoPlay
            />
          ) : isText && textContent !== null ? (
            <pre className={styles.previewText} style={{ width: '100%', minHeight: 200, maxHeight: 400, overflow: 'auto', background: '#18181a', color: '#fff', borderRadius: 12, padding: 16, fontSize: 15 }}>{textContent}</pre>
          ) : isIframe ? (
            <iframe
              src={`/api/cloud/files/${file.id}`}
              className={styles.previewDocument}
              style={{ width: '100%', minHeight: 300, borderRadius: 12, background: '#18181a', border: 'none' }}
              title={file.original_name}
            />
          ) : (
            <div className={styles.previewDocument} style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              <img
                src={getFileIconPath(file)}
                alt={file.original_name}
                style={{ width: 80, height: 80, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += getFileEmoji(file); }}
              />
            </div>
          )}
        </div>
        <div className={styles.previewFileName}>{file.original_name}</div>
        <div className={styles.previewFileSize}>{file.size ? (file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(file.size / 1024).toFixed(1)} KB`) : ''}</div>
      </div>
    </div>
  );
} 