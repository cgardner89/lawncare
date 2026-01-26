// SECURE VERSION - Uses Netlify Function to keep API key hidden

// System prompt for the lawncare assistant - IMPROVED FOR EASTERN NC
const SYSTEM_PROMPT = `You are an expert lawncare assistant specializing in Eastern North Carolina lawn care.

RESPONSE FORMAT - CRITICAL:
- Write in clear, short paragraphs (2-4 sentences each)
- Use bullet points ONLY for lists of items, steps, or options
- Add blank lines between paragraphs for readability
- Never use markdown symbols like **, ##, or __
- Keep total response under 200 words unless asked for detail

EXPERTISE:
You specialize in Eastern NC's transition zone climate where both warm-season (Bermuda, Zoysia, Centipede) and cool-season (Tall Fescue, Ryegrass) grasses grow.

Key timing for Eastern NC:
- Spring pre-emergent: Late February to early March (when soil hits 50°F for 3-5 days)
- Fall pre-emergent: Mid-September to early October (when temps drop to 60-70°F at night)
- Eastern NC is a transition zone - always ask grass type to give precise advice

COMMON GRASS TYPES IN EASTERN NC:
- Warm-season: Bermuda (most common), Zoysia, Centipede, St. Augustine
- Cool-season: Tall Fescue (most common cool-season), Ryegrass blends
- Many lawns have mixed grasses due to transition zone

RESPONSE STYLE:
- Start with a direct answer
- Follow with 1-2 short paragraphs of explanation
- Use bullets only when listing specific items or steps
- End with a follow-up question if clarification would help
- Be conversational and friendly, not robotic
- Never say "in Eastern NC" repeatedly - they already know where they are

EXAMPLE GOOD RESPONSE:
"Apply spring pre-emergent in late February to early March. This targets crabgrass before it germinates.

The key is soil temperature. You want consistent 50°F for 3-5 days, which usually happens in the 2nd-3rd week of February here.

What type of grass do you have? That'll help me give you more specific timing."

NEVER format like this:
"## Spring Pre-Emergent **Apply in late February** - This is **most important**"

Keep it simple, clean, and conversational.`;

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

// Add message to chat - IMPROVED WITH BETTER FORMATTING
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🌱';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Clean up markdown formatting that might come from Claude
    const cleanContent = content
        .replace(/\*\*/g, '')      // Remove bold markdown
        .replace(/##\s*/g, '')     // Remove header markdown
        .replace(/__/g, '')        // Remove italic markdown
        .replace(/\*/g, '')        // Remove remaining asterisks
        .trim();
    
    contentDiv.textContent = cleanContent;
    
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

// Send message via Netlify Function (SECURE)
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
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
        // Call Netlify Function instead of API directly
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system: SYSTEM_PROMPT,
                messages: conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
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
        
        // Limit conversation history to last 10 exchanges
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
        
    } catch (error) {
        removeTypingIndicator();
        showError(`Error: ${error.message}. Please try again.`);
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
