// SECURE VERSION - Uses Netlify Function to keep API key hidden

// System prompt for the lawncare assistant - WITH ENHANCED IDENTIFICATION
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

WEED/PLANT IDENTIFICATION PROTOCOL - CRITICAL FOR ACCURACY:
When identifying plants, weeds, grasses, or pests from images:

1. OBSERVE CAREFULLY:
   - Describe what you see: leaf shape, size, arrangement (opposite/alternate)
   - Note color, texture, growth pattern, stem characteristics
   - Look for flowers, seeds, or distinctive features
   - Consider context: lawn setting, time of year visible in photo

2. PROVIDE IDENTIFICATION WITH CONFIDENCE LEVEL:
   - HIGH CONFIDENCE: Clear identifying features visible, certain identification
   - MEDIUM CONFIDENCE: Most features match, but some uncertainty
   - LOW CONFIDENCE: Limited visibility or ambiguous features

3. FORMAT YOUR IDENTIFICATION:
   "This appears to be [plant name] (CONFIDENCE LEVEL: HIGH/MEDIUM/LOW).

   [Brief explanation of why - key identifying features]

   [If MEDIUM or LOW confidence, list 2-3 alternative possibilities]

   [Treatment or management advice if HIGH confidence, or ask for more photos if LOW]"

4. WHEN TO BE CAUTIOUS:
   - Never guess on critical identifications that could lead to wrong treatments
   - If confidence is LOW, ask for additional photos (different angle, closer view, or full plant)
   - Mention similar-looking species that could be confused
   - If it's a protected or beneficial plant, note that clearly

5. EXAMPLES OF GOOD IDENTIFICATION:

HIGH CONFIDENCE:
"This is crabgrass (CONFIDENCE LEVEL: HIGH). The wide, light-green blades spreading in a star pattern and the visible seed heads are distinctive markers. You can see the prostrate growth habit typical of crabgrass.

For treatment, use a post-emergent herbicide with quinclorac if it's actively growing, or apply pre-emergent next spring before soil temps hit 55°F."

MEDIUM CONFIDENCE:
"This appears to be goosegrass (CONFIDENCE LEVEL: MEDIUM). The silvery center and dark green blades suggest goosegrass rather than crabgrass. However, the photo angle makes it hard to see if the stems are truly flattened.

Other possibilities: crabgrass (if stems are round) or dallisgrass (if in clumps).

Can you take a closer photo of the base of the plant where it meets the soil?"

LOW CONFIDENCE:
"I can see this is a broadleaf weed (CONFIDENCE LEVEL: LOW), but I need a clearer view to identify it accurately. The leaf shape suggests it could be clover, spurge, or possibly chickweed.

Can you take another photo with better lighting showing:
- The full plant from above
- Close-up of a single leaf
- Any flowers if present"

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
- ALWAYS include confidence level when identifying plants from images
- Be honest about uncertainty - it's better than giving wrong advice

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
