import os
import sys
import re
import fitz
import json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

QUESTIONS_JSON = 'backend/data/questions.json'
MEDIA_DIR = 'frontend/public/media/dsat_apr25'
os.makedirs(MEDIA_DIR, exist_ok=True)

def trim_bottom(crop, bg_thresh=242, pad=10):
    w, h = crop.size
    pix = crop.load()
    last_y = h - 1
    for y in range(h - 1, 0, -2):
        if any(pix[x, y][0] < bg_thresh or pix[x, y][1] < bg_thresh or pix[x, y][2] < bg_thresh for x in range(0, w, 4)):
            last_y = min(h, y + pad)
            break
    return crop.crop((0, 0, w, last_y))

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

def run():
    with open('de_chua_co_dap_an/dsat-3rd-april-2025_compress.md', encoding='utf-8') as f:
        t = f.read()

    rows = re.findall(r'\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*\*{0,2}([A-D0-9./\-]+)\*{0,2}\s*\|\s*([^|\n]+)', t)
    print(f'Parsed {len(rows)} questions from April 2025 leak.')
    
    doc = fitz.open('de_chua_co_dap_an/dsat-3rd-april-2025_compress.pdf')
    print(f'PDF has {len(doc)} pages.')
    
    exam_id = 'apr25_leak'
    exam_name = 'April 2025 Prediction Leak'
    
    new_questions = []
    for q_str, ans_str, expl in rows:
        q_num = int(q_str)
        p_idx = q_num - 1
        if p_idx >= len(doc):
            break
            
        pix = doc[p_idx].get_pixmap(dpi=130)
        img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        w, h = img.size
        
        domain, skill = map_rw_skill(q_num)
        stim_crop = img.crop((int(w * 0.02), int(h * 0.12), int(w * 0.495), int(h * 0.92)))
        stim_crop = trim_bottom(stim_crop)
        stim_file = f"rw2_q{q_num:02d}_stim.jpg"
        stim_crop.save(os.path.join(MEDIA_DIR, stim_file), quality=82)
        stim_html = f'<div class="passage-crop"><img src="/media/dsat_{exam_id}/{stim_file}" alt="Passage" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
        
        stem_crop = img.crop((int(w * 0.505), int(h * 0.12), int(w * 0.98), int(h * 0.92)))
        stem_crop = trim_bottom(stem_crop)
        stem_file = f"{mk if 'mk' in locals() else 'rw2'}_q{q_num:02d}_stem.jpg"
        stem_crop.save(os.path.join(MEDIA_DIR, stem_file), quality=82)
        stem_html = f'<div class="stem-crop mb-4"><img src="/media/dsat_{exam_id}/{stem_file}" alt="Question" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
        
        options = [
            '<span class="font-bold text-base">A</span>',
            '<span class="font-bold text-base">B</span>',
            '<span class="font-bold text-base">C</span>',
            '<span class="font-bold text-base">D</span>'
        ]
        ans_let = ans_str[0] if ans_str[0] in 'ABCD' else 'A'
        correct_ans = ord(ans_let) - 65
        
        rationale_html = f"""<div class="rationale-box">
<p><strong>Official {exam_name} (Module 2, #{q_num})</strong></p>
<p><strong>Correct Answer:</strong> {ans_str}</p>
<div class="mt-3 text-slate-700 leading-relaxed"><p>{expl.strip()}</p></div>
</div>"""

        new_questions.append({
            'id': f"{exam_id}_rw2_{q_num:02d}",
            'section': 'Reading and Writing',
            'domain': domain,
            'skill': skill,
            'difficulty': 'Hard',
            'bluebook': False,
            'type': 'mcq',
            'stimulus': stim_html,
            'stem': stem_html,
            'options': options,
            'correctAnswer': correct_ans,
            'acceptedAnswers': None,
            'rationale': rationale_html,
            'sources': [exam_name, 'Official Bluebook Exam', 'Verified Key'],
            'exam': exam_name,
            'module': 'Module 2'
        })
        
    print(f'Generated {len(new_questions)} questions.')
    bank = json.load(open(QUESTIONS_JSON, encoding='utf-8'))
    existing_ids = {q['id'] for q in bank}
    added = 0
    for q in new_questions:
        if q['id'] not in existing_ids:
            bank.append(q)
            existing_ids.add(q['id'])
            added += 1
            
    with open(QUESTIONS_JSON, 'w', encoding='utf-8') as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)
    print(f'Added {added} new questions. Total bank: {len(bank)}')

if __name__ == '__main__':
    run()
