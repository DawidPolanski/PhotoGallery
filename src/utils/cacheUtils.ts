const MAX_CACHE_SIZE = 100;
const MAX_ITEM_SIZE = 1024 * 1024;

const getAvailableStorage = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const { quota, usage } = await navigator.storage.estimate();
    return quota && usage ? quota - usage : null;
  }
  return null;
};

const clearSpaceForNewItem = (newItemSize: number) => {
  while (localStorage.length >= MAX_CACHE_SIZE || newItemSize > MAX_ITEM_SIZE) {
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsedItem = JSON.parse(item);
            if (
              parsedItem.timestamp &&
              parsedItem.timestamp < oldestTimestamp
            ) {
              oldestTimestamp = parsedItem.timestamp;
              oldestKey = key;
            }
          } catch (e) {
            console.error("❌ Błąd parsowania cache:", e);
          }
        }
      }
    }

    if (oldestKey) {
      localStorage.removeItem(oldestKey);
      console.log(`🗑 Usunięto najstarszy element: ${oldestKey}`);
    } else {
      break;
    }
  }
};

export const cacheData = async (key: string, data: any) => {
  try {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`⚠ Pominięto zapis pustych danych dla klucza: ${key}`);
      return;
    }

    const cacheItem = {
      data,
      timestamp: Date.now(),
    };

    const serializedData = JSON.stringify(cacheItem);
    const newItemSize = new Blob([serializedData]).size;

    const availableStorage = await getAvailableStorage();
    if (availableStorage !== null && availableStorage < newItemSize) {
      console.warn("⚠ Brak miejsca w localStorage. Zwolnienie miejsca...");
      clearSpaceForNewItem(newItemSize);
    }

    localStorage.setItem(key, serializedData);
    console.log(`[CACHE] Zapisywanie do cache: ${key}`);
  } catch (e) {
    if (e.name === "QuotaExceededError") {
      console.warn(
        "🚨 Przekroczono limit localStorage. Przenoszenie do sessionStorage..."
      );
      try {
        sessionStorage.setItem(
          key,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (sessionError) {
        console.error(
          "❌ Nie udało się zapisać do sessionStorage:",
          sessionError
        );
      }
    } else {
      console.error("❌ Błąd cache:", e);
    }
  }
};

export const getCache = (key: string) => {
  try {
    const cachedData = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return parsedData.data;
    }
    return null;
  } catch (e) {
    console.error("❌ Błąd odczytu cache:", e);
    return null;
  }
};
