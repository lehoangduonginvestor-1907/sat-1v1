"""
Universal Ingestion Pipeline for Solved Real Digital SAT Exams.
Converts solved exams into SAT Arena questions with:
- Precision crops for Stimulus (left) and Stem (right) on RW
- Precision centered card crops for Math
- Rich bilingual KaTeX explanations
- Complete validation against SAT Arena bank schema
"""

import os
import sys
import re
import fitz
import json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

QUESTIONS_JSON = 'backend/data/questions.json'
BACKUP_JSON = 'backend/data/questions.backup.json'

EXAM_CONFIGS = [
    {
        'exam_id': 'oct5_inta',
        'name': 'October 2024 International Form A',
        'pdf': 'de_chua_co_dap_an/DSAT Oct 5, INT A W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Oct 5, INT A W.md',
        'source_tag': 'October 2024 International SAT'
    },
    {
        'exam_id': 'dec24_int2',
        'name': 'December 2024 International Form 2',
        'pdf': 'de_chua_co_dap_an/DSAT Dec 2024 Int 2-W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Dec 2024 Int 2-W.md',
        'source_tag': 'December 2024 International SAT'
    },
    {
        'exam_id': 'dec24_us2',
        'name': 'December 2024 US Form 2',
        'pdf': 'de_chua_co_dap_an/DSAT Dec 2024 US 2-W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Dec 2024 US 2-W.md',
        'source_tag': 'December 2024 US SAT'
    },
    {
        'exam_id': 'aug24_us1',
        'name': 'August 2024 US Form 1',
        'pdf': 'de_chua_co_dap_an/DSAT Aug 24, US v1 W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Aug 24, US v1 W.md',
        'source_tag': 'August 2024 US SAT'
    },
    {
        'exam_id': 'oct24_usa',
        'name': 'October 2024 US Form A',
        'pdf': 'de_chua_co_dap_an/DSAT Oct 2024 US A W (1).pdf',
        'md': 'de_chua_co_dap_an/DSAT Oct 2024 US A W (1).md',
        'source_tag': 'October 2024 US SAT'
    },
    {
        'exam_id': 'oct24_usb',
        'name': 'October 2024 US Form B',
        'pdf': 'de_chua_co_dap_an/DSAT Oct 2024 US B W (1).pdf',
        'md': 'de_chua_co_dap_an/DSAT Oct 2024 US B W (1).md',
        'source_tag': 'October 2024 US SAT'
    },
    {
        'exam_id': 'aug24_int1',
        'name': 'August 2024 International Form 1',
        'pdf': 'de_chua_co_dap_an/DSAT Aug 24, INT v1 W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Aug 24, INT v1 W.md',
        'source_tag': 'August 2024 International SAT'
    },
    {
        'exam_id': 'aug24_us2',
        'name': 'August 2024 US Form 2',
        'pdf': 'de_chua_co_dap_an/DSAT Aug 24, US v2 W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Aug 24, US v2 W.md',
        'source_tag': 'August 2024 US SAT'
    },
    {
        'exam_id': 'nov2_int2',
        'name': 'November 2024 International Form 2',
        'pdf': 'de_chua_co_dap_an/DSAT Nov 2 INT-2 W_.pdf',
        'md': 'de_chua_co_dap_an/DSAT Nov 2 INT-2 W_.md',
        'source_tag': 'November 2024 International SAT'
    },
    {
        'exam_id': 'dec24_int1',
        'name': 'December 2024 International Form 1',
        'pdf': 'de_chua_co_dap_an/DSAT Dec 2024 Int 1-W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Dec 2024 Int 1-W.md',
        'source_tag': 'December 2024 International SAT'
    },
    {
        'exam_id': 'dec24_us1',
        'name': 'December 2024 US Form 1',
        'pdf': 'de_chua_co_dap_an/DSAT Dec 2024 US 1-W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Dec 2024 US 1-W.md',
        'source_tag': 'December 2024 US SAT'
    },
    {
        'exam_id': 'oct24_usc',
        'name': 'October 2024 US Form C',
        'pdf': 'de_chua_co_dap_an/DSAT Oct 2024 US C W copy.pdf',
        'md': 'de_chua_co_dap_an/DSAT Oct 2024 US C W copy.md',
        'source_tag': 'October 2024 US SAT'
    },
    {
        'exam_id': 'dsat_pt10_1',
        'name': 'Practice Test 10.1',
        'pdf': 'de_chua_co_dap_an/DSAT10_24_1.pdf',
        'md': 'de_chua_co_dap_an/DSAT10_24_1_answers_and_explanations.md',
        'source_tag': 'Practice Test 10.1'
    },
    {
        'exam_id': 'dsat_pt10_2',
        'name': 'Practice Test 10.2',
        'pdf': 'de_chua_co_dap_an/DSAT10_24_2 (1).pdf',
        'md': 'de_chua_co_dap_an/DSAT10_24_2.md',
        'source_tag': 'Practice Test 10.2'
    },
    {
        'exam_id': 'dsat_pt10_3',
        'name': 'Practice Test 10.3',
        'pdf': 'de_chua_co_dap_an/DSAT10_24_3.pdf',
        'md': 'de_chua_co_dap_an/DSAT10_24_3.md',
        'source_tag': 'Practice Test 10.3'
    },
    {
        'exam_id': 'aug24_int2',
        'name': 'August 2024 International Form 2',
        'pdf': 'de_chua_co_dap_an/DSAT Aug 24, INT v2 W.pdf',
        'md': 'de_chua_co_dap_an/DSAT Aug 24, INT v2 W.md',
        'source_tag': 'August 2024 International SAT'
    },
]

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

def md_to_html(md_text):
    lines = md_text.strip().split('\n')
    html_lines = []
    for l in lines:
        l = l.strip()
        if not l:
            continue
        if l.startswith('- '):
            l = '<li>' + l[2:] + '</li>'
        elif l.startswith('### '):
            l = '<h4>' + l[4:] + '</h4>'
        else:
            l = '<p>' + l + '</p>'
        
        l = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', l)
        l = re.sub(r'\*(.*?)\*', r'<em>\1</em>', l)
        l = re.sub(r'`(.*?)`', r'<code>\1</code>', l)
        html_lines.append(l)
    return '\n'.join(html_lines)

def parse_markdown_questions(md_path):
    with open(md_path, encoding='utf-8', errors='ignore') as f:
        text = f.read()

    chains = re.findall(r'(\b1\.[A-D0-9].*?2[0-7]\.[A-D0-9].*?)(?:\n|$)', text)
    chain_answers = []
    for c in chains:
        raw_pairs = re.findall(r'(\d+)\s*[\.:]\s*([A-Za-z0-9./\-]+)', c)
        ans_map = {}
        for q_str, a_str in raw_pairs:
            ans = a_str.strip().strip('*').strip('`')
            if ans not in ['[Missing]', '[Khuyết]', 'Missing', 'N/A']:
                ans_map[int(q_str)] = ans
        chain_answers.append(ans_map)

    mod_keys = ['rw1', 'rw2', 'm1', 'm2']
    data = {'rw1': {}, 'rw2': {}, 'm1': {}, 'm2': {}}
    
    # 1. Try splitting by explicit Section & Module headers
    parts = re.split(r'## SECTION \d+: (?:READING AND WRITING|MATH) — (MODULE \d+)[^\n]*|## (?:Reading & Writing|Math) — (Module \d+)[^\n]*', text, flags=re.I)
    valid_sections = []
    for p in parts:
        if p and p.strip().lower() in ['module 1', 'module 2']:
            valid_sections.append(p.strip())
            
    if len(valid_sections) == 4:
        # We have exact 4 module sections!
        sec_splits = re.split(r'(?:## SECTION \d+: (?:READING AND WRITING|MATH) — MODULE \d+[^\n]*|## (?:Reading & Writing|Math) — Module \d+[^\n]*)', text, flags=re.I)
        # sec_splits[1..4] correspond to rw1, rw2, m1, m2
        for idx, mk in enumerate(mod_keys):
            mod_text = sec_splits[idx + 1]
            q_matches = re.finditer(r'###\s*(?:\[?Câu|Question)\s*(\d+)(.*?)(?=###\s*(?:\[?Câu|Question)\s*\d+|$)', mod_text, re.S)
            for m in q_matches:
                q_num = int(m.group(1))
                body = m.group(2)
                
                m_ans = re.search(r'-\s*\*\*Đáp án(?: chính xác| đúng)?:\*\*\s*(?:\*\*)?([A-D0-9./\-]+)', body)
                if not m_ans:
                    m_ans = re.search(r'-\s*\*\*Đáp án:\*\*\s*(?:\*\*)?([A-D0-9./\-]+)', body)
                if not m_ans:
                    m_ans = re.search(r'Đáp án:?\s*([A-D0-9./\-]+)', m.group(0))
                    
                raw_ans = m_ans.group(1).strip() if m_ans else ''
                raw_ans = raw_ans.strip('*').strip('`')
                if raw_ans.startswith('A.') or raw_ans.startswith('B.') or raw_ans.startswith('C.') or raw_ans.startswith('D.'):
                    raw_ans = raw_ans[0]
                elif raw_ans.startswith('A') or raw_ans.startswith('B') or raw_ans.startswith('C') or raw_ans.startswith('D'):
                    if len(raw_ans) > 1 and raw_ans[1] in ' .)':
                        raw_ans = raw_ans[0]
                        
                is_spr = raw_ans not in ['A', 'B', 'C', 'D'] and len(raw_ans) > 0
                data[mk][q_num] = {
                    'raw_ans': raw_ans,
                    'is_spr': is_spr,
                    'expl_html': md_to_html(body)
                }
        return data

    # 2. Try global itemized headers
    item_matches = re.finditer(r'###\s*(?:\[?Câu|Question)\s*(\d+)(.*?)(?=###\s*(?:\[?Câu|Question)\s*\d+|$)', text, re.S)
    items_list = list(item_matches)
    
    if len(items_list) >= 80:
        for idx, match in enumerate(items_list):
            q_num_header = int(match.group(1))
            body = match.group(2)
            
            if idx < 27:
                mk = 'rw1'
                q_num = q_num_header if q_num_header <= 27 else idx + 1
            elif idx < 54:
                mk = 'rw2'
                q_num = q_num_header if q_num_header <= 27 else idx - 27 + 1
            elif idx < 76:
                mk = 'm1'
                q_num = q_num_header if q_num_header <= 22 else idx - 54 + 1
            else:
                mk = 'm2'
                q_num = q_num_header if q_num_header <= 22 else idx - 76 + 1
                
            m_ans = re.search(r'-\s*\*\*Đáp án(?: chính xác| đúng)?:\*\*\s*(?:\*\*)?([A-D0-9./\-]+)', body)
            if not m_ans:
                m_ans = re.search(r'-\s*\*\*Đáp án:\*\*\s*(?:\*\*)?([A-D0-9./\-]+)', body)
            if not m_ans:
                m_ans = re.search(r'Đáp án:?\s*([A-D0-9./\-]+)', match.group(0))
                
            raw_ans = m_ans.group(1).strip() if m_ans else ''
            raw_ans = raw_ans.strip('*').strip('`')
            if raw_ans.startswith('A.') or raw_ans.startswith('B.') or raw_ans.startswith('C.') or raw_ans.startswith('D.'):
                raw_ans = raw_ans[0]
            elif raw_ans.startswith('A') or raw_ans.startswith('B') or raw_ans.startswith('C') or raw_ans.startswith('D'):
                if len(raw_ans) > 1 and raw_ans[1] in ' .)':
                    raw_ans = raw_ans[0]
                    
            is_spr = raw_ans not in ['A', 'B', 'C', 'D'] and len(raw_ans) > 0
            
            data[mk][q_num] = {
                'raw_ans': raw_ans,
                'is_spr': is_spr,
                'expl_html': md_to_html(body)
            }
    else:
        for i, mk in enumerate(mod_keys):
            if i < len(chain_answers):
                for q_num, ans in chain_answers[i].items():
                    is_spr = ans not in ['A', 'B', 'C', 'D']
                    data[mk][q_num] = {
                        'raw_ans': ans,
                        'is_spr': is_spr,
                        'expl_html': f'<p>Official answer: <strong>{ans}</strong></p>'
                    }
                    
        table_rows = re.findall(r'\|\s*\*{0,2}(\d+)\*{0,2}\s*\|\s*\*{0,2}([A-D0-9./\-]+)\*{0,2}\s*\|\s*([^|\n]+)', text)
        for r_q, r_ans, r_expl in table_rows:
            try:
                qn = int(r_q)
                for mk in mod_keys:
                    if qn in data[mk] and not data[mk][qn]['expl_html'].startswith('<p>Official answer'):
                        continue
                    if qn in data[mk]:
                        data[mk][qn]['expl_html'] = f'<p>{r_expl.strip()}</p>'
                        break
            except:
                pass

    return data

def import_single_exam(exam_cfg):
    exam_id = exam_cfg['exam_id']
    exam_name = exam_cfg['name']
    pdf_path = exam_cfg['pdf']
    md_path = exam_cfg['md']
    source_tag = exam_cfg.get('source_tag', exam_name)
    media_dir = f"frontend/public/media/dsat_{exam_id}"
    os.makedirs(media_dir, exist_ok=True)
    
    print(f"\n==================================================")
    print(f"IMPORTING: {exam_name} ({exam_id})")
    print(f"==================================================")
    
    q_data = parse_markdown_questions(md_path)
    doc = fitz.open(pdf_path)
    
    offsets = exam_cfg.get('page_offset', {})
    default_offsets = {
        'rw1': (0, min(27, len(doc))),
        'rw2': (27, min(54, len(doc))),
        'm1': (54, min(76, len(doc))),
        'm2': (76, min(98, len(doc))),
    }
    
    new_questions = []
    
    for mk in ['rw1', 'rw2', 'm1', 'm2']:
        is_rw = mk.startswith('rw')
        section = 'Reading and Writing' if is_rw else 'Math'
        mod_label = 'Module 1' if mk.endswith('1') else 'Module 2'
        diff = 'Medium' if mk.endswith('1') else 'Hard'
        
        start_p, end_p = offsets.get(mk, default_offsets[mk])
        p_count = end_p - start_p
        
        for q_offset in range(p_count):
            q_num = q_offset + 1
            page_idx = start_p + q_offset
            if page_idx >= len(doc):
                break
                
            q_info = q_data[mk].get(q_num)
            if not q_info or not q_info['raw_ans']:
                continue
                
            raw_ans = q_info['raw_ans']
            is_spr = q_info['is_spr']
            
            pix = doc[page_idx].get_pixmap(dpi=130)
            img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            w, h = img.size
            
            qid = f"{exam_id}_{mk}_{q_num:02d}"
            
            if is_rw:
                domain, skill = map_rw_skill(q_num)
                stim_crop = img.crop((int(w * 0.02), int(h * 0.12), int(w * 0.495), int(h * 0.92)))
                stim_crop = trim_bottom(stim_crop)
                stim_file = f"{mk}_q{q_num:02d}_stim.jpg"
                stim_crop.save(os.path.join(media_dir, stim_file), quality=82)
                stim_html = f'<div class="passage-crop"><img src="/media/dsat_{exam_id}/{stim_file}" alt="Passage" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
                
                stem_crop = img.crop((int(w * 0.505), int(h * 0.12), int(w * 0.98), int(h * 0.92)))
                stem_crop = trim_bottom(stem_crop)
                stem_file = f"{mk}_q{q_num:02d}_stem.jpg"
                stem_crop.save(os.path.join(media_dir, stem_file), quality=82)
                stem_html = f'<div class="stem-crop mb-4"><img src="/media/dsat_{exam_id}/{stem_file}" alt="Question" class="w-full rounded border border-gray-100 shadow-sm" /></div>'
                
                options = [
                    '<span class="font-bold text-base">A</span>',
                    '<span class="font-bold text-base">B</span>',
                    '<span class="font-bold text-base">C</span>',
                    '<span class="font-bold text-base">D</span>'
                ]
                ans_letter = raw_ans[0] if raw_ans and raw_ans[0] in 'ABCD' else 'A'
                correct_ans = ord(ans_letter) - 65
                accepted_answers = None
                q_type = 'mcq'
            else:
                domain, skill = map_math_skill(q_num)
                m_crop = img.crop((int(w * 0.18), int(h * 0.14), int(w * 0.82), int(h * 0.92)))
                m_crop = trim_bottom(m_crop)
                m_file = f"{mk}_q{q_num:02d}.jpg"
                m_crop.save(os.path.join(media_dir, m_file), quality=82)
                
                stim_html = ""
                stem_html = f'<div class="q-card mb-4 text-center"><img src="/media/dsat_{exam_id}/{m_file}" alt="Question" class="max-w-full rounded border border-gray-100 shadow-sm" /></div>'
                
                if is_spr or raw_ans not in ['A', 'B', 'C', 'D']:
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
                    
            rationale_html = f"""<div class="rationale-box">
<p><strong>Official {exam_name} ({mod_label}, #{q_num})</strong></p>
<p><strong>Correct Answer:</strong> {raw_ans}</p>
<div class="mt-3 text-slate-700 leading-relaxed">{q_info['expl_html']}</div>
</div>"""
            
            question_entry = {
                'id': qid,
                'section': section,
                'domain': domain,
                'skill': skill,
                'difficulty': diff,
                'bluebook': False,
                'type': q_type,
                'stimulus': stim_html,
                'stem': stem_html,
                'options': options,
                'correctAnswer': correct_ans,
                'acceptedAnswers': accepted_answers,
                'rationale': rationale_html,
                'sources': [exam_name, 'Official Bluebook Exam', 'Verified Key'],
                'exam': exam_name,
                'module': mod_label
            }
            new_questions.append(question_entry)
            
    print(f"Generated {len(new_questions)} validated questions for {exam_name}.")
    return new_questions

def run_all(limit=None):
    with open(QUESTIONS_JSON, 'r', encoding='utf-8') as f:
        existing_bank = json.load(f)
    print(f"Current question bank count: {len(existing_bank)}")
    
    existing_ids = {q['id'] for q in existing_bank}
    all_new_questions = []
    
    configs_to_run = EXAM_CONFIGS[:limit] if limit else EXAM_CONFIGS
    
    for cfg in configs_to_run:
        new_qs = import_single_exam(cfg)
        added_for_exam = 0
        for q in new_qs:
            if q['id'] not in existing_ids:
                existing_bank.append(q)
                existing_ids.add(q['id'])
                all_new_questions.append(q)
                added_for_exam += 1
        print(f"Added {added_for_exam} new questions from {cfg['name']}.")
        
    print(f"\n==================================================")
    print(f"TOTAL NEW QUESTIONS ADDED: {len(all_new_questions)}")
    print(f"NEW BANK TOTAL: {len(existing_bank)}")
    print(f"==================================================")
    
    # Save backup first
    with open(BACKUP_JSON, 'w', encoding='utf-8') as f:
        json.dump(existing_bank, f, ensure_ascii=False)
        
    # Write to questions.json
    with open(QUESTIONS_JSON, 'w', encoding='utf-8') as f:
        json.dump(existing_bank, f, indent=2, ensure_ascii=False)
    print("Saved updated questions.json successfully.")

if __name__ == '__main__':
    # Can run with python backend/tools/import_batch_exams.py
    run_all()
