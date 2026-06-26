import sys
import json
import os
from PIL import Image, ImageDraw, ImageFont

def render_slide(data):
    width, height = 1920, 1080
    
    # 1. Base Gradient Background (Deep Navy to Charcoal Slate)
    image = Image.new('RGB', (width, height), color=(11, 15, 25))
    draw = ImageDraw.Draw(image, 'RGBA')
    
    # Draw linear background gradient
    for y in range(height):
        # Interpolate from (11, 15, 25) to (26, 31, 44)
        r = int(11 + (15 * y / height))
        g = int(15 + (16 * y / height))
        b = int(25 + (19 * y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # 2. Tricolor Accent Band (Top edge, 6px thick)
    band_height = 6
    draw.rectangle([0, 0, width // 3, band_height], fill=(255, 103, 31, 255)) # Saffron
    draw.rectangle([width // 3, 0, 2 * (width // 3), band_height], fill=(255, 255, 255, 255)) # White
    draw.rectangle([2 * (width // 3), 0, width, band_height], fill=(19, 136, 8, 255)) # Green

    # 3. Header Banner
    draw.rectangle([0, band_height, width, 60], fill=(26, 31, 44, 180))
    
    # Load fonts
    font_path = "C:\\Windows\\Fonts\\Nirmala.ttc"
    if not os.path.exists(font_path):
        font_path = "arial.ttf" # Fallback

    try:
        font_header = ImageFont.truetype(font_path, 20)
        font_title = ImageFont.truetype(font_path, 40)
        font_body = ImageFont.truetype(font_path, 34)
        font_badge = ImageFont.truetype(font_path, 18)
    except:
        font_header = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_badge = ImageFont.load_default()

    # Draw header text
    draw.text((60, 22), "PRESS INFORMATION BUREAU • GOVERNMENT OF INDIA", fill=(212, 175, 55, 255), font=font_header)

    # 4. Content Card (Glassmorphism effect)
    card_x1, card_y1 = 120, 120
    card_x2, card_y2 = width - 120, height - 120
    
    # Translucent background
    draw.rectangle([card_x1, card_y1, card_x2, card_y2], fill=(255, 255, 255, 15))
    
    # Card glowing border
    draw.rectangle([card_x1, card_y1, card_x2, card_y2], outline=(255, 255, 255, 40), width=2)

    # 5. Slide Title / Headline
    headline = data.get("headline", "PIB Press Release")
    draw.text((180, 180), headline, fill=(255, 255, 255, 255), font=font_title)
    
    # Accent line below title
    draw.line([(180, 245), (180 + len(headline) * 15, 245)], fill=(124, 58, 237, 255), width=4)

    # 6. Body text (with automated wrapping within left section)
    narration = data.get("narration", "")
    words = narration.split(' ')
    lines = []
    current_line = []
    
    # Available width on the left: card_x2 - card_x1 - 120 - 580 (avatar width & spacing) = ~980px
    wrap_limit_px = 920
    
    for word in words:
        current_line.append(word)
        # Check text width
        line_text = ' '.join(current_line)
        # Simple estimate for characters width before doing getbbox
        if len(line_text) * 16 > wrap_limit_px:
            current_line.pop()
            lines.append(' '.join(current_line))
            current_line = [word]
    if current_line:
        lines.append(' '.join(current_line))

    # Render body lines
    text_y = 290
    for line in lines[:8]: # Cap lines to fit inside card
        draw.text((180, text_y), line, fill=(229, 231, 235, 255), font=font_body)
        text_y += 55

    # 6b. Draw AI Anchor avatar on the right side
    script_dir = os.path.dirname(os.path.abspath(__file__))
    anchor_path = os.path.join(script_dir, "ai_anchor.png")
    if os.path.exists(anchor_path):
        try:
            anchor_img = Image.open(anchor_path).convert("RGBA")
            anchor_size = 450
            anchor_img = anchor_img.resize((anchor_size, anchor_size), Image.Resampling.LANCZOS)
            
            # Circular mask
            mask = Image.new("L", (anchor_size, anchor_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse((0, 0, anchor_size, anchor_size), fill=255)
            
            # Position avatar on the right
            avatar_x = card_x2 - anchor_size - 80
            avatar_y = card_y1 + 120
            
            # Paste circular avatar
            image.paste(anchor_img, (avatar_x, avatar_y), mask=mask)
            
            # Draw beautiful border around the circular avatar
            draw.ellipse((avatar_x - 2, avatar_y - 2, avatar_x + anchor_size + 2, avatar_y + anchor_size + 2), outline=(124, 58, 237, 255), width=4)
            
            # Draw "AI PRESENTER" badge
            badge_w = 160
            badge_h = 36
            badge_x = avatar_x + anchor_size // 2 - badge_w // 2
            badge_y = avatar_y + anchor_size + 20
            draw.rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], fill=(124, 58, 237, 220))
            draw.text((badge_x + 18, badge_y + 8), "AI PRESENTER", fill=(255, 255, 255, 255), font=font_badge)
        except Exception as avatar_err:
            print(f"Warning: Failed to render avatar image: {avatar_err}")

    # 7. Keyword Badges
    keywords = data.get("keywords", "")
    if keywords:
        tags = [tag.strip() for tag in keywords.split(',') if tag.strip()][:4]
        badge_x = 180
        badge_y = height - 210
        for tag in tags:
            tag_width = len(tag) * 12 + 20
            # Draw badge background
            draw.rectangle([badge_x, badge_y, badge_x + tag_width, badge_y + 36], fill=(124, 58, 237, 40), outline=(124, 58, 237, 100), width=1)
            # Draw badge text
            draw.text((badge_x + 10, badge_y + 6), tag, fill=(167, 139, 250, 255), font=font_badge)
            badge_x += tag_width + 15

    # 8. Timeline Progress Bar
    scene_num = data.get("sceneNum", 1)
    total_scenes = data.get("totalScenes", 1)
    progress_y = height - 160
    bar_width = card_x2 - card_x1 - 120
    bar_start_x = card_x1 + 60
    
    # Track bar (gray background)
    draw.rectangle([bar_start_x, progress_y, bar_start_x + bar_width, progress_y + 8], fill=(55, 65, 81, 255))
    
    # Active fill (purple progress)
    fill_percent = scene_num / total_scenes
    draw.rectangle([bar_start_x, progress_y, bar_start_x + int(bar_width * fill_percent), progress_y + 8], fill=(124, 58, 237, 255))

    # Save to output path
    output_path = data.get("outputPath", "output.png")
    image.save(output_path)
    print(f"Successfully saved frame: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Missing scene config JSON argument")
        sys.exit(1)
        
    try:
        input_data = json.loads(sys.argv[1])
        render_slide(input_data)
    except Exception as e:
        print(f"Error rendering slide: {e}")
        sys.exit(1)
