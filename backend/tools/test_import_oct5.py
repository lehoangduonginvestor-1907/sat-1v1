import os
import re
import fitz
import json
from PIL import Image

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

def md_to_html(md_text):
    # Basic markdown to clean HTML
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
        
        # bold **text**
        l = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', l)
        # italic *text*
        l = re.sub(r'\*(.*?)\*', r'<em>\1</em>', l)
        # code `text`
        l = re.sub(r'`(.*?)`', r'<code>\1</code>', l)
        html_lines.append(l)
    return '\n'.join(html_lines)

def parse_oct5_md():
    with open('de_chua_co_dap_an/DSAT Oct 5, INT A W.md', encoding='utf-8') as f:
        text = f.read()
        
    modules = re.split(r'## SECTION \d+: (?:READING AND WRITING|MATH) — (MODULE \d+)', text)
    data = {'rw1': {}, 'rw2': {}, 'm1': {}, 'm2': {}}
    
    # 1: rw1, 3: rw2, 5: m1, 7: m2
    mod_keys = ['rw1', 'rw2', 'm1', 'm2']
    for idx, mk in enumerate(mod_keys):
        mod_idx = idx * 2 + 2
        mod_text = modules[mod_idx]
        qs = re.split(r'### Câu (\d+)', mod_text)
        for q_i in range(1, len(qs), 2):
            q_num = int(qs[q_i])
            q_body = qs[q_i+1]
            
            # answer
            m_ans = re.search(r'-\s*\*\*Đáp án(?: đúng)?:\*\*\s*(?:\*\*)?([A-D0-9./\-]+)', q_body)
            raw_ans = m_ans.group(1).strip() if m_ans else ''
            
            # type
            is_spr = raw_ans not in ['A', 'B', 'C', 'D']
            
            data[mk][q_num] = {
                'raw_ans': raw_ans,
                'is_spr': is_spr,
                'expl_html': md_to_html(q_body)
            }
    return data

if __name__ == '__main__':
    data = parse_oct5_md()
    print('Parsed Oct 5:')
    for k, v in data.items():
        sprs = [q for q, d in v.items() if d['is_spr']]
        print(f'  {k}: {len(v)} questions. SPRs: {sprs}')
