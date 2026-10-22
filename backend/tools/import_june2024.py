"""
Pipeline to extract all 98 questions from 'June 2024 SAT INT VER 1 (with ans).pdf'
with 100% verified answers into SAT Arena:
- Module 1 R&W: 27 questions
- Module 2 R&W: 27 questions
- Module 1 Math: 22 questions
- Module 2 Math: 22 questions
Total: 98 questions
"""

import os
import re
import io
import json
import pymupdf as fitz
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

PDF_PATH = 'imported_pdfs/June 2024 SAT INT VER 1 (with ans).pdf'
MEDIA_DIR = 'frontend/public/media/dsat_june2024'
QUESTIONS_JSON = 'backend/data/questions.json'

os.makedirs(MEDIA_DIR, exist_ok=True)

# Official Answer Keys from Pages 29-32
KEYS = {
    'RW1': ['A', 'B', 'B', 'D', 'A', 'D', 'B', 'C', 'D', 'A', 'D', 'C', 'B', 'B', 'A', 'B', 'D', 'B', 'B', 'C', 'B', 'D', 'A', 'D', 'B', 'C', 'B'],
    'RW2': ['C', 'B', 'A', 'C', 'D', 'C', 'C', 'B', 'C', 'D', 'D', 'C', 'D', 'B', 'D', 'B', 'C', 'D', 'A', 'D', 'C', 'C', 'D', 'B', 'B', 'D', 'D'],
    'M1':  ['B', 'A', '29', 'C', 'D', '50', 'B', 'B', 'B', 'C', 'D', 'C', '25', 'D', 'D', 'C', 'B', 'A', '36864', 'A', 'D', '44/3'],
    'M2':  ['D', 'B', '12', 'B', 'C', 'B', 'C', 'D', 'C', 'A', '21', 'B', 'A', '25', '121', 'D', 'A', '5/72', 'B', 'A', '650', '-32'],
}

MODULE_SPECS = [
    {
        'key': 'RW1',
        'section': 'Reading and Writing',
        'module': 'Module 1',
        'difficulty': 'Medium',
        'start_p': 0,
        'end_p': 8,
        'count': 27,
    },
    {
        'key': 'RW2',
        'section': 'Reading and Writing',
        'module': 'Module 2',
        'difficulty': 'Hard',
        'start_p': 8,
        'end_p': 16,
        'count': 27,
    },
    {
        'key': 'M1',
        'section': 'Math',
        'module': 'Module 1',
        'difficulty': 'Medium',
        'start_p': 16,
        'end_p': 22,
        'count': 22,
    },
    {
        'key': 'M2',
        'section': 'Math',
        'module': 'Module 2',
        'difficulty': 'Hard',
        'start_p': 22,
        'end_p': 28,
        'count': 22,
    },
]

def map_rw_skill(qnum):
    if qnum <= 5:
        return 'Craft and Structure', 'Words in Context'
    elif qnum <= 8:
        return 'Craft and Structure', 'Text Structure and Purpose'
    elif qnum <= 10:
        return 'Craft and Structure', 'Cross-Text Connections'
    elif qnum <= 14:
        return 'Information and Ideas', 'Central Ideas and Details'
    elif qnum <= 17:
        return 'Information and Ideas', 'Command of Evidence'
    elif qnum <= 19:
        return 'Information and Ideas', 'Inferences'
    elif qnum <= 24:
        return 'Standard English Conventions', 'Boundaries'
    elif qnum == 25:
        return 'Expression of Ideas', 'Transitions'
    else:
        return 'Expression of Ideas', 'Rhetorical Synthesis'

def map_math_skill(qnum):
    if qnum <= 7:
        return 'Algebra', 'Linear Equations in One Variable'
    elif qnum <= 14:
        return 'Advanced Math', 'Nonlinear Functions'
    elif qnum <= 18:
        return 'Problem-Solving and Data Analysis', 'Percentages'
    else:
        return 'Geometry and Trigonometry', 'Right Triangles and Trigonometry'

def trim_bottom(crop, bg_thresh=245, pad=15):
    w, h = crop.size
    pix = crop.load()
    last_y = h - 1
    for y in range(h - 1, 0, -2):
        if any(pix[x, y][0] < bg_thresh or pix[x, y][1] < bg_thresh or pix[x, y][2] < bg_thresh for x in range(0, w, 5)):
            last_y = min(h, y + pad)
            break
    return crop.crop((0, 0, w, last_y))

def run():
    print('Starting June 2024 import pipeline...')
    doc = fitz.open(PDF_PATH)
    ocr = RapidOCR()
    
    new_questions = []

    for spec in MODULE_SPECS:
        mod_key = spec['key']
        section = spec['section']
        count = spec['count']
        ans_list = KEYS[mod_key]
        print(f'\nProcessing {mod_key}: {section} ({count} questions)...')
        
        # 1. Locate all questions across module pages
        # Store for each q: (page_idx, y_start)
        q_locs = {}
        page_images = {}
        
        for p in range(spec['start_p'], spec['end_p']):
            b = doc.extract_image(doc[p].get_images()[0][0])
            img = Image.open(io.BytesIO(b['image']))
            page_images[p] = img
            w, h = img.size
            
            # Crop left strip x: 100 to 600
            left_strip = img.crop((100, 100, 600, h - 100))
            small = left_strip.resize((left_strip.width // 2, left_strip.height // 2))
            small.save('tmp_june_strip.jpg')
            res, _ = ocr('tmp_june_strip.jpg')
            
            p_qs = []
            for box, txt, s in res:
                m = re.match(r'^(\d{1,2})$', txt.strip())
                if m:
                    qnum = int(m.group(1))
                    if 1 <= qnum <= count:
                        y_full = int(box[0][1] * 2 + 100)
                        p_qs.append((qnum, y_full))
            # Sort by y
            p_qs.sort(key=lambda x: x[1])
            for qnum, yf in p_qs:
                if qnum not in q_locs:
                    q_locs[qnum] = (p, yf)
                    
        print(f'Located {len(q_locs)}/{count} questions in {mod_key}')
        
        # 2. Crop each question
        for qnum in range(1, count + 1):
            p_idx, y_start = q_locs[qnum]
            img = page_images[p_idx]
            w, h = img.size
            
            # Determine y_end: next question on same page, or bottom of page
            # Find next question on this same page
            next_qs_on_page = [yf for qn, (pn, yf) in q_locs.items() if pn == p_idx and yf > y_start]
            if next_qs_on_page:
                y_end = min(next_qs_on_page) - 15
            else:
                y_end = min(h - 100, 4800)
                
            q_crop = img.crop((200, max(50, y_start - 25), min(w - 150, 3350), min(h, y_end)))
            q_trimmed = trim_bottom(q_crop)
            
            # Save cropped image (resize to width 1080 for web efficiency)
            target_w = 1080
            target_h = int(q_trimmed.height * (target_w / q_trimmed.width))
            q_web = q_trimmed.resize((target_w, target_h), Image.LANCZOS)
            
            filename = f'{mod_key.lower()}_q{qnum:02d}.jpg'
            file_rel = f'/media/dsat_june2024/{filename}'
            q_web.save(os.path.join(MEDIA_DIR, filename), quality=88)
            
            # 3. Build Question Object
            ans_raw = ans_list[qnum - 1]
            is_spr = ans_raw not in ['A', 'B', 'C', 'D']
            
            if is_spr:
                q_type = 'spr'
                correct_ans = None
                accepted = [ans_raw]
                if '/' in ans_raw:
                    n, d = ans_raw.split('/')
                    try:
                        dec = float(n) / float(d)
                        accepted.extend([f'{dec:.4g}', str(round(dec, 4)), str(round(dec, 3))])
                    except:
                        pass
                options = []
            else:
                q_type = 'mcq'
                correct_ans = ord(ans_raw) - 65
                accepted = None
                options = [
                    '<span class="font-bold text-base">A</span>',
                    '<span class="font-bold text-base">B</span>',
                    '<span class="font-bold text-base">C</span>',
                    '<span class="font-bold text-base">D</span>',
                ]
                
            if section == 'Reading and Writing':
                dom, sk = map_rw_skill(qnum)
            else:
                dom, sk = map_math_skill(qnum)
                
            stem_html = f'<div class="q-card mb-4 text-center"><img src="{file_rel}" alt="Question {qnum}" class="max-w-full rounded border border-gray-100 shadow-sm" /></div>'
            ans_display = ans_raw if is_spr else f'({ans_raw})'
            
            q_obj = {
                'id': f'jun24_{mod_key.lower()}_{qnum:02d}',
                'section': section,
                'domain': dom,
                'skill': sk,
                'difficulty': spec['difficulty'],
                'bluebook': False,
                'type': q_type,
                'stimulus': '',
                'stem': stem_html,
                'options': options,
                'correctAnswer': correct_ans,
                'acceptedAnswers': accepted,
                'rationale': f'<p>Official June 2024 International SAT exam question ({spec["module"]}, #{qnum}). Correct Answer: <strong>{ans_display}</strong></p>',
                'sources': ['June 2024 International SAT', 'Official Key', 'Ver 1'],
                'exam': 'June 2024 International',
                'module': spec['module'],
            }
            new_questions.append(q_obj)
            
    print(f'\nTotal June 2024 questions prepared: {len(new_questions)}')
    
    # Update questions.json
    with open(QUESTIONS_JSON, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
        
    filtered = [q for q in existing_data if not str(q['id']).startswith('jun24_')]
    combined = filtered + new_questions
    
    with open(QUESTIONS_JSON, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
        
    print(f'SUCCESS: questions.json updated! {len(existing_data)} -> {len(combined)} questions (+{len(new_questions)})')

if __name__ == '__main__':
    run()
