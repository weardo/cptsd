/**
 * Format post data into a ChatGPT-ready prompt for image generation
 */

type PostData = {
  rawIdea: string;
  script: string | null;
  caption: string | null;
  hashtags: string | null;
  postType: string;
  manualSlidePrompts?: Array<{ slideNumber: number; imageDescription: string }> | null;
};

/**
 * Format post data into a comprehensive ChatGPT prompt for image generation
 */
export function formatChatGPTPrompt(post: PostData): string {
  const isCarousel = post.postType === 'CAROUSEL';
  
  let prompt = `# Image Generation Request for Social Media Post\n\n`;
  
  prompt += `## Post Overview\n`;
  prompt += `**Raw Idea:**\n${post.rawIdea}\n\n`;
  
  if (post.script) {
    prompt += `**Script:**\n${post.script}\n\n`;
  }
  
  if (post.caption) {
    prompt += `**Caption:**\n${post.caption}\n\n`;
  }
  
  if (post.hashtags) {
    prompt += `**Hashtags:**\n${post.hashtags}\n\n`;
  }
  
  prompt += `---\n\n`;
  prompt += `## Image Generation Instructions\n\n`;
  
  if (isCarousel && post.manualSlidePrompts && post.manualSlidePrompts.length > 0) {
    prompt += `This is a **CAROUSEL POST** with ${post.manualSlidePrompts.length} slides.\n\n`;
    prompt += `**IMPORTANT:** You must generate images **ONE SLIDE AT A TIME**. Follow these steps:\n\n`;
    
    post.manualSlidePrompts
      .sort((a, b) => a.slideNumber - b.slideNumber)
      .forEach((slide, index) => {
        prompt += `### Step ${index + 1}: Generate Slide ${slide.slideNumber} Image\n\n`;
        prompt += `**Image Description:**\n${slide.imageDescription}\n\n`;
        prompt += `**Instructions for this slide:**\n`;
        prompt += `1. **FIRST: Identify which specific bird should be used for this slide** (from your Step 1 analysis)\n`;
        prompt += `2. **Review that specific bird's analysis** and list the exact features you'll use for this slide (colors, shape, style)\n`;
        prompt += `3. Generate ONE image for slide ${slide.slideNumber}\n`;
        prompt += `4. Use the image description above as your guide\n`;
        prompt += `5. **Use EXACTLY the features from that specific bird's analysis** - do not deviate, do not mix with other birds\n`;
        prompt += `6. Follow the style guidelines below\n`;
        prompt += `7. Wait for me to confirm before moving to the next slide\n\n`;
        
        if (index < post.manualSlidePrompts!.length - 1) {
          prompt += `---\n\n`;
        }
      });
  } else if (isCarousel && post.script) {
    // Parse slides from script if manual prompts not available
    prompt += `This is a **CAROUSEL POST**. Parse the script above to identify individual slides.\n\n`;
    prompt += `**IMPORTANT:** You must generate images **ONE SLIDE AT A TIME**.\n\n`;
    prompt += `1. First, identify how many slides are in the script\n`;
    prompt += `2. For each slide, generate ONE image\n`;
    prompt += `3. Wait for confirmation before moving to the next slide\n`;
    prompt += `4. Extract the image description from each slide section\n\n`;
  } else {
    prompt += `Generate images for this post following the style guidelines below.\n\n`;
    prompt += `**Required Images:**\n`;
    prompt += `1. **Feed Image** (1080×1080, square format)\n`;
    prompt += `2. **Story Image** (1080×1920, vertical format)\n\n`;
  }
  
  prompt += `---\n\n`;
  prompt += `## STEP 1: MANDATORY BIRD ANALYSIS (DO THIS FIRST - BEFORE ANY IMAGE GENERATION)\n\n`;
  prompt += `**CRITICAL:** Before generating ANY images, you MUST complete this analysis step:\n\n`;
  prompt += `1. **Examine the Finch app reference images** I will provide showing the pet bird characters\n`;
  prompt += `2. **Identify ALL distinct birds** in the reference images. Count how many different birds appear (they may have different colors, sizes, or features)\n`;
  prompt += `3. **For EACH bird separately, create a complete detailed analysis.** Label each bird clearly (e.g., "Bird 1", "Bird 2", or by distinguishing feature like "Blue Bird", "Yellow Bird", etc.)\n\n`;
  prompt += `**For EACH bird, document EVERY detail including:**\n`;
  prompt += `   - **Bird identifier:** Give this bird a clear label/name so you can reference it later\n`;
  prompt += `   - **Exact colors:** Primary body color, secondary colors, accent colors, eye color, beak color, any patterns or gradients\n`;
  prompt += `   - **Shape & proportions:** Head shape (round? oval?), body shape, size ratio of head to body, wing shape and size, tail shape\n`;
  prompt += `   - **Facial features:** Eye shape and size, eye position, beak shape and size, any facial expressions or details\n`;
  prompt += `   - **Illustration style:** Line weight, fill style (solid? gradient?), shading style, outline style, texture details\n`;
  prompt += `   - **Character details:** Any accessories, unique markings, distinctive features that make it recognizable\n`;
  prompt += `   - **Overall aesthetic:** The specific "feel" or style that makes it look like this specific Finch app bird (not a generic bird)\n`;
  prompt += `   - **How to distinguish this bird from others:** What makes this bird unique compared to other birds in the reference images\n\n`;
  prompt += `4. **Create a summary table** listing all birds you've analyzed with their identifiers and key distinguishing features\n`;
  prompt += `5. **Write out each bird's analysis** in a clear, detailed format that you can reference for EVERY image generation\n`;
  prompt += `6. **Confirm with me** that you've completed the analysis for ALL birds before proceeding to image generation\n\n`;
  prompt += `**IMPORTANT:** \n`;
  prompt += `- You MUST reference the specific bird's detailed analysis for EVERY single image you generate\n`;
  prompt += `- If an image should use a specific bird, use that bird's exact features - do NOT mix features from different birds\n`;
  prompt += `- If you're unsure which bird to use, ask me before generating\n`;
  prompt += `- Do NOT deviate from the documented features. If you find yourself creating a bird that looks different, STOP and refer back to the specific bird's analysis.\n\n`;
  prompt += `---\n\n`;
  prompt += `## Style Guidelines (CRITICAL - Follow These Exactly)\n\n`;
  prompt += `**Base Style:**\n`;
  prompt += `- Soft, minimal illustration in flat vector style\n`;
  prompt += `- Warm, muted colors\n`;
  prompt += `- Gentle, calming, and safe atmosphere\n`;
  prompt += `- **CRITICAL: Bird Mascot Style** - You will be provided with reference images from the Finch app showing the pet bird characters. **You MUST follow the exact look and style of these Finch app pet birds, NOT real finch birds.** The bird should match the app's character design: cute, round, friendly, with the specific color palette and illustration style shown in the reference images.\n`;
  prompt += `- **MANDATORY: Use your detailed bird analysis from Step 1 for EVERY image** - For each image, identify which specific bird (from your analysis) should be used, then reference that bird's exact colors, shapes, proportions, and style details you documented. Do NOT create variations or interpretations - use the EXACT features from that specific bird's analysis. Do NOT mix features from different birds.\n`;
  prompt += `- Bird acts as a friendly guide\n`;
  prompt += `- No graphic trauma, violence, dark themes, or realistic humans\n`;
  prompt += `- Focus on metaphors, emotions, and healing\n`;
  prompt += `- Suitable for emotional wellness content\n`;
  prompt += `- Indian context, but no stereotypes\n\n`;
  
  prompt += `**Technical Requirements:**\n`;
  prompt += `- Format: Square (1080×1080) for feed posts, Vertical (1080×1920) for stories\n`;
  prompt += `- **Text in Images:** When the bird mascot is included in the image (especially in speech bubbles, action scenes, or as the main subject), **you MUST include the relevant text from the script/caption in the image**. For example:\n`;
  prompt += `  - If the bird has a speech bubble, include the text from the script/caption inside the bubble\n`;
  prompt += `  - If the image shows the bird in an action scene, include any relevant text from the post content\n`;
  prompt += `  - For background-only or text-focused compositions, leave space for text overlay\n`;
  prompt += `- No logos or watermarks\n`;
  prompt += `- High quality, Instagram-ready\n`;
  prompt += `- **Bird Size & Composition:** The bird mascot should be recognizable and match the Finch app style, but it's perfectly fine for the bird to appear small in the image if that creates better composition and proportion. The bird does NOT need to span the image or be the dominant element - prioritize overall image quality and visual balance.\n\n`;
  
  prompt += `**Composition Guidelines:**\n`;
  prompt += `- For images WITH the bird mascot: Include the text from the script/caption directly in the image (speech bubbles, text overlays, etc.)\n`;
  prompt += `- **Bird size flexibility:** Birds can be small or large depending on what creates the best composition. Prioritize overall image quality and visual balance over making the bird dominant.\n`;
  prompt += `- For feed posts: Balanced composition. If bird is present, include text; if background-only, leave space for text overlay\n`;
  prompt += `- For story posts: Visual interest at top/bottom. If bird is present, include text; if background-only, clean center space for text\n`;
  prompt += `- For carousel slides: Each slide should be self-contained and visually consistent. Include text when birds are shown\n\n`;
  
  prompt += `---\n\n`;
  prompt += `## Your Task\n\n`;
  prompt += `**BEFORE YOU START GENERATING IMAGES:**\n`;
  prompt += `1. Complete the MANDATORY BIRD ANALYSIS (Step 1 above) - analyze EACH bird separately\n`;
  prompt += `2. Wait for my confirmation that your analysis for ALL birds is correct\n`;
  prompt += `3. Keep your detailed bird analysis for ALL birds visible and reference the specific bird's analysis for EVERY image\n\n`;
  
  if (isCarousel) {
    prompt += `**For Carousel Posts:**\n`;
    prompt += `1. **Complete bird analysis first** (see Step 1 above) - analyze EACH bird separately\n`;
    prompt += `2. **Start with Slide 1 only**\n`;
    prompt += `3. **Before generating Slide 1:** Identify which specific bird should be used for this slide, then review that bird's analysis and explicitly list the key features you'll use (colors, shape, style)\n`;
    prompt += `4. Generate the image for Slide 1 based on the description provided, using EXACTLY the features from that specific bird's analysis\n`;
    prompt += `5. **Before each subsequent slide:** Identify which bird to use, then re-read that specific bird's analysis and confirm you're using the exact features from that bird (not mixing with other birds)\n`;
    prompt += `6. **Wait for my confirmation** before proceeding to the next slide\n`;
    prompt += `7. After I confirm, ask me: "Ready for Slide 2?" and wait for my approval\n`;
    prompt += `8. Repeat this process for each slide, referencing the specific bird's analysis each time\n`;
    prompt += `9. **DO NOT generate all slides at once** - work one at a time\n`;
    prompt += `10. **DO NOT deviate from your documented bird features** - use the exact features from the specific bird you identified for that slide\n`;
    prompt += `11. **DO NOT mix features from different birds** - each slide should use one specific bird's exact features\n\n`;
  } else {
    prompt += `**For Single Images:**\n`;
    prompt += `1. **Complete bird analysis first** (see Step 1 above) - analyze EACH bird separately\n`;
    prompt += `2. **Before generating:** Identify which specific bird should be used for each image (Feed vs Story may use different birds), then review that bird's analysis and explicitly list the key features you'll use\n`;
    prompt += `3. Generate the required images (Feed and Story) following the style guidelines above\n`;
    prompt += `4. **Use EXACTLY the features from the specific bird's analysis** - do not create variations, do not mix features from different birds\n\n`;
  }
  
  prompt += `**Remember:**\n`;
  prompt += `- **CRITICAL: Complete the bird analysis FIRST (Step 1) - analyze EACH bird separately before generating any images**\n`;
  prompt += `- **For each image, identify which specific bird to use, then reference that bird's analysis** - do not rely on memory, actively check your documented features for that specific bird\n`;
  prompt += `- **Use EXACT features from the specific bird's analysis** - exact colors, exact shapes, exact proportions, exact style - NO variations or interpretations\n`;
  prompt += `- **DO NOT mix features from different birds** - each image should use one specific bird's exact features\n`;
  prompt += `- Always follow the style guidelines\n`;
  prompt += `- **IMPORTANT: Use the Finch app pet bird style from the reference images provided, NOT real finch birds**\n`;
  prompt += `- **When birds are included: Include the text from the script/caption in the image (especially in speech bubbles or action scenes)**\n`;
  prompt += `- **Bird size is flexible: Birds can appear small for better composition - they don't need to be large or span the image**\n`;
  prompt += `- Keep images safe, gentle, and non-triggering\n`;
  prompt += `- High quality, professional appearance\n\n`;
  
  prompt += `Ready to begin? **First, complete the bird analysis (Step 1) - analyze EACH bird separately - and wait for my confirmation before generating any images.**\n`;
  
  return prompt;
}

