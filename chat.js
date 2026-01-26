// Configuration - You'll need to add your API key here
const API_KEY = 'YOUR_ANTHROPIC_API_KEY_HERE';
const API_URL = 'https://api.anthropic.com/v1/messages';

// System prompt for the lawncare assistant
const SYSTEM_PROMPT = `You are a helpful and knowledgeable lawncare assistant. You provide expert advice on:
- Lawn maintenance and mowing
- Grass types and selection
- Fertilizing and soil health
- Watering schedules and techniques
- Pest and weed control
- Seasonal lawn care
- Lawn problems and solutions
- Equipment and tools

Keep your responses clear, practical, and friendly. Provide actionable advice when possible. If you're not sure about something specific to a region or grass type, ask for clarification.`;

// Chat history to maintain context
let conversationHistory = [];

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🌱';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🌱';
    
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator active';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(indicator);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Send message to Claude API
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Check if API key is configured
    if (API_KEY === 'YOUR_ANTHROPIC_API_KEY_HERE') {
        showError('Please configure your API key in chat.js');
        return;
    }
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const assistantMessage = data.content[0].text;
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add assistant response to chat
        addMessage(assistantMessage);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });
        
        // Limit conversation history to last 10 exchanges to manage token usage
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
        
    } catch (error) {
        removeTypingIndicator();
        showError(`Error: ${error.message}. Please check your API key and try again.`);
        console.error('Error:', error);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Auto-focus input on load
window.addEventListener('load', () => {
    userInput.focus();
});
