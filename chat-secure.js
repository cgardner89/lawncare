// SECURE VERSION - Uses Netlify Function to keep API key hidden

// System prompt for the lawncare assistant - GENERIC WITH SMART FOLLOW-UPS
const SYSTEM_PROMPT = `You are an expert lawncare assistant with deep knowledge of lawn care across different regions and climates.

RESPONSE FORMAT - CRITICAL:
- Write in clear, short paragraphs (2-4 sentences each)
- Use bullet points ONLY for lists of items, steps, or options
- Add blank lines between paragraphs for readability
- Never use markdown symbols like **, ##, or __
- Keep total response under 200 words unless asked for detail

GATHERING CONTEXT - VERY IMPORTANT:
Before giving specific advice, you need to know:
1. Location/Region (e.g., "Eastern NC", "Florida", "Midwest", "Pacific Northwest")
2. Grass type (e.g., Bermuda, Fescue, Zoysia, Kentucky Bluegrass)

RULES FOR ASKING FOLLOW-UP QUESTIONS:
- If the user mentions their location in the question → don't ask for location
- If the user mentions grass type in the question → don't ask for grass type
- If neither is mentioned → ask for BOTH in a friendly way
- If only one is mentioned → only ask for the missing one
- Give examples when asking (e.g., "What's your general location? For example: Eastern NC, Florida, Midwest")

EXPERTISE AREAS:
- Pre-emergent and post-emergent herbicide timing
- Fertilization schedules for different grass types and regions
- Mowing heights and frequencies
- Watering schedules and drought management
- Weed, pest, and disease identification and treatment
- Grass type selection for different climates
- Soil health and pH management
- Seasonal lawn care for all U.S. climate zones

CLIMATE ZONES YOU KNOW:
- Cool-season zones: Northern U.S., higher elevations
- Warm-season zones: Southern U.S., coastal areas
- Transition zones: Mid-Atlantic, parts of Southeast and Midwest
- Arid zones: Southwest, desert regions

RESPONSE STYLE:
- Start with a direct answer if you have enough info
- If you need more info, ask for it conversationally
- Use bullets only when listing specific items or steps
- Be friendly and conversational, not robotic
- Provide region-specific timing when you know the location

EXAMPLE RESPONSES:

User: "When should I apply pre-emergent?"
You: "I'd be happy to help with pre-emergent timing! To give you the most accurate advice, I need two things:

What's your general location? For example: Eastern NC, Florida, Texas, Midwest, etc.

What type of grass do you have? For example: Bermuda, Fescue, Zoysia, Bluegrass, etc."

User: "When should I apply pre-emergent to my Bermuda?"
You: "For Bermuda grass, spring pre-emergent timing depends on your region since soil temperature is the key factor.

What's your general location? For example: Eastern NC, Georgia, Texas, California, etc.

Once I know that, I can give you the exact timing for your area!"

User: "I'm in Eastern NC. When should I apply pre-emergent to my Bermuda?"
You: "For Bermuda in Eastern NC, apply spring pre-emergent in late February to early March. You're aiming for when soil temps hit 50°F consistently for 3-5 days.

This timing stops crabgrass before it germinates. In your area, this is typically the 2nd-3rd week of February through early March.

Also consider a fall application in mid-September to early October to catch winter annuals."

NEVER format like this:
"## Spring Pre-Emergent **Apply in late February** - This is **most important**"

Keep it simple, clean, and conversational.`;

// Chat history to maintain context
let conversationHistory = [];

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImage');

let uploadedImage = null;

// Event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

imageUpload.addEventListener('change', handleImageUpload);
removeImageBtn.addEventListener('click', removeImage);

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Image too large. Please upload an image under 5MB.');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file (JPG, PNG, etc.)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        imagePreview.querySelector('img').src = uploadedImage;
        imagePreview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

// Remove uploaded image
function removeImage() {
    uploadedImage = null;
    imageUpload.value = '';
    imagePreview.style.display = 'none';
    imagePreview.querySelector('img').src = '';
}

// Add message to chat - IMPROVED WITH BETTER FORMATTING AND IMAGE SUPPORT
function addMessage(content, isUser = false, imageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🌱';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // If there's an image, add it first
    if (imageData) {
        const img = document.createElement('img');
        img.src = imageData;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '8px';
        img.style.marginBottom = '10px';
        img.style.display = 'block';
        contentDiv.appendChild(img);
    }
    
    // Clean up markdown formatting that might come from Claude
    const cleanContent = content
        .replace(/\*\*/g, '')      // Remove bold markdown
        .replace(/##\s*/g, '')     // Remove header markdown
        .replace(/__/g, '')        // Remove italic markdown
        .replace(/\*/g, '')        // Remove remaining asterisks
        .trim();
    
    const textNode = document.createTextNode(cleanContent);
    contentDiv.appendChild(textNode);
    
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

// Send message via Netlify Function (SECURE) - WITH IMAGE SUPPORT
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message && !uploadedImage) return;
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    imageUpload.disabled = true;
    
    // Prepare message content
    let messageContent;
    let displayMessage = message || "What's this weed?";
    
    if (uploadedImage) {
        // If there's an image, create a multi-part message
        messageContent = [
            {
                type: "image",
                source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: uploadedImage.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
            }
        ];
        
        if (message) {
            messageContent.push({
                type: "text",
                text: message
            });
        } else {
            messageContent.push({
                type: "text",
                text: "Can you identify this weed or grass? What is it and how should I deal with it?"
            });
        }
        
        // Add user message with image to chat
        addMessage(displayMessage, true, uploadedImage);
    } else {
        // Text only message
        messageContent = message;
        addMessage(message, true);
    }
    
    userInput.value = '';
    const currentImage = uploadedImage;
    removeImage(); // Clear the image preview
    
    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: messageContent
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
        imageUpload.disabled = false;
        userInput.focus();
    }
}

// Auto-focus input on load
window.addEventListener('load', () => {
    userInput.focus();
});
