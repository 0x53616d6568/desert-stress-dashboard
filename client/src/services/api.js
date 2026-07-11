const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("dsm_token");
}

async function request(method, path, body, customHeaders = {}) {
  const headers = {
    Accept: "application/json",
    ...customHeaders,
  };
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

// Auth
export const login = (body) => api.post("/auth/login", body);
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");

// Dashboard
export const getDashboardSummary = () => api.get("/dashboard/summary");
export const getLiveFeed = () => api.get("/dashboard/live-feed");

// Subjects
export const listSubjects = () => api.get("/subjects");
export const getSubject = (id) => api.get(`/subjects/${id}`);
export const createSubject = (body) => api.post("/subjects", body);
export const updateSubject = (id, body) => api.patch(`/subjects/${id}`, body);
export const deleteSubject = (id) => api.delete(`/subjects/${id}`);

// Devices
export const listDevices = () => api.get("/devices");
export const getDevice = (id) => api.get(`/devices/${id}`);
export const createDevice = (body) => api.post("/devices", body);
export const updateDevice = (id, body) => api.patch(`/devices/${id}`, body);
export const deleteDevice = (id) => api.delete(`/devices/${id}`);

// Telemetry
//export const listSubjects = () => api.get("/subjects").then(r => r.data);
export const listTelemetry = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/telemetry?${qs}`);
};
export const ingestTelemetry = (body) => api.post("/telemetry", body);
export const getTelemetryStats = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/telemetry/stats?${qs}`);
};
export const getTelemetryChart = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/telemetry/chart?${qs}`);
};

// Alerts
export const listAlerts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/alerts?${qs}`);
};
export const acknowledgeAlert = (id) => api.post(`/alerts/${id}/acknowledge`);

// AI Models
export const listAiModels = () => api.get("/ai/models");
export const getAiModel = (id) => api.get(`/ai/models/${id}`);
export const createAiModel = (body) => api.post("/ai/models", body);
export const updateAiModel = (id, body) => api.patch(`/ai/models/${id}`, body);
export const deleteAiModel = (id) => api.delete(`/ai/models/${id}`);
export const deployAiModel = (id) => api.post(`/ai/models/${id}/deploy`);

// Datasets
export const listDatasets = () => api.get("/datasets");
export const getDataset = (id) => api.get(`/datasets/${id}`);
export const createDataset = (body) => api.post("/datasets", body);
export const updateDataset = (id, body) => api.patch(`/datasets/${id}`, body);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);

// Firmware
export const listFirmwareVersions = () => api.get("/firmware");
export const getFirmwareVersion = (id) => api.get(`/firmware/${id}`);
export const createFirmwareVersion = (body) => api.post("/firmware", body);
export const updateFirmwareVersion = (id, body) => api.patch(`/firmware/${id}`, body);
export const deleteFirmwareVersion = (id) => api.delete(`/firmware/${id}`);

// Inference
export const listInferenceLogs = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/inference/logs?${qs}`);
};
export const getInferenceHealth = () => api.get("/inference/health");

// Health
export const healthCheck = () => api.get("/healthz");
