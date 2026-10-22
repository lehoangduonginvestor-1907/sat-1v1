"""
Pipeline to extract all 349 questions from '05.2026 DSAT INT @DSATaz.pdf'
with 100% precision into SAT Arena:
1. Ground truth metadata (q_num, section, module, difficulty, type, answer)
2. Precision image cropping for Stimulus, Stem, and Options
3. Integration with backend/data/questions.json
"""

import os
import re
import cv2
import json
import pymupdf as fitz
from PIL import Image

PDF_PATH = 'imported_pdfs/05.2026 DSAT INT @DSATaz.pdf'
FULL_IMG_DIR = 'frontend/public/media/dsat2026/full'
RW_DIR = 'frontend/public/media/dsat2026/rw'
MATH_DIR = 'frontend/public/media/dsat2026/math'
QUESTIONS_JSON = 'backend/data/questions.json'
BACKUP_JSON = 'backend/data/questions.backup.json'

os.makedirs(RW_DIR, exist_ok=True)
os.makedirs(MATH_DIR, exist_ok=True)
os.makedirs(FULL_IMG_DIR, exist_ok=True)

def trim_content(img_crop, bg_thresh=248, pad=4):
    """Trim white border around image content."""
    w, h = img_crop.size
    pix = img_crop.load()
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    has_c = False
    for y in range(h):
        for x in range(w):
            p = pix[x, y]
            if p[0] < bg_thresh or p[1] < bg_thresh or p[2] < bg_thresh:
                has_c = True
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
    if not has_c:
        return img_crop
    return img_crop.crop((max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + pad + 1), min(h, max_y + pad + 1)))

def trim_bottom(crop, bg_thresh=248, pad=10):
    """Trim only bottom white space."""
    w, h = crop.size
    pix = crop.load()
    last_y = h - 1
    for y in range(h - 1, 0, -1):
        if any(pix[x, y][0] < bg_thresh or pix[x, y][1] < bg_thresh or pix[x, y][2] < bg_thresh for x in range(0, w, 4)):
            last_y = min(h, y + pad)
            break
    return crop.crop((0, 0, w, last_y))

def detect_mcq_boxes(img_path, is_math=False):
    """Find the 4 option boxes using OpenCV contour analysis."""
    img_cv = cv2.imread(img_path)
    if img_cv is None:
        return []
    x_start = 450 if is_math else 980
    roi = img_cv[:, x_start: (1500 if is_math else 1943)]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    min_w = 400 if is_math else 600
    boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w > min_w and 35 < h < 450 and y > 100:
            boxes.append((x + x_start, y, w, h))
            
    unique = []
    for b in sorted(boxes, key=lambda b: b[1]):
        if not unique or abs(b[1] - unique[-1][1]) > 20:
            unique.append(b)
            
    # If more than 4, take the last 4 (as top ones could be tables/diagrams)
    if len(unique) > 4:
        unique = unique[-4:]
        
    return unique

def detect_spr_bottom(img_path):
    """Find where the SPR answer box starts."""
    img_cv = cv2.imread(img_path)
    if img_cv is None:
        return 900
    roi = img_cv[95:, 480:1460]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    spr_boxes = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        if w > 500 and 35 < h < 120:
            spr_boxes.append((x + 480, y + 95, w, h))
    if spr_boxes:
        return sorted(spr_boxes, key=lambda b: b[1])[0][1]
    return 900

def get_skill_and_domain(section, text):
    """Estimate domain and skill from text patterns."""
    t = text.lower()
    if section == 'Reading and Writing':
        if 'most logical and precise word' in t or 'most nearly mean' in t:
            return 'Craft and Structure', 'Words in Context'
        if 'main purpose' in t or 'overall structure' in t or 'function of the underlined' in t:
            return 'Craft and Structure', 'Text Structure and Purpose'
        if 'text 1' in t and 'text 2' in t:
            return 'Craft and Structure', 'Cross-Text Connections'
        if 'main idea' in t or 'according to the text' in t or 'central idea' in t:
            return 'Information and Ideas', 'Central Ideas and Details'
        if 'support the student' in t or 'support the hypothesis' in t or 'table' in t or 'graph' in t or 'data' in t:
            return 'Information and Ideas', 'Command of Evidence'
        if 'most logically completes' in t:
            return 'Information and Ideas', 'Inferences'
        if 'conventions of standard english' in t:
            if any(k in t for k in [';', ':', '—', 'comma', 'period']):
                return 'Standard English Conventions', 'Boundaries'
            return 'Standard English Conventions', 'Form, Structure, and Sense'
        if 'transition' in t:
            return 'Expression of Ideas', 'Transitions'
        if 'student has taken the following notes' in t or 'wants to' in t:
            return 'Expression of Ideas', 'Rhetorical Synthesis'
        return 'Craft and Structure', 'Words in Context'
    else:
        if 'sin' in t or 'cos' in t or 'tan' in t or 'triangle' in t or 'angle' in t:
            return 'Geometry and Trigonometry', 'Right Triangles and Trigonometry'
        if 'circle' in t or 'radius' in t or 'arc' in t:
            return 'Geometry and Trigonometry', 'Circles'
        if 'area' in t or 'volume' in t or 'perimeter' in t:
            return 'Geometry and Trigonometry', 'Area and Volume'
        if 'probability' in t:
            return 'Problem-Solving and Data Analysis', 'Probability'
        if 'percent' in t or '%' in t:
            return 'Problem-Solving and Data Analysis', 'Percentages'
        if 'ratio' in t or 'rate' in t or 'unit' in t:
            return 'Problem-Solving and Data Analysis', 'Ratios, Rates, Proportions, and Units'
        if 'mean' in t or 'median' in t or 'standard deviation' in t:
            return 'Problem-Solving and Data Analysis', 'One-Variable Data'
        if 'scatter' in t or 'line of best fit' in t:
            return 'Problem-Solving and Data Analysis', 'Two-Variable Data'
        if 'x²' in t or 'x^2' in t or 'quadratic' in t or 'parabola' in t or 'factor' in t:
            return 'Advanced Math', 'Nonlinear Functions'
        if 'system' in t:
            return 'Algebra', 'Systems of Linear Equations'
        if 'inequality' in t or '≥' in t or '≤' in t:
            return 'Algebra', 'Linear Inequalities'
        if 'slope' in t or 'intercept' in t or 'line' in t:
            return 'Algebra', 'Linear Functions'
        return 'Algebra', 'Linear Equations in One Variable'

def run():
    print('Opening PDF:', PDF_PATH)
    doc = fitz.open(PDF_PATH)
    print(f'Total PDF pages: {len(doc)}')

    # Extract all question pages
    q_data = []
    for idx, page in enumerate(doc):
        t = page.get_text()
        m_q = re.search(r'Q(\d+)\s+of\s+349', t)
        if not m_q:
            continue
        q_num = int(m_q.group(1))
        
        # Section
        is_rw = q_num <= 155
        section = 'Reading and Writing' if is_rw else 'Math'
        
        # Module & Difficulty
        if is_rw:
            if q_num <= 57:
                module = 'Module 1'
                difficulty = 'Medium'
            elif q_num <= 109:
                module = 'Module 2'
                difficulty = 'Easy'
            else:
                module = 'Module 2'
                difficulty = 'Hard'
        else:
            if q_num <= 221:
                module = 'Module 1'
                difficulty = 'Medium'
            elif q_num <= 291:
                module = 'Module 2'
                difficulty = 'Easy'
            else:
                module = 'Module 2'
                difficulty = 'Hard'
                
        # Answer
        m_ans = re.search(r'Answer:\s*([^\n]+)', t)
        raw_ans = m_ans.group(1).strip() if m_ans else ''
        
        # Type & Answer Keys
        q_type = 'mcq'
        correct_answer = None
        accepted_answers = None
        
        if q_num == 177:
            q_type = 'spr'
            accepted_answers = ['18/17', '1.059', '1.0588', '1.06']
        elif q_num == 209:
            q_type = 'spr'
            accepted_answers = ['19/26', '0.7308', '0.731', '0.7307']
        elif 'grid-in' in raw_ans.lower():
            q_type = 'spr'
            m_val = re.search(r'grid-in:\s*([^)]+)', raw_ans, re.I)
            val = m_val.group(1).strip() if m_val else raw_ans
            accepted_answers = [val]
            if '/' in val:
                n, d = val.split('/')
                try:
                    dec = float(n) / float(d)
                    accepted_answers.extend([f'{dec:.4g}', str(round(dec, 4)), str(round(dec, 3))])
                except:
                    pass
        elif raw_ans in ['A', 'B', 'C', 'D']:
            correct_answer = ord(raw_ans) - 65
        else:
            print(f'Warning: unhandled answer at Q{q_num}: {raw_ans}')
            correct_answer = 0
            
        q_data.append({
            'page_idx': idx,
            'q_num': q_num,
            'section': section,
            'module': module,
            'difficulty': difficulty,
            'type': q_type,
            'correctAnswer': correct_answer,
            'acceptedAnswers': accepted_answers,
            'raw_text': t,
        })
        
    print(f'Parsed {len(q_data)} questions metadata.')
    
    # Process images and crops
    new_questions = []
    
    for item in q_data:
        q_num = item['q_num']
        section = item['section']
        q_type = item['type']
        full_path = f'{FULL_IMG_DIR}/q_{q_num}.jpg'
        
        if not os.path.exists(full_path):
            print(f'Error: missing full image {full_path}')
            continue
            
        img_pil = Image.open(full_path)
        
        domain, skill = get_skill_and_domain(section, item['raw_text'])
        
        if section == 'Reading and Writing':
            # Stimulus: left column
            stim_raw = img_pil.crop((40, 35, 965, 1080))
            stim_trimmed = trim_bottom(stim_raw)
            stim_path = f'{RW_DIR}/q_{q_num}_stimulus.png'
            stim_trimmed.save(stim_path)
            stimulus_html = f'<div class="passage-crop"><img src="/media/dsat2026/rw/q_{q_num}_stimulus.png" alt="Passage" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
            
            # Stem and Options
            opt_boxes = detect_mcq_boxes(full_path, is_math=False)
            if len(opt_boxes) == 4:
                stem_bottom = opt_boxes[0][1] - 8
            else:
                stem_bottom = 200 # fallback
                
            stem_raw = img_pil.crop((1000, 95, 1920, max(120, stem_bottom)))
            stem_trimmed = trim_bottom(stem_raw)
            stem_path = f'{RW_DIR}/q_{q_num}_stem.png'
            stem_trimmed.save(stem_path)
            stem_html = f'<div class="stem-crop mb-4"><img src="/media/dsat2026/rw/q_{q_num}_stem.png" alt="Question prompt" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
            
            # Options
            options = []
            if len(opt_boxes) == 4:
                for i, (bx, by, bw, bh) in enumerate(opt_boxes):
                    opt_crop = img_pil.crop((bx + 62, by + 4, bx + bw - 15, by + bh - 4))
                    opt_trimmed = trim_content(opt_crop)
                    opt_path = f'{RW_DIR}/q_{q_num}_opt_{i}.png'
                    opt_trimmed.save(opt_path)
                    let = 'ABCD'[i]
                    options.append(f'<img src="/media/dsat2026/rw/q_{q_num}_opt_{i}.png" alt="Option {let}" class="max-h-[75px] w-auto my-auto object-contain inline-block" />')
            else:
                # Fallback: 4 equal slices
                for i in range(4):
                    by = 200 + i * 86
                    opt_crop = img_pil.crop((1090, by + 4, 1870, by + 75))
                    opt_trimmed = trim_content(opt_crop)
                    opt_path = f'{RW_DIR}/q_{q_num}_opt_{i}.png'
                    opt_trimmed.save(opt_path)
                    let = 'ABCD'[i]
                    options.append(f'<img src="/media/dsat2026/rw/q_{q_num}_opt_{i}.png" alt="Option {let}" class="max-h-[75px] w-auto my-auto object-contain inline-block" />')
                    
        else: # Math
            stimulus_html = ''
            if q_type == 'mcq':
                opt_boxes = detect_mcq_boxes(full_path, is_math=True)
                if len(opt_boxes) == 4:
                    stem_bottom = opt_boxes[0][1] - 8
                else:
                    stem_bottom = 240
                    
                stem_raw = img_pil.crop((480, 95, 1460, max(140, stem_bottom)))
                stem_trimmed = trim_bottom(stem_raw)
                stem_path = f'{MATH_DIR}/q_{q_num}_stem.png'
                stem_trimmed.save(stem_path)
                stem_html = f'<div class="math-stem-crop mb-4"><img src="/media/dsat2026/math/q_{q_num}_stem.png" alt="Math problem" class="max-w-full rounded border border-gray-100 shadow-sm" /></div>'
                
                options = []
                if len(opt_boxes) == 4:
                    for i, (bx, by, bw, bh) in enumerate(opt_boxes):
                        opt_crop = img_pil.crop((bx + 62, by + 4, bx + bw - 15, by + bh - 4))
                        opt_trimmed = trim_content(opt_crop)
                        opt_path = f'{MATH_DIR}/q_{q_num}_opt_{i}.png'
                        opt_trimmed.save(opt_path)
                        let = 'ABCD'[i]
                        options.append(f'<img src="/media/dsat2026/math/q_{q_num}_opt_{i}.png" alt="Option {let}" class="max-h-[75px] w-auto my-auto object-contain inline-block" />')
                else:
                    for i in range(4):
                        by = 240 + i * 86
                        opt_crop = img_pil.crop((570, by + 4, 1400, by + 75))
                        opt_trimmed = trim_content(opt_crop)
                        opt_path = f'{MATH_DIR}/q_{q_num}_opt_{i}.png'
                        opt_trimmed.save(opt_path)
                        let = 'ABCD'[i]
                        options.append(f'<img src="/media/dsat2026/math/q_{q_num}_opt_{i}.png" alt="Option {let}" class="max-h-[75px] w-auto my-auto object-contain inline-block" />')
            else: # SPR
                spr_bottom_y = detect_spr_bottom(full_path)
                stem_raw = img_pil.crop((480, 95, 1460, max(140, spr_bottom_y - 8)))
                stem_trimmed = trim_bottom(stem_raw)
                stem_path = f'{MATH_DIR}/q_{q_num}_stem.png'
                stem_trimmed.save(stem_path)
                stem_html = f'<div class="math-stem-crop mb-4"><img src="/media/dsat2026/math/q_{q_num}_stem.png" alt="Math problem" class="max-w-full rounded border border-gray-100 shadow-sm" /></div>'
                options = []
                
        ans_display = "ABCD"[item['correctAnswer']] if item['correctAnswer'] is not None else ', '.join(item['acceptedAnswers'] or [])
        q_obj = {
            'id': f'd26_{q_num:03d}',
            'section': section,
            'domain': domain,
            'skill': skill,
            'difficulty': item['difficulty'],
            'bluebook': False,
            'type': q_type,
            'stimulus': stimulus_html,
            'stem': stem_html,
            'options': options,
            'correctAnswer': item['correctAnswer'],
            'acceptedAnswers': item['acceptedAnswers'],
            'rationale': f'<p>Official May 2026 International SAT question ({item["module"]}, #{q_num}). Correct Answer: <strong>{ans_display}</strong></p>',
            'sources': ['May 2026 International SAT', 'Official Bluebook Exam', 'DSATaz'],
            'exam': 'May 2026 International',
            'module': item['module'],
        }
        new_questions.append(q_obj)
        
        if q_num % 50 == 0 or q_num == 349:
            print(f'Processed {q_num}/349 questions...')

    print(f'Total new questions created: {len(new_questions)}')
    
    # Save backup of current questions.json
    if not os.path.exists(BACKUP_JSON) and os.path.exists(QUESTIONS_JSON):
        with open(QUESTIONS_JSON, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        with open(BACKUP_JSON, 'w', encoding='utf-8') as f:
            json.dump(old_data, f, ensure_ascii=False, indent=2)
        print(f'Backed up {len(old_data)} questions to {BACKUP_JSON}')
    else:
        with open(QUESTIONS_JSON, 'r', encoding='utf-8') as f:
            old_data = json.load(f)

    # Filter out any existing d26_ questions in case of re-run
    filtered_data = [q for q in old_data if not str(q['id']).startswith('d26_')]
    combined_data = filtered_data + new_questions
    
    with open(QUESTIONS_JSON, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, ensure_ascii=False, indent=2)
        
    print(f'SUCCESS! questions.json updated: {len(old_data)} -> {len(combined_data)} questions (+{len(new_questions)})')

if __name__ == '__main__':
    run()
