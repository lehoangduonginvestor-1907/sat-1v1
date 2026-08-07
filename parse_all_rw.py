import os
import re
import json
import sys
import pdfplumber

sys.stdout.reconfigure(encoding='utf-8')

def clean_text(text):
    if not text:
        return ""
    # Thay thế nhiều dòng trống hoặc khoảng trắng thừa
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_pdf_file(file_path):
    # Xác định Domain và Skill từ đường dẫn
    parts = file_path.split(os.sep)
    domain = parts[-2] if len(parts) >= 2 else "Reading and Writing"
    filename = os.path.basename(file_path)
    skill = re.sub(r'\s+\d+\s+Answer Key\.pdf$', '', filename, flags=re.IGNORECASE)
    
    questions = []
    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = '\n'.join([p.extract_text() for p in pdf.pages if p.extract_text()])
            
            blocks = re.split(r'Question ID\s+', full_text)[1:]
            for block in blocks:
                q_id_match = re.search(r'^([a-f0-9]+)', block)
                if not q_id_match:
                    continue
                q_id = q_id_match.group(1)
                
                # Correct Answer
                corr_ans_match = re.search(r'Correct Answer:\s*\n?\s*([A-D])', block)
                corr_ans = ord(corr_ans_match.group(1)) - ord('A') if corr_ans_match else 0
                
                # Tách phần trước options
                a_match = re.search(r'\n\s*A\.\s+', block)
                if not a_match:
                    continue
                
                body_text = block[block.find(q_id) + len(q_id):a_match.start()].strip()
                
                # Lọc bỏ phần Header table
                body_text = re.sub(r'Assessment\s+Test\s+Domain\s+Skill\s+Difficulty.*?\n', '', body_text, flags=re.DOTALL)
                body_text = re.sub(r'SAT\s+Reading and Writing.*?\n', '', body_text, flags=re.DOTALL)
                body_text = re.sub(r'^ID:\s*[a-f0-9]+\s*', '', body_text, flags=re.MULTILINE).strip()
                
                lines = [l.strip() for l in body_text.split('\n') if l.strip()]
                
                q_start_idx = -1
                for idx, line in enumerate(lines):
                    if re.match(r'^(Which|Based|According|What|In the|The author|As used|With|How|Why|Select|Complete)', line, re.IGNORECASE):
                        q_start_idx = idx
                        break
                
                if q_start_idx != -1:
                    passage = ' '.join(lines[:q_start_idx])
                    question = ' '.join(lines[q_start_idx:])
                else:
                    passage = ' '.join(lines[:-1]) if len(lines) > 1 else ''
                    question = lines[-1] if lines else ''
                
                # Options
                opts_match = re.findall(r'([A-D])\.\s+(.*?)(?=\n[A-D]\.|\nID:|\nCorrect Answer:|\nRationale|\Z)', block, re.DOTALL)
                options = [clean_text(o[1]) for o in opts_match[:4]]
                
                if len(options) == 4:
                    questions.append({
                        "id": q_id,
                        "domain": domain,
                        "skill": skill,
                        "passage": passage.strip(),
                        "question": question.strip(),
                        "options": options,
                        "correctAnswer": corr_ans
                    })
    except Exception as e:
        print(f"Error parsing {filename}: {e}")
        
    return questions

def main():
    root_dir = r"D:\Question Bank (Unformatted)\Answer Keys\Reading and Writing"
    all_questions = []
    
    print("Bắt đầu trích xuất toàn bộ Ngân hàng câu hỏi Reading & Writing...")
    count_files = 0
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".pdf"):
                full_path = os.path.join(root, file)
                qs = parse_pdf_file(full_path)
                all_questions.extend(qs)
                count_files += 1
                print(f"[{count_files}/30] Đã xử lý {file}: Trích xuất được {len(qs)} câu.")
                
    output_path = r"D:\web-sat-challenge\backend\data\questions.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, ensure_ascii=False, indent=2)
        
    print(f"\n🎉 HOÀN THÀNH! Tổng cộng trích xuất được {len(all_questions)} câu hỏi Reading & Writing.")
    print(f"Dữ liệu đã được lưu thành công vào: {output_path}")

if __name__ == "__main__":
    main()
