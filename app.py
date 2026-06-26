import os
import time
import json
import uuid
import sqlite3
import re
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash, Response
from werkzeug.security import generate_password_hash, check_password_hash
from gtts import gTTS
from PIL import Image, ImageDraw, ImageFont

# Define support languages
LANGUAGES = {
    'en': {'name': 'English', 'code': 'en'},
    'hi': {'name': 'Hindi', 'code': 'hi'},
    'bn': {'name': 'Bengali', 'code': 'bn'},
    'mr': {'name': 'Marathi', 'code': 'mr'},
    'te': {'name': 'Telugu', 'code': 'te'},
    'ta': {'name': 'Tamil', 'code': 'ta'},
    'gu': {'name': 'Gujarati', 'code': 'gu'},
    'ur': {'name': 'Urdu', 'code': 'ur'},
    'kn': {'name': 'Kannada', 'code': 'kn'},
    'or': {'name': 'Odia', 'code': 'or'},
    'ml': {'name': 'Malayalam', 'code': 'ml'},
    'pa': {'name': 'Punjabi', 'code': 'pa'},
    'as': {'name': 'Assamese', 'code': 'as'},
    'sa': {'name': 'Sanskrit', 'code': 'sa'}
}

# Pre-baked translations for Gaganyaan Sample Release (Local Fallback)
PRE_BAKED_GAGANYAAN = {
    'en': {
        'original_title': 'ISRO Milestones: Gaganyaan SMPS Hot Test Successfully Completed',
        'original_title_translated': 'ISRO Milestone: Gaganyaan SMPS Hot Test Successfully Completed',
        'summary_points_en': [
            "ISRO successfully hot-tested the Gaganyaan Service Module Propulsion System (SMPS) for 250 seconds.",
            "The test took place at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.",
            "The SMPS consists of 5 liquid engines and 16 reaction control thrusters, crucial for astronaut safety.",
            "This milestone brings India closer to its landmark maiden human spaceflight mission."
        ],
        'summary_points_translated': [
            "ISRO successfully hot-tested the Gaganyaan Service Module Propulsion System (SMPS) for 250 seconds.",
            "The test took place at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.",
            "The SMPS consists of 5 liquid engines and 16 reaction control thrusters, crucial for astronaut safety.",
            "This milestone brings India closer to its landmark maiden human spaceflight mission."
        ],
        'scenes': [
            {
                'headline_en': 'Major Milestone for Gaganyaan',
                'headline_translated': 'Major Milestone for Gaganyaan',
                'narration_en': 'ISRO has successfully completed the hot testing of the Gaganyaan Service Module Propulsion System at Mahendragiri in Tamil Nadu.',
                'narration_translated': 'ISRO has successfully completed the hot testing of the Gaganyaan Service Module Propulsion System at Mahendragiri in Tamil Nadu.',
                'keywords': ['ISRO', 'Gaganyaan', 'SMPS', 'Spaceflight'],
                'visual_prompt': 'A high-contrast title card announcing the Gaganyaan mission milestone.'
            },
            {
                'headline_en': 'Stable System Performance',
                'headline_translated': 'Stable System Performance',
                'narration_en': 'The hot test lasted for 250 seconds, validating the stable performance of the five liquid engines and sixteen reaction control thrusters.',
                'narration_translated': 'The hot test lasted for 250 seconds, validating the stable performance of the five liquid engines and sixteen reaction control thrusters.',
                'keywords': ['Propulsion', 'Hot Test', 'Liquid Engines', 'Thrusters'],
                'visual_prompt': 'Diagram of spacecraft propulsion thrusters with technical specifications.'
            },
            {
                'headline_en': 'Vital Support and Power',
                'headline_translated': 'Vital Support and Power',
                'narration_en': 'The service module is responsible for providing power, life support, and propulsion to the crew module during its journey in space.',
                'narration_translated': 'The service module is responsible for providing power, life support, and propulsion to the crew module during its journey in space.',
                'keywords': ['Service Module', 'Life Support', 'Crew Safety', 'Power'],
                'visual_prompt': '3D conceptual model showing the service module attached to the crew capsule.'
            },
            {
                'headline_en': 'One Step Closer to Orbit',
                'headline_translated': 'One Step Closer to Orbit',
                'narration_en': 'This successful test brings India one step closer to launching its first astronaut crew into space orbit.',
                'narration_translated': 'This successful test brings India one step closer to launching its first astronaut crew into space orbit.',
                'keywords': ['Astronauts', 'Orbit', 'Space Exploration', 'India'],
                'visual_prompt': 'An illustration of Indian astronauts in space suits with the Indian flag.'
            }
        ]
    },
    'hi': {
        'original_title': 'ISRO Milestones: Gaganyaan SMPS Hot Test Successfully Completed',
        'original_title_translated': 'इसरो गगनयान मिशन: सर्विस मॉड्यूल प्रोपल्शन सिस्टम का सफल परीक्षण',
        'summary_points_en': [
            "ISRO successfully hot-tested the Gaganyaan Service Module Propulsion System (SMPS) for 250 seconds.",
            "The test took place at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.",
            "The SMPS consists of 5 liquid engines and 16 reaction control thrusters, crucial for astronaut safety.",
            "This milestone brings India closer to its landmark maiden human spaceflight mission."
        ],
        'summary_points_translated': [
            "इसरो ने 250 सेकंड के लिए गगनयान सर्विस मॉड्यूल प्रोपल्शन सिस्टम (SMPS) का सफल हॉट-टेस्ट किया।",
            "यह परीक्षण महेंद्रगिरि, तमिलनाडु में इसरो प्रोपल्शन कॉम्प्लेक्स में आयोजित किया गया था।",
            "एसएमपीएस में 5 लिक्विड इंजन और 16 रिएक्शन कंट्रोल थ्रस्टर शामिल हैं, जो अंतरिक्ष यात्रियों की सुरक्षा के लिए महत्वपूर्ण हैं।",
            "यह मील का पत्थर भारत को अपनी ऐतिहासिक पहली मानव अंतरिक्ष उड़ान परियोजना के करीब लाता है।"
        ],
        'scenes': [
            {
                'headline_en': 'Major Milestone for Gaganyaan',
                'headline_translated': 'गगनयान मिशन की बड़ी सफलता',
                'narration_en': 'ISRO has successfully completed the hot testing of the Gaganyaan Service Module Propulsion System at Mahendragiri in Tamil Nadu.',
                'narration_translated': 'इसरो ने तमिलनाडु के महेंद्रगिरि में गगनयान सर्विस मॉड्यूल प्रोपल्शन सिस्टम का हॉट परीक्षण सफलतापूर्वक पूरा कर लिया है।',
                'keywords': ['ISRO', 'Gaganyaan', 'SMPS', 'Spaceflight'],
                'visual_prompt': 'A high-contrast title card announcing the Gaganyaan mission milestone.'
            },
            {
                'headline_en': 'Stable System Performance',
                'headline_translated': 'स्थिर प्रणाली प्रदर्शन',
                'narration_en': 'The hot test lasted for 250 seconds, validating the stable performance of the five liquid engines and sixteen reaction control thrusters.',
                'narration_translated': 'हॉट परीक्षण 250 सेकंड तक चला, जिसमें पांच लिक्विड इंजन और सोलह रिएक्शन कंट्रोल थ्रस्टर्स के स्थिर प्रदर्शन की पुष्टि हुई।',
                'keywords': ['Propulsion', 'Hot Test', 'Liquid Engines', 'Thrusters'],
                'visual_prompt': 'Diagram of spacecraft propulsion thrusters with technical specifications.'
            },
            {
                'headline_en': 'Vital Support and Power',
                'headline_translated': 'महत्वपूर्ण सहायता और शक्ति',
                'narration_en': 'The service module is responsible for providing power, life support, and propulsion to the crew module during its journey in space.',
                'narration_translated': 'सर्विस मॉड्यूल अंतरिक्ष यात्रा के दौरान क्रू मॉड्यूल को शक्ति, जीवन रक्षक प्रणाली और प्रणोदक प्रदान करने के लिए जिम्मेदार है।',
                'keywords': ['Service Module', 'Life Support', 'Crew Safety', 'Power'],
                'visual_prompt': '3D conceptual model showing the service module attached to the crew capsule.'
            },
            {
                'headline_en': 'One Step Closer to Orbit',
                'headline_translated': 'कक्षा के एक कदम और करीब',
                'narration_en': 'This successful test brings India one step closer to launching its first astronaut crew into space orbit.',
                'narration_translated': 'यह सफल परीक्षण भारत को अपने पहले अंतरिक्ष यात्री दल को अंतरिक्ष कक्षा में लॉन्च करने के एक कदम और करीब लाता है।',
                'keywords': ['Astronauts', 'Orbit', 'Space Exploration', 'India'],
                'visual_prompt': 'An illustration of Indian astronauts in space suits with the Indian flag.'
            }
        ]
    },
    'ta': {
        'original_title': 'ISRO Milestones: Gaganyaan SMPS Hot Test Successfully Completed',
        'original_title_translated': 'ககன்யான் திட்டத்தில் இஸ்ரோவின் புதிய மைல்கல்',
        'summary_points_en': [
            "ISRO successfully hot-tested the Gaganyaan Service Module Propulsion System (SMPS) for 250 seconds.",
            "The test took place at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.",
            "The SMPS consists of 5 liquid engines and 16 reaction control thrusters, crucial for astronaut safety.",
            "This milestone brings India closer to its landmark maiden human spaceflight mission."
        ],
        'summary_points_translated': [
            "இஸ்ரோ ககன்யான் சேவை தொகுதி உந்துவிசை அமைப்பை (SMPS) 250 வினாடிகளுக்கு வெற்றிகரமாக ஹாட்-டெஸ்ட் செய்தது.",
            "இந்த சோதனை தமிழ்நாட்டின் மகேந்திரகிரியில் உள்ள இஸ்ரோ உந்துவிசை வளாகத்தில் நடைபெற்றது.",
            "SMPS விண்வெளி வீரர்களின் பாதுகாப்பிற்கு முக்கியமான 5 திரவ இயந்திரங்கள் மற்றும் 16 எதிர்வினை கட்டுப்பாட்டு த்ரஸ்டர்களைக் கொண்டுள்ளது.",
            "இந்த மைல்கல் இந்தியாவின் வரலாற்று சிறப்புமிக்க மனித விண்வெளிப் பயணத்திற்கு நம்மை நெருங்கச் செய்கிறது."
        ],
        'scenes': [
            {
                'headline_en': 'Major Milestone for Gaganyaan',
                'headline_translated': 'ககன்யான் திட்டத்தின் முக்கிய மைல்கல்',
                'narration_en': 'ISRO has successfully completed the hot testing of the Gaganyaan Service Module Propulsion System at Mahendragiri in Tamil Nadu.',
                'narration_translated': 'இஸ்ரோ தமிழ்நாட்டின் மகேந்திரகிரியில் ககன்யான் சேவை தொகுதி உந்துவிசை அமைப்பின் ஹாட் சோதனையை வெற்றிகரமாக முடித்துள்ளது.',
                'keywords': ['ISRO', 'Gaganyaan', 'SMPS', 'Spaceflight'],
                'visual_prompt': 'A high-contrast title card announcing the Gaganyaan mission milestone.'
            },
            {
                'headline_en': 'Stable System Performance',
                'headline_translated': 'நிலையான கணினி செயல்திறன்',
                'narration_en': 'The hot test lasted for 250 seconds, validating the stable performance of the five liquid engines and sixteen reaction control thrusters.',
                'narration_translated': 'ஹாட் சோதனை 250 வினாடிகள் நீடித்தது, ஐந்து திரவ இயந்திரங்கள் மற்றும் பதினாறு எதிர்வினை கட்டுப்பாட்டு த்ரஸ்டர்களின் நிலையான செயல்திறனை சரிபார்த்தது.',
                'keywords': ['Propulsion', 'Hot Test', 'Liquid Engines', 'Thrusters'],
                'visual_prompt': 'Diagram of spacecraft propulsion thrusters with technical specifications.'
            },
            {
                'headline_en': 'Vital Support and Power',
                'headline_translated': 'முக்கிய ஆதரவு மற்றும் சக்தி',
                'narration_en': 'The service module is responsible for providing power, life support, and propulsion to the crew module during its journey in space.',
                'narration_translated': 'விண்வெளிப் பயணத்தின் போது க்ரூ மாடியூலுக்கு மின்சாரம், உயிர் ஆதரவு மற்றும் உந்துவிசை வழங்குவதற்கு சேவை தொகுதி பொறுப்பாகும்.',
                'keywords': ['Service Module', 'Life Support', 'Crew Safety', 'Power'],
                'visual_prompt': '3D conceptual model showing the service module attached to the crew capsule.'
            },
            {
                'headline_en': 'One Step Closer to Orbit',
                'headline_translated': 'விண்வெளிக்கு ஒரு படி நெருக்கம்',
                'narration_en': 'This successful test brings India one step closer to launching its first astronaut crew into space orbit.',
                'narration_translated': 'இந்த வெற்றிகரமான சோதனை இந்தியாவின் முதல் விண்வெளி வீரர்களை விண்வெளி சுற்றுப்பாதையில் செலுத்துவதற்கு ஒரு படி நெருக்கமாக கொண்டு வந்துள்ளது.',
                'keywords': ['Astronauts', 'Orbit', 'Space Exploration', 'India'],
                'visual_prompt': 'An illustration of Indian astronauts in space suits with the Indian flag.'
            }
        ]
    },
    'te': {
        'original_title': 'ISRO Milestones: Gaganyaan SMPS Hot Test Successfully Completed',
        'original_title_translated': 'గగన్‌యాన్ మిషన్‌లో ఇస్రో కీలక మైలురాయి',
        'summary_points_en': [
            "ISRO successfully hot-tested the Gaganyaan Service Module Propulsion System (SMPS) for 250 seconds.",
            "The test took place at the ISRO Propulsion Complex in Mahendragiri, Tamil Nadu.",
            "The SMPS consists of 5 liquid engines and 16 reaction control thrusters, crucial for astronaut safety.",
            "This milestone brings India closer to its landmark maiden human spaceflight mission."
        ],
        'summary_points_translated': [
            "భారత అంతరిక్ష పరిశోధనా సంస్థ (ఇస్రో) గగన్‌యాన్ మానవ అంతరిక్ష యాత్రలో ఒక ముఖ్యమైన మైలురాయిని సాధించింది.",
            "మహేంద్రగిరిలో గగన్‌యాన్ సర్వీస్ మాడ్యూల్ ప్రొపల్షన్ సిస్టమ్ హాట్ టెస్టింగ్ విజయవంతంగా పూర్తయింది.",
            "250 సెకన్ల పాటు జరిగిన ఈ పరీక్ష ప్రొపల్షన్ సిస్టమ్ యొక్క స్థిరమైన పనిరును ప్రదర్శించింది.",
            "ఈ విజయవంతమైన పరీక్ష భారతదేశపు మొదటి వ్యోమగాములను కక్ష్యలోకి పంపడానికి మరింత దగ్గర చేసింది."
        ],
        'scenes': [
            {
                'headline_en': 'Major Milestone for Gaganyaan',
                'headline_translated': 'గగన్‌యాన్ కీలక మైలురాయి',
                'narration_en': 'ISRO has successfully completed the hot testing of the Gaganyaan Service Module Propulsion System at Mahendragiri in Tamil Nadu.',
                'narration_translated': 'మహేంద్రగిరిలో గగన్‌యాన్ సర్వీస్ మాడ్యూల్ ప్రొపల్షన్ సిస్టమ్ హాట్ టెస్టింగ్ విజయవంతంగా పూర్తయింది.',
                'keywords': ['ISRO', 'Gaganyaan', 'SMPS', 'Spaceflight'],
                'visual_prompt': 'A high-contrast title card announcing the Gaganyaan mission milestone.'
            },
            {
                'headline_en': 'Stable System Performance',
                'headline_translated': 'స్థిరమైన పనితీరు',
                'narration_en': 'The hot test lasted for 250 seconds, validating the stable performance of the five liquid engines and sixteen reaction control thrusters.',
                'narration_translated': '250 సెకన్ల పాటు జరిగిన ఈ పరీక్ష ఐదు ద్రవ ఇంజన్లు మరియు పదహారు реакция కంట్రోల్ థ్రస్టర్‌ల స్థిరమైన పనితీరును ప్రదర్శించింది.',
                'keywords': ['Propulsion', 'Hot Test', 'Liquid Engines', 'Thrusters'],
                'visual_prompt': 'Diagram of spacecraft propulsion thrusters with technical specifications.'
            },
            {
                'headline_en': 'Vital Support and Power',
                'headline_translated': 'ముఖ్యమైన సహాయం మరియు శక్తి',
                'narration_en': 'The service module is responsible for providing power, life support, and propulsion to the crew module during its journey in space.',
                'narration_translated': 'అంతరిక్ష ప్రయాణంలో క్రూ మాడ్యూల్‌కు పవర్, లైఫ్ సపోర్ట్ మరియు ప్రొపల్షన్ అందించడానికి సర్వీస్ మాడ్యూల్ బాధ్యత వహిస్తుంది.',
                'keywords': ['Service Module', 'Life Support', 'Crew Safety', 'Power'],
                'visual_prompt': '3D conceptual model showing the service module attached to the crew capsule.'
            },
            {
                'headline_en': 'One Step Closer to Orbit',
                'headline_translated': 'కక్ష్యలోకి మరింత దగ్గరగా',
                'narration_en': 'This successful test brings India one step closer to launching its first astronaut crew into space orbit.',
                'narration_translated': 'ఈ విజయవంతమైన పరీక్ష భారతదేశపు మొదటి వ్యోమగాములను కక్ష్యలోకి పంపడానికి మరింత దగ్గర చేసింది.',
                'keywords': ['Astronauts', 'Orbit', 'Space Exploration', 'India'],
                'visual_prompt': 'An illustration of Indian astronauts in space suits with the Indian flag.'
            }
        ]
    }
}

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'pib_text_to_video_secret_key_2026')

# Initialize directories
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('static/output', exist_ok=True)

# Database Setup
DB_FILE = 'database.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    
    # Auto-seed default admin user
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        hashed_password = generate_password_hash('admin')
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', ('admin', hashed_password))
        conn.commit()
        
    conn.close()

init_db()

# Decorator for Login Protection
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please fill out all fields.', 'danger')
            return redirect(url_for('signup'))

        hashed_password = generate_password_hash(password)

        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
            conn.commit()
            conn.close()
            flash('Account created successfully! Please log in.', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Username already exists. Please choose a different one.', 'danger')
            return redirect(url_for('signup'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        if not username or not password:
            flash('Please fill out all fields.', 'danger')
            return redirect(url_for('login'))

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user[2], password):
            session['user_id'] = user[0]
            session['username'] = user[1]
            flash(f'Welcome back, {username}!', 'success')
            return redirect(url_for('video_gen'))
        else:
            flash('Invalid username or password.', 'danger')
            return redirect(url_for('login'))

    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('home'))

@app.route('/video_gen')
@login_required
def video_gen():
    return render_template('video_gen.html')

# Core NLP, Translation and Video Assembly Functions

def wrap_text(text, font, max_width):
    """Helper to wrap text to fit within a specific pixel width."""
    lines = []
    # If text already has newlines, split first
    paragraphs = text.split('\n')
    for paragraph in paragraphs:
        if not paragraph.strip():
            lines.append('')
            continue
        words = paragraph.split()
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            # In newer Pillow, getbbox is standard
            bbox = font.getbbox(test_line)
            width = bbox[2] - bbox[0]
            if width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
                    current_line = []
        if current_line:
            lines.append(' '.join(current_line))
    return '\n'.join(lines)

def generate_slide_image(scene_num, total_scenes, title, headline, narration, keywords, language):
    """Generates a high-quality infographic slide image utilizing Pillow."""
    width, height = 1920, 1080
    
    # 1. Create Linear Gradient Background (Deep Blue/Violet to Slate)
    image = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(image)
    
    for y in range(height):
        # Interpolate color values for smooth linear gradient
        r = int(11 + (26 - 11) * (y / height))
        g = int(15 + (31 - 15) * (y / height))
        b = int(25 + (44 - 25) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # 2. Draw Tricolor Indian Flag Accent Line (6px tall) at the very top
    draw.rectangle([(0, 0), (640, 6)], fill=(255, 153, 51, 255))   # Saffron
    draw.rectangle([(640, 0), (1280, 6)], fill=(255, 255, 255, 255)) # White
    draw.rectangle([(1280, 0), (1920, 6)], fill=(19, 136, 8, 255))   # Green

    # 3. Draw Translucent Header Bar (y=6 to y=76)
    draw.rectangle([(0, 6), (width, 76)], fill=(17, 24, 39, 180))
    
    # 4. Font Configuration (Tries Indic TTC, falls back to Arial, then default)
    try:
        font_regular = ImageFont.truetype("C:/Windows/Fonts/Nirmala.ttc", size=38, index=0)
        font_bold = ImageFont.truetype("C:/Windows/Fonts/Nirmala.ttc", size=54, index=1)
        font_header = ImageFont.truetype("C:/Windows/Fonts/Nirmala.ttc", size=24, index=1)
    except Exception:
        try:
            font_regular = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", size=38)
            font_bold = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", size=54)
            font_header = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", size=24)
        except Exception:
            font_regular = ImageFont.load_default()
            font_bold = ImageFont.load_default()
            font_header = ImageFont.load_default()

    # 5. Render Header Text
    header_text = "PRESS INFORMATION BUREAU • GOVERNMENT OF INDIA"
    h_bbox = draw.textbbox((0, 0), header_text, font=font_header)
    h_w = h_bbox[2] - h_bbox[0]
    draw.text(((width - h_w) // 2, 28), header_text, fill=(234, 179, 8, 255), font=font_header) # Gold

    # 6. Render Slide Title (original title or translated heading)
    title_text = title if len(title) < 65 else title[:62] + "..."
    t_bbox = draw.textbbox((0, 0), title_text, font=font_header)
    t_w = t_bbox[2] - t_bbox[0]
    # Draw title on the right/left or top corner
    draw.text((100, 110), f"Release: {title_text}", fill=(156, 163, 175, 255), font=font_header)
    
    # 7. Draw Glassmorphism Content Card in Center
    card_left, card_top, card_right, card_bottom = 160, 170, 1760, 890
    # Filled rounded rectangle with low opacity
    draw.rounded_rectangle(
        [(card_left, card_top), (card_right, card_bottom)],
        radius=16,
        fill=(255, 255, 255, 12),
        outline=(255, 255, 255, 25),
        width=1
    )

    # 8. Render Scene Headline (Inside Card)
    wrapped_headline = wrap_text(headline, font_bold, 1400)
    head_bbox = draw.textbbox((0, 0), wrapped_headline, font=font_bold)
    head_w = head_bbox[2] - head_bbox[0]
    draw.text(((width - head_w) // 2, 220), wrapped_headline, fill=(6, 182, 212, 255), font=font_bold, align="center") # Cyan

    # 9. Render Scene Narration Text (Inside Card)
    wrapped_narration = wrap_text(narration, font_regular, 1350)
    narr_bbox = draw.textbbox((0, 0), wrapped_narration, font=font_regular)
    narr_w = narr_bbox[2] - narr_bbox[0]
    draw.text(((width - narr_w) // 2, 420), wrapped_narration, fill=(243, 244, 246, 255), font=font_regular, align="center")

    # 10. Render Keyword Tags at the bottom of card
    if keywords:
        tags_text = "Keywords: " + " | ".join(keywords[:4])
        tags_bbox = draw.textbbox((0, 0), tags_text, font=font_header)
        tags_w = tags_bbox[2] - tags_bbox[0]
        draw.text(((width - tags_w) // 2, 820), tags_text, fill=(139, 92, 246, 255), font=font_header) # Purple

    # 11. Render Scene Progress Tracker at bottom of canvas
    bar_x1, bar_y, bar_x2 = 250, 960, 1670
    bar_width = bar_x2 - bar_x1
    # Gray background track
    draw.rounded_rectangle([(bar_x1, bar_y), (bar_x2, bar_y + 8)], radius=4, fill=(55, 65, 81, 255))
    # Active Cyan track fill based on scene index
    active_x2 = bar_x1 + int(bar_width * (scene_num / total_scenes))
    draw.rounded_rectangle([(bar_x1, bar_y), (active_x2, bar_y + 8)], radius=4, fill=(6, 182, 212, 255))

    # Progress text
    progress_label = f"SCENE {scene_num} OF {total_scenes}"
    prog_bbox = draw.textbbox((0, 0), progress_label, font=font_header)
    prog_w = prog_bbox[2] - prog_bbox[0]
    draw.text(((width - prog_w) // 2, 990), progress_label, fill=(156, 163, 175, 255), font=font_header)

    # Save image
    out_path = f"static/output/temp_slide_{scene_num}_{uuid.uuid4().hex[:8]}.png"
    image.save(out_path)
    return out_path

def run_local_pipeline(pib_text, language):
    """Offline NLP Fallback Parser that runs without API keys. Pre-bakes Gaganyaan details."""
    clean_text = pib_text.strip()
    
    # 1. Check if the input is our sample Gaganyaan release
    is_gaganyaan = "GAGANYAAN" in clean_text.upper()
    if is_gaganyaan and language in PRE_BAKED_GAGANYAAN:
        return PRE_BAKED_GAGANYAAN[language]

    # 2. Programmatic fallback for general inputs
    lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
    title = lines[0] if lines else "PIB Press Release"
    if len(title) > 80:
        title = title[:77] + "..."

    # Split text into sentences using simple regex
    sentences = re.split(r'(?<=[.!?])\s+', clean_text)
    # Filter out empty or extremely short sentences
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    
    if not sentences:
        sentences = [clean_text]

    # Select 3-4 key sentences
    selected_sentences = sentences[:4]
    
    # Generate storyboard
    scenes = []
    for i, s in enumerate(selected_sentences):
        # Extract fake keywords
        words = [w.strip(',.()\"') for w in s.split() if len(w) > 5]
        keywords = list(set(words))[:4]
        if not keywords:
            keywords = ["PIB", "India", "Press Release"]
            
        headline = f"Key Highlight - Section {i+1}"
        if i == 0:
            headline = "Mission Briefing"
        elif i == len(selected_sentences) - 1:
            headline = "Future Outlook"

        scenes.append({
            'headline_en': headline,
            'headline_translated': f"{headline} (Demo)",
            'narration_en': s,
            'narration_translated': s, # Keep English since we can't offline translate
            'keywords': keywords,
            'visual_prompt': f"A descriptive graphic representing keywords: {', '.join(keywords)}"
        })

    # Prepare translated title and summary indicators
    lang_name = LANGUAGES[language]['name']
    
    # Return structured storyboard payload
    return {
        'original_title': title,
        'original_title_translated': f"{title} [{lang_name} Demo Mode]",
        'summary_points_en': selected_sentences,
        'summary_points_translated': [f"[Simulated {lang_name} Text] {s}" for s in selected_sentences],
        'scenes': scenes
    }

def run_gemini_pipeline(pib_text, language, api_key):
    """Executes live Gemini API summarization and translation using structural JSON schemas."""
    from google import genai
    from google.genai import types
    from pydantic import BaseModel
    from typing import List

    # Define pydantic schema for structured output
    class Scene(BaseModel):
        headline_en: str
        headline_translated: str
        narration_en: str
        narration_translated: str
        keywords: List[str]
        visual_prompt: str

    class PressReleaseStoryboard(BaseModel):
        original_title: str
        original_title_translated: str
        summary_points_en: List[str]
        summary_points_translated: List[str]
        scenes: List[Scene]

    lang_name = LANGUAGES[language]['name']
    lang_code = LANGUAGES[language]['code']

    prompt = f"""You are an expert news producer and translator. Your task is to take the following PIB Press Release and generate a structured storyboard for a video broadcast.
The target language is: {lang_name} ({lang_code}).

Please return a JSON object with the following structure:
- original_title: The original English headline or a summarized English headline.
- original_title_translated: The headline translated into {lang_name}.
- summary_points_en: 3-4 concise, high-level summary points in English.
- summary_points_translated: The same 3-4 summary points translated into {lang_name}.
- scenes: A list of 3-5 scenes. Each scene should represent a visual segment of the video and contain:
  - headline_en: A short English caption/headline for the slide.
  - headline_translated: The slide headline translated into {lang_name}.
  - narration_en: The English script/voiceover for this scene (should be detailed and take about 10-15 seconds to read).
  - narration_translated: The script/voiceover translated into {lang_name} (this will be used for the regional Text-to-Speech audio).
  - keywords: 3-4 key technical keywords from this scene in English.
  - visual_prompt: A descriptive prompt in English detailing what image or video should be shown on screen.

Input PIB Press Release:
{pib_text}
"""

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PressReleaseStoryboard,
            temperature=0.2
        )
    )
    
    # Parse results
    return json.loads(response.text)

def compile_video(slide_paths, audio_paths, output_path):
    """Synchronizes, stitches, and compiles audio and visual cards using MoviePy."""
    from moviepy import ImageClip, AudioFileClip, concatenate_videoclips
    
    clips = []
    try:
        for s_path, a_path in zip(slide_paths, audio_paths):
            audio = AudioFileClip(a_path)
            # Match image frame duration to exact length of voiceover
            img = ImageClip(s_path).with_duration(audio.duration)
            clip = img.with_audio(audio)
            clips.append(clip)
            
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # Write to static folder
        final_clip.write_videofile(
            output_path, 
            fps=24, 
            codec="libx264", 
            audio_codec="aac",
            logger=None
        )
        
    finally:
        # Crucial clean-up for Windows handles lock
        for clip in clips:
            if clip.audio:
                clip.audio.close()
            clip.close()
        if 'final_clip' in locals():
            final_clip.close()

def cleanup_temp_files(file_paths):
    """Cleans up temporary slides and audio files."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error removing temp file {path}: {e}")

# SSE Generation Endpoint
@app.route('/api/generate', methods=['POST'])
@login_required
def api_generate():
    pib_text = request.form.get('pib_text', '').strip()
    language = request.form.get('language', 'en')
    engine_mode = request.form.get('engine_mode', 'slides')
    api_key = request.form.get('api_key', '').strip()

    if not pibTextValidator(pib_text):
        return {"error": "Invalid text input. Minimum 100 characters required."}, 400

    def event_stream():
        # 1. NLP Summarization
        yield f"data: {json.dumps({'status': 'processing', 'progress': 10, 'step': 'nlp', 'message': 'Parsing the press release and extracting semantic markers...' })}\n\n"
        time.sleep(0.5)

        try:
            if api_key:
                yield f"data: {json.dumps({'status': 'processing', 'progress': 25, 'step': 'nlp', 'message': 'Generating visual scenes and summaries via Gemini AI...' })}\n\n"
                storyboard = run_gemini_pipeline(pib_text, language, api_key)
            else:
                yield f"data: {json.dumps({'status': 'processing', 'progress': 25, 'step': 'nlp', 'message': 'Generating local storyboard template via offline engine...' })}\n\n"
                storyboard = run_local_pipeline(pib_text, language)
        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': f'NLP Summarization failed: {str(e)}' })}\n\n"
            return

        # 2. Translation
        lang_name = LANGUAGES[language]['name']
        yield f"data: {json.dumps({'status': 'processing', 'progress': 40, 'step': 'translate', 'message': f'Translating text elements to target script: {lang_name}' })}\n\n"
        time.sleep(0.5)

        # 3. Audio synthesis (gTTS)
        yield f"data: {json.dumps({'status': 'processing', 'progress': 50, 'step': 'audio', 'message': 'Initializing Speech Narration Engine (TTS)...' })}\n\n"
        
        audio_paths = []
        scene_durations = []
        try:
            for i, scene in enumerate(storyboard['scenes']):
                narration_text = scene['narration_translated']
                # Create TTS voice
                tts = gTTS(text=narration_text, lang=LANGUAGES[language]['code'])
                temp_audio_path = f"static/output/temp_audio_{i}_{uuid.uuid4().hex[:8]}.mp3"
                tts.save(temp_audio_path)
                
                # Fetch duration
                from moviepy import AudioFileClip
                ac = AudioFileClip(temp_audio_path)
                dur = ac.duration
                ac.close() # Close file handle immediately
                
                audio_paths.append(temp_audio_path)
                scene_durations.append(dur)
                
                total_scenes = len(storyboard['scenes'])
                yield f"data: {json.dumps({'status': 'processing', 'progress': 50 + int(15 * (i+1)/total_scenes), 'step': 'audio', 'message': f'Generated speech audio for Scene {i+1} of {total_scenes}' })}\n\n"
        except Exception as e:
            cleanup_temp_files(audio_paths)
            yield f"data: {json.dumps({'status': 'error', 'message': f'Speech Audio generation failed: {str(e)}' })}\n\n"
            return

        # 4. Media Asset Engine
        yield f"data: {json.dumps({'status': 'processing', 'progress': 65, 'step': 'visual', 'message': 'Rendering visual slide decks and caption layouts...' })}\n\n"
        
        slide_paths = []
        try:
            for i, scene in enumerate(storyboard['scenes']):
                # Render Pillow layout
                slide_path = generate_slide_image(
                    scene_num=i+1,
                    total_scenes=len(storyboard['scenes']),
                    title=storyboard['original_title_translated'],
                    headline=scene['headline_translated'],
                    narration=scene['narration_translated'],
                    keywords=scene['keywords'],
                    language=language
                )
                slide_paths.append(slide_path)
                
                total_scenes = len(storyboard['scenes'])
                yield f"data: {json.dumps({'status': 'processing', 'progress': 65 + int(15 * (i+1)/total_scenes), 'step': 'visual', 'message': f'Rendered infographic frame for Scene {i+1} of {total_scenes}' })}\n\n"
        except Exception as e:
            cleanup_temp_files(audio_paths + slide_paths)
            yield f"data: {json.dumps({'status': 'error', 'message': f'Visual layout rendering failed: {str(e)}' })}\n\n"
            return

        # 5. Video Compile & Stitching
        yield f"data: {json.dumps({'status': 'processing', 'progress': 85, 'step': 'compile', 'message': 'Compiling, aligning voice tracks, and stitching final MP4 output...' })}\n\n"
        
        try:
            video_filename = f"output_{uuid.uuid4().hex[:12]}.mp4"
            video_path = f"static/output/{video_filename}"
            
            compile_video(slide_paths, audio_paths, video_path)
            
            # Update dur on scenes metadata
            for idx, scene in enumerate(storyboard['scenes']):
                scene['duration'] = round(scene_durations[idx], 1)
            
            # Prepare result package
            result_payload = {
                'video_url': f"/static/output/{video_filename}",
                'original_title': storyboard['original_title'],
                'language_name': LANGUAGES[language]['name'],
                'summary_points': storyboard['summary_points_en'],
                'translated_points': storyboard['summary_points_translated'],
                'scenes': storyboard['scenes']
            }
            
            # Clean up temporary assets
            cleanup_temp_files(slide_paths + audio_paths)
            
            yield f"data: {json.dumps({'status': 'success', 'progress': 100, 'result': result_payload })}\n\n"
            
        except Exception as e:
            cleanup_temp_files(audio_paths + slide_paths)
            yield f"data: {json.dumps({'status': 'error', 'message': f'Video Assembly Compiler failed: {str(e)}' })}\n\n"
            return

    return Response(event_stream(), mimetype='text/event-stream')

def pibTextValidator(text):
    return text and len(text.strip()) >= 100

if __name__ == '__main__':
    app.run(debug=True)
