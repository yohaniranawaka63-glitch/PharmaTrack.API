
import axios from "axios";

const api = axios.create({
 baseURL: "https://pharma-track-api.vercel.app/api",
});

api.interceptors.request.use(
  (config) => {
    const savedUser = localStorage.getItem("pharmaTrackUser");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
