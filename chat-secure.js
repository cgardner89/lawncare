// SECURE VERSION - Uses Cloudflare Worker to keep API key hidden
// UPDATED: HEIC detection, error recovery, better image handling

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

EXAMPLES OF WELL-FORMATTED RESPONSES:

Example 1 - Identification:
"CONFIDENCE LEVEL: HIGH - This is **crabgrass**.

Key Features:
• Wide blades with distinctive texture
• Growing in spreading pattern
• Seed heads visible at top

Treatment:
Post-emergent with quinclorac will handle it now. For next year, apply pre-emergent in late February."

Example 2 - Timing Question:
"Current Situation:
It's too late for pre-emergent this season since weeds have already germinated.

Right Now:
Focus on post-emergent control with a product containing 2,4-D or dicamba for broadleaf weeds.

Spring Prevention:
Apply pre-emergent in late February to early March when soil temps hit 50-55°F consistently for 3 days.

Long-term Success:
• Maintain thick, healthy grass
• Mow at proper height for your grass type
• Water deeply but infrequently"

Keep it simple, clean, well-organized, and easy to scan.`;

// Chat history
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

// Check if file is HEIC format
function isHeicFile(file) {
    return (
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif')
    );
}

// Convert image to JPEG using canvas
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
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

// Handle image upload - WITH HEIC DETECTION AND CONVERSION
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Block HEIC files - browser canvas can't process them
    if (isHeicFile(file)) {
        showError('HEIC photos are not supported. Please take a screenshot of the photo, or change your iPhone camera settings to save as JPEG: Settings → Camera → Formats → Most Compatible.');
        imageUpload.value = '';
        return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        showError(`Image too large (${fileSizeMB}MB). Please upload an image under 10MB.`);
        imageUpload.value = '';
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file (JPG, PNG, etc.)');
        imageUpload.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // Convert to JPEG (handles PNG, WebP, etc.)
            uploadedImage = await convertToJpeg(e.target.result);
            imagePreview.querySelector('img').src = uploadedImage;
            imagePreview.style.display = 'flex';
        } catch (err) {
            showError('Could not process this image. Please try a different photo.');
            imageUpload.value = '';
        }
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

// Format bot message with bold and bullets
function formatBotMessage(text) {
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/^([A-Z][^:\n]+:)$/gm, '<strong>$1</strong>');
    text = text.replace(/^[•\-]\s+(.+)$/gm, '<span class="bullet">•</span> $1');
    text = text.replace(/\n/g, '<br>');
    return text;
}

// Add message to chat
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
    if (indicator) indicator.remove();
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setTimeout(() => errorDiv.remove(), 7000);
}

// Send message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message && !uploadedImage) return;

    userInput.disabled = true;
    sendButton.disabled = true;
    imageUpload.disabled = true;

    let messageContent;
    const displayMessage = message || "What's this weed?";

    if (uploadedImage) {
        messageContent = [
            {
                type: "image",
                source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: uploadedImage.split(',')[1]
                }
            }
        ];
        if (message) {
            messageContent.push({ type: "text", text: message });
        } else {
            messageContent.push({
                type: "text",
                text: "Can you identify this weed or grass? What is it and how should I deal with it?"
            });
        }
        addMessage(displayMessage, true, uploadedImage);
    } else {
        messageContent = message;
        addMessage(message, true);
    }

    userInput.value = '';
    removeImage();

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
            // Remove the failed message from history so it doesn't get stuck
            conversationHistory.pop();
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.content[0].text;

        removeTypingIndicator();
        addMessage(assistantMessage);

        conversationHistory.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Clean image data from history after successful response
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

        // Keep last 10 exchanges
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

    } catch (error) {
        removeTypingIndicator();
        // Remove failed message from history to prevent stuck state
        if (conversationHistory.length > 0 && 
            conversationHistory[conversationHistory.length - 1].role === 'user') {
            conversationHistory.pop();
        }
        showError(`Error: ${error.message}. Please try again.`);
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
