import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api', // Point directly to backend port for development
});

// Inject auth token if it exists in local storage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
