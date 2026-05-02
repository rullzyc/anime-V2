// IP LAN komputer Anda - agar HP bisa mengakses backend FastAPI
// Jika menggunakan emulator Android: 10.0.2.2
// Jika menggunakan HP fisik lewat WiFi: gunakan IP LAN komputer Anda
const BASE_URL = 'http://192.168.1.35:8000';

/**
 * Helper: Proxy image URL melalui backend kita agar bypass hotlink protection
 */
export const proxyImg = (url) => {
  if (!url) return null;
  return `${BASE_URL}/api/img?url=${encodeURIComponent(url)}`;
};

export const fetchOngoing = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/api/ongoing?page=${page}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching ongoing:", error);
    return [];
  }
};

export const fetchSchedule = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/schedule`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return {};
  }
};

export const fetchEpisodes = async (url) => {
  try {
    const response = await fetch(`${BASE_URL}/api/episodes?url=${encodeURIComponent(url)}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return null;
  }
};

export const fetchGenres = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/genres`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return {};
  }
};

export const fetchAnimeByGenre = async (path) => {
  try {
    const response = await fetch(`${BASE_URL}/api/genre?path=${encodeURIComponent(path)}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching anime by genre:", error);
    return [];
  }
};

export const searchAnime = async (title) => {
  try {
    const response = await fetch(`${BASE_URL}/api/search?title=${encodeURIComponent(title)}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
};

export const fetchStream = async (url) => {
  try {
    const response = await fetch(`${BASE_URL}/api/download?url=${encodeURIComponent(url)}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching stream:", error);
    return null;
  }
};

export const fetchStreamsByResolution = async (url) => {
  try {
    const response = await fetch(`${BASE_URL}/api/streams?url=${encodeURIComponent(url)}`);
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error("Error fetching streams by resolution:", error);
    return null;
  }
};
