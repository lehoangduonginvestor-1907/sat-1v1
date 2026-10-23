import os
import sys
import re
import fitz
import json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

QUESTIONS_JSON = 'backend/data/questions.json'
MEDIA_DIR = 'frontend/public/media/dsat_oct24_formd'
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

def map_math_skill(qnum):
    if qnum <= 7:
        return 'Algebra', 'Linear Equations in One Variable'
    elif qnum <= 14:
        return 'Advanced Math', 'Nonlinear Functions'
    elif qnum <= 18:
        return 'Problem-Solving and Data Analysis', 'Percentages'
    else:
        return 'Geometry and Trigonometry', 'Right Triangles and Trigonometry'

def make_accepted_answers(raw_val):
    val = raw_val.strip()
    res = [val]
    if '/' in val:
        parts = val.split('/')
        try:
            n = float(parts[0])
            d = float(parts[1])
            dec = n / d
            res.extend([
                f"{dec:.4f}", f"{dec:.4f}".lstrip('0'),
                f"{dec:.3f}", f"{dec:.3f}".lstrip('0'),
                f"{round(dec, 4)}", f"{round(dec, 3)}"
            ])
        except:
            pass
    elif '.' in val:
        if val.startswith('0.'):
            res.append(val[1:])
        elif val.startswith('.'):
            res.append('0' + val)
    clean = []
    for a in res:
        a = a.strip()
        if a and a not in clean:
            clean.append(a)
    return clean

def run():
    print("Importing October 2024 SAT Form D (English + Math)...")
    
    # 1. Parse English
    with open('de_chua_co_dap_an/October SAT english (1).md', encoding='utf-8') as f:
        t_en = f.read()
    en_chains = re.findall(r'(\b1\.[A-D0-9].*?2[0-7]\.[A-D0-9].*?)(?:\n|$)', t_en)
    rw_answers = []
    for c in en_chains:
        raw_pairs = re.findall(r'(\d+)\s*[\.:]\s*([A-Za-z0-9./\-]+)', c)
        ans_map = {}
        for q_str, a_str in raw_pairs:
            ans = a_str.strip().strip('*').strip('`')
            if ans not in ['[Missing]', '[Khuyết]', 'Missing', 'N/A']:
                ans_map[int(q_str)] = ans
        rw_answers.append(ans_map)
        
    # Table explanations for RW
    rw_expls = {}
    rows = re.findall(r'\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*\*{0,2}([A-D0-9./\-]+)\*{0,2}\s*\|\s*([^|\n]+)', t_en)
    for qn, a, exp in rows:
        try:
            rw_expls[int(qn)] = exp.strip()
        except:
            pass

    # 2. Parse Math
    with open('de_chua_co_dap_an/October SAT math (1).md', encoding='utf-8') as f:
        t_m = f.read()
    m_chains = re.findall(r'(\b1\.[A-D0-9].*?2[0-2]\.[A-D0-9].*?)(?:\n|$)', t_m)
    m_answers = []
    for c in m_chains:
        raw_pairs = re.findall(r'(\d+)\s*[\.:]\s*([A-Za-z0-9./\-]+)', c)
        ans_map = {}
        for q_str, a_str in raw_pairs:
            ans = a_str.strip().strip('*').strip('`')
            if ans not in ['[Missing]', '[Khuyết]', 'Missing', 'N/A']:
                ans_map[int(q_str)] = ans
        m_answers.append(ans_map)
        
    m_expls = {}
    rows = re.findall(r'\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*\*{0,2}([A-D0-9./\-]+)\*{0,2}\s*\|\s*([^|\n]+)', t_m)
    for qn, a, exp in rows:
        try:
            m_expls[int(qn)] = exp.strip()
        except:
            pass

    exam_id = 'oct24_formd'
    exam_name = 'October 2024 SAT Form D'
    new_questions = []

    # Process English PDF
    doc_en = fitz.open('de_chua_co_dap_an/October SAT english (1).pdf')
    for m_idx, mk in enumerate(['rw1', 'rw2']):
        mod_label = f"Module {m_idx + 1}"
        start_p = 0 if m_idx == 0 else 27
        ans_map = rw_answers[m_idx] if m_idx < len(rw_answers) else {}
        for q_offset in range(27):
            q_num = q_offset + 1
            p_idx = start_p + q_offset
            if p_idx >= len(doc_en) or q_num not in ans_map:
                continue
                
            raw_ans = ans_map[q_num]
            pix = doc_en[p_idx].get_pixmap(dpi=130)
            img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            w, h = img.size
            
            domain, skill = map_rw_skill(q_num)
            stim_crop = img.crop((int(w * 0.02), int(h * 0.12), int(w * 0.495), int(h * 0.92)))
            stim_crop = trim_bottom(stim_crop)
            stim_file = f"{mk}_q{q_num:02d}_stim.jpg"
            stim_crop.save(os.path.join(MEDIA_DIR, stim_file), quality=82)
            stim_html = f'<div class="passage-crop"><img src="/media/dsat_{exam_id}/{stim_file}" alt="Passage" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
            
            stem_crop = img.crop((int(w * 0.505), int(h * 0.12), int(w * 0.98), int(h * 0.92)))
            stem_crop = trim_bottom(stem_crop)
            stem_file = f"{mk}_q{q_num:02d}_stem.jpg"
            stem_crop.save(os.path.join(MEDIA_DIR, stem_file), quality=82)
            stem_html = f'<div class="stem-crop mb-4"><img src="/media/dsat_{exam_id}/{stem_file}" alt="Question" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
            
            options = [
                '<span class="font-bold text-base">A</span>',
                '<span class="font-bold text-base">B</span>',
                '<span class="font-bold text-base">C</span>',
                '<span class="font-bold text-base">D</span>'
            ]
            ans_let = raw_ans[0] if raw_ans[0] in 'ABCD' else 'A'
            correct_ans = ord(ans_let) - 65
            
            expl = rw_expls.get(q_num, f"Official key: {raw_ans}")
            rationale_html = f"""<div class="rationale-box">
<p><strong>Official {exam_name} ({mod_label}, #{q_num})</strong></p>
<p><strong>Correct Answer:</strong> {raw_ans}</p>
<div class="mt-3 text-slate-700 leading-relaxed"><p>{expl}</p></div>
</div>"""
            
            new_questions.append({
                'id': f"{exam_id}_{mk}_{q_num:02d}",
                'section': 'Reading and Writing',
                'domain': domain,
                'skill': skill,
                'difficulty': 'Medium' if m_idx == 0 else 'Hard',
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
                'module': mod_label
            })

    # Process Math PDF
    doc_m = fitz.open('de_chua_co_dap_an/October SAT math (1).pdf')
    for m_idx, mk in enumerate(['m1', 'm2']):
        mod_label = f"Module {m_idx + 1}"
        start_p = 0 if m_idx == 0 else 22
        ans_map = m_answers[m_idx] if m_idx < len(m_answers) else {}
        for q_offset in range(22):
            q_num = q_offset + 1
            p_idx = start_p + q_offset
            if p_idx >= len(doc_m) or q_num not in ans_map:
                continue
                
            raw_ans = ans_map[q_num]
            is_spr = raw_ans not in ['A', 'B', 'C', 'D']
            
            pix = doc_m[p_idx].get_pixmap(dpi=130)
            img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            w, h = img.size
            
            domain, skill = map_math_skill(q_num)
            m_crop = img.crop((int(w * 0.18), int(h * 0.14), int(w * 0.82), int(h * 0.92)))
            m_crop = trim_bottom(m_crop)
            m_file = f"{mk}_q{q_num:02d}.jpg"
            m_crop.save(os.path.join(MEDIA_DIR, m_file), quality=82)
            
            stem_html = f'<div class="q-card mb-4 text-center"><img src="/media/dsat_{exam_id}/{m_file}" alt="Question" class="max-w-full rounded border border-gray-100 shadow-sm" /></div>'
            
            if is_spr:
                q_type = 'spr'
                correct_ans = None
                accepted_answers = make_accepted_answers(raw_ans)
                options = []
            else:
                q_type = 'mcq'
                correct_ans = ord(raw_ans[0]) - 65
                accepted_answers = None
                options = [
                    '<span class="font-bold text-base">A</span>',
                    '<span class="font-bold text-base">B</span>',
                    '<span class="font-bold text-base">C</span>',
                    '<span class="font-bold text-base">D</span>'
                ]
                
            expl = m_expls.get(q_num, f"Official key: {raw_ans}")
            rationale_html = f"""<div class="rationale-box">
<p><strong>Official {exam_name} ({mod_label}, #{q_num})</strong></p>
<p><strong>Correct Answer:</strong> {raw_ans}</p>
<div class="mt-3 text-slate-700 leading-relaxed"><p>{expl}</p></div>
</div>"""
            
            new_questions.append({
                'id': f"{exam_id}_{mk}_{q_num:02d}",
                'section': 'Math',
                'domain': domain,
                'skill': skill,
                'difficulty': 'Medium' if m_idx == 0 else 'Hard',
                'bluebook': False,
                'type': q_type,
                'stimulus': "",
                'stem': stem_html,
                'options': options,
                'correctAnswer': correct_ans,
                'acceptedAnswers': accepted_answers,
                'rationale': rationale_html,
                'sources': [exam_name, 'Official Bluebook Exam', 'Verified Key'],
                'exam': exam_name,
                'module': mod_label
            })

    print(f"Generated {len(new_questions)} questions for {exam_name}.")
    
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
        
    print(f"Added {added} new questions. Total bank: {len(bank)}")

if __name__ == '__main__':
    run()
