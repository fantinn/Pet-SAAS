export function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
}

export function load(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error("Erro ao carregar do localStorage:", error);
    return defaultValue;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Erro ao remover do localStorage:", error);
  }
}
