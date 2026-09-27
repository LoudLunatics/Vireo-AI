import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Reflection from './pages/Reflection';
import History from './pages/History';
import ChatBubble from './components/common/AIAssistantBubble';

export default function App() {
    return (
        <BrowserRouter>
            {/* Cukup gunakan fragment atau div tanpa min-h-screen ganda */}
            <div className="bg-background text-foreground m-0 p-0">
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="habits" element={<Habits />} />
                        <Route path="goals" element={<Goals />} />
                        <Route path="reflection" element={<Reflection />} />
                        <Route path="history" element={<History />} />
                    </Route>
                </Routes>

                {/* 🤖 CHAT BUBBLE / AI ASSISTANT GLOBAL WIDGET */}
                <ChatBubble />
            </div>
        </BrowserRouter>
    );
}