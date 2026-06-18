import keycloak from '../keycloak';

const baseUrl = 'http://localhost:3001/api';

const addTokenToRequest = (options) => {
  const token = localStorage.getItem('token');
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  } else if (keycloak && keycloak.token) {
    options.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return options;
};

const fetchWithToken = async (path, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const mergedOptions = { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...(options.headers || {}) } };
  const finalOptions = addTokenToRequest(mergedOptions);

  const url = path.startsWith('http') ? path : `${baseUrl}/${path}`;
  const response = await fetch(url, finalOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

const ApiWrapper = { fetchWithToken, baseUrl };
export default ApiWrapper;
