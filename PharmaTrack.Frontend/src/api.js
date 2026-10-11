import axios from "axios";

const api = axios.create({
  baseURL: "https://pharmatrack-api-b0035.containers.snapdeploy.app/api",
});

export default api;