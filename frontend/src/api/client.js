import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
