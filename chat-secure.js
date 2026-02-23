// SECURE VERSION - Cloudflare Worker backend
// FINAL: Simple, reliable image handling

const SYSTEM_PROMPT = `You are an expert lawncare assistant with deep knowledge of lawn care across different regions and climates.

RESPONSE FORMAT - CRITICAL:
- Use section headers for multi-part answers (e.g., "Right Now:", "Spring Prevention:")
- Make weed/plant names bold when identifying them
- Use bullet points for lists of items, steps, or options
- Add blank lines between sections for readability
- Keep total response under 250 words unless asked for detail

FORMATTING RULES:
- Section headers should end with a colon (e.g., "Current Treatment:", "Next Steps:")
- Make the PRIMARY weed/plant name bold: **crabgrass** 
- Make confidence levels clear: "CONFIDENCE LEVEL: HIGH"
- Use bullets for action steps or multiple items
- Use numbered lists for sequential steps

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

1. FORMAT YOUR IDENTIFICATION LIKE THIS:

"CONFIDENCE LEVEL: HIGH - This is **crabgrass**.

Key identifying features:
• Wide, light-green blades spreading in a star pattern
• Visible seed heads
• Prostrate growth habit

Treatment Options:
Use a post-emergent herbicide with quinclorac if actively growing, or apply pre-emergent next spring before soil temps hit 55°F."

2. CONFIDENCE LEVELS:
   - HIGH CONFIDENCE: Clear identifying features visible, certain identification
   - MEDIUM CONFIDENCE: Most features match, but some uncertainty  
   - LOW CONFIDENCE: Limited visibility or ambiguous features

3. FOR MEDIUM CONFIDENCE:
"CONFIDENCE LEVEL: MEDIUM - This appears to be **goosegrass**.

The silvery center and dark green blades suggest goosegrass rather than crabgrass. However, the photo angle makes it hard to confirm.

Other possibilities:
• Crabgrass (if stems are round)
• Dallisgrass (if growing in clumps)

Next Steps:
Can you take a closer photo of the base where it meets the soil?"

4. FOR LOW CONFIDENCE:
"CONFIDENCE LEVEL: LOW - I can see this is a broadleaf weed, but need a clearer view for accurate identification.

Possible options based on leaf shape:
• Clover
• Spurge  
• Chickweed

For Better Identification:
Please provide another photo with better lighting showing:
• Full plant from above
• Close-up of a single leaf
• Any flowers if present"

5. MULTI-PART ANSWERS FORMAT:

When answering timing questions, use sections:

"Current Situation:
[Brief assessment of where they are now]

Immediate Action:
[What to do right now]

Spring Prevention:
[What to do in spring]

Fall Prevention:
[What to do in fall]"

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
- Use section headers to organize multi-part answers
- Bold weed/plant names and key terms
- Use bullets for lists and options
- Be friendly and conversational, not robotic
- Provide region-specific timing when you know the location
- ALWAYS include confidence level when identifying plants from images
- Be honest about uncertainty - it's better than giving wrong advice

Keep it simple, clean, well-organized, and easy to scan.`;

let conversationHistory = [];

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImage');

let uploadedImage = null;

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
imageUpload.addEventListener('change', handleImageUpload);
removeImageBtn.addEventListener('click', removeImage);

// Convert image to JPEG
function convertToJpeg(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDimension = 1600;

            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round(height * maxDimension / width);
                    width = maxDimension;
                } else {
                    width = Math.round(width * maxDimension / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => reject(new Error('Cannot process this image format'));
        img.src = dataUrl;
    });
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        showError(`Image too large (${fileSizeMB}MB). Maximum 10MB.`);
        imageUpload.value = '';
        return;
    }

    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file.');
        imageUpload.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            uploadedImage = await convertToJpeg(e.target.result);
            imagePreview.querySelector('img').src = uploadedImage;
            imagePreview.style.display = 'flex';
        } catch (err) {
            showError('This image format is not supported. iPhone users: Go to Settings → Camera → Formats → select "Most Compatible" to save photos as JPEG.');
            imageUpload.value = '';
            console.error('Image conversion error:', err);
        }
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    uploadedImage = null;
    imageUpload.value = '';
    imagePreview.style.display = 'none';
    imagePreview.querySelector('img').src = '';
}

function formatBotMessage(text) {
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^([A-Z][^:\n]+:)$/gm, '<strong>$1</strong>');
    text = text.replace(/^[•\-]\s+(.+)$/gm, '<span class="bullet">•</span> $1');
    text = text.replace(/\n/g, '<br>');
    return text;
}

function addMessage(content, isUser = false, imageData = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? '👤' : '🌱';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (imageData) {
        const img = document.createElement('img');
        img.src = imageData;
        img.style.maxWidth = '200px';
        img.style.borderRadius = '8px';
        img.style.marginBottom = '10px';
        img.style.display = 'block';
        contentDiv.appendChild(img);
    }

    if (isUser) {
        contentDiv.textContent = content;
    } else {
        contentDiv.innerHTML = formatBotMessage(content);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

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

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => errorDiv.remove(), 8000);
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message && !uploadedImage) return;

    userInput.disabled = true;
    sendButton.disabled = true;
    imageUpload.disabled = true;

    const displayMessage = message || "What's this weed?";
    let messageContent;

    if (uploadedImage) {
        messageContent = [
            {
                type: "image",
                source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: uploadedImage.split(',')[1]
                }
            },
            {
                type: "text",
                text: message || "Can you identify this weed or grass? What is it and how should I deal with it?"
            }
        ];
        addMessage(displayMessage, true, uploadedImage);
    } else {
        messageContent = message;
        addMessage(message, true);
    }

    userInput.value = '';
    removeImage();

    // Add to history BEFORE sending
    conversationHistory.push({
        role: 'user',
        content: messageContent
    });

    showTypingIndicator();

    try {
        const response = await fetch('https://lawnhelper.calebsgardner.workers.dev', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system: SYSTEM_PROMPT,
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.content || !data.content[0] || !data.content[0].text) {
            throw new Error('Invalid response from server');
        }

        const assistantMessage = data.content[0].text;

        removeTypingIndicator();
        addMessage(assistantMessage);

        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Clean image data from history
        conversationHistory = conversationHistory.map(msg => {
            if (Array.isArray(msg.content)) {
                const textContent = msg.content
                    .filter(item => item.type === 'text')
                    .map(item => item.text)
                    .join(' ');
                return {
                    role: msg.role,
                    content: textContent || '[Image was uploaded]'
                };
            }
            return msg;
        });

        // Keep last 20 messages
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

    } catch (error) {
        removeTypingIndicator();
        
        // CRITICAL FIX: Remove the failed message from history
        // This prevents the bad data from being sent again
        conversationHistory.pop();
        
        showError(`${error.message}. Please try again with a different photo or refresh the page.`);
        console.error('Error:', error);
    } finally {
        userInput.disabled = false;
        sendButton.disabled = false;
        imageUpload.disabled = false;
        userInput.focus();
    }
}

window.addEventListener('load', () => {
    userInput.focus();
});
