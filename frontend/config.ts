// config.ts
const RAW = import.meta.env.VITE_API_BASE_URL?.trim() || '';

/** شيل أي / في الآخر وبعدين شيل /api لو كانت في الآخر */
const BASE = RAW.replace(/\/+$/, '').replace(/\/api$/, '');

export const API_PREFIX = BASE ? `${BASE}/api` : '/api';



