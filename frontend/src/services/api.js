import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Dashboard Service
export const fetchDashboardData = async () => {
    const response = await api.get('/dashboard');
    return response.data;
};

// 2. Habits Service
export const fetchHabits = async () => {
    const response = await api.get('/habits');
    return response.data;
};

export const createHabit = async (habitData) => {
    const response = await api.post('/habits', habitData);
    return response.data;
};

export const fetchHabitInsight = async () => {
    const response = await api.get('/habits/insight');
    return response.data;
};

// 3. Tasks Service
export const fetchTasks = async () => {
    const response = await api.get('/tasks');
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
};

export const prioritizeTasksAI = async () => {
    const response = await api.post('/tasks/prioritize');
    return response.data;
};

// ✅ Tambahan fungsi deleteTask agar bisa diimpor di Tasks.jsx
export const deleteTask = async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
};

// 4. Goals Service
export const fetchGoals = async () => {
    const response = await api.get('/goals');
    return response.data;
};

export const createGoal = async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
};

export const breakdownGoalAI = async (goalTitle) => {
    const response = await api.post('/goals/breakdown', { goalTitle });
    return response.data;
};

// 5. Reflection Service
export const fetchReflections = async () => {
    const response = await api.get('/reflections');
    return response.data;
};

export const createReflection = async (content) => {
    const response = await api.post('/reflections', { content });
    return response.data;
};

// 6. Unified History Service
export const fetchUnifiedHistory = async () => {
    const response = await api.get('/history/unified');
    return response.data;
};

export default api;