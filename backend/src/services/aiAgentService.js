import { getGeminiModel } from '../config/openclaw.js';
import { SystemPrompts } from '../utils/prompt.js';
import fs from 'fs';
import path from 'path';

const loadAgentSoul = () => {
    try {
        const soulPath = path.join(process.cwd(), 'SOUL.md');
        if (fs.existsSync(soulPath)) {
            return fs.readFileSync(soulPath, 'utf8');
        }
    } catch (e) {
        console.warn("SOUL.md not found, using default.");
    }
    return "You are Align Agent, an autonomous productivity assistant.";
};

export const executeAgentTask = async (taskType, payload) => {
    const model = getGeminiModel();
    const soul = loadAgentSoul();
    let specificPrompt = '';

    if (taskType === 'habit_insight') {
        specificPrompt = SystemPrompts.habitInsight(payload);
    } else if (taskType === 'task_prioritize') {
        specificPrompt = SystemPrompts.taskPrioritizer(payload);
    } else if (taskType === 'goal_breakdown') {
        specificPrompt = SystemPrompts.goalBreakdown(payload);
    } else if (taskType === 'reflection_analysis') {
        specificPrompt = SystemPrompts.reflectionAnalysis(payload);
    } else {
        specificPrompt = `Process this request: ${JSON.stringify(payload)}`;
    }

    const fullPrompt = `${soul}\n\nTask Instructions:\n${specificPrompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
};