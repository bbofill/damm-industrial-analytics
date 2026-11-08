/**
 * Configuració centralitzada de la URL del Backend per a Damm Escolta Activa.
 */
const rawUrl = import.meta.env.VITE_API_URL;

export const API_BASE_URL =
  typeof rawUrl === 'string' && rawUrl.trim() !== ''
    ? rawUrl.replace(/['"\s]/g, '').replace(/\/$/, '')
    : '';
