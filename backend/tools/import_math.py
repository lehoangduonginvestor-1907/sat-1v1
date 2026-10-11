import os
import re
import sys
import json
import glob
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

# Đọc đáp án Math từ các file Answer Key và gộp vào pdf_bank.json
# (một trong các nguồn đầu vào của build_bank.py).

answer_key_dir = r'D:\Question Bank (Unformatted)\Answer Keys\Math'
questions_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'pdf_bank.json')

RW_SECTION = 'Reading and Writing'
MATH_SECTION = 'Math'


def find_numbers(text):
    # "either 7, 8, or 13" -> ["7", "8", "13"]; "3,540" -> ["3540"]
    text = re.sub(r'(?<=\d),(?=\d{3}\b)', '', text)
    return re.findall(r'-?(?:\d+\.?\d*|\.\d+)(?:/\d+)?', text)


def parse_answer(block):
    """Trả về (type, correctAnswer | acceptedAnswers) hoặc None nếu không đọc được."""
    m = re.search(r'Correct Answer:\s*\n(.*?)\n(?:Rationale|Question Difficulty:|Assessment)', block, re.S)
    if m:
        raw = m.group(1).strip()
        if re.fullmatch(r'[A-D]', raw):
            return 'mcq', ord(raw) - ord('A')
        # "3.44, 86/25" -> ["3.44", "86/25"]
        return 'spr', [a.strip() for a in raw.split(',') if a.strip()]

    # Một số câu không có trường "Correct Answer" -> suy ra từ phần Rationale
    m = re.search(r'Choice ([A-D]) is correct', block)
    if m:
        return 'mcq', ord(m.group(1)) - ord('A')

    m = re.search(r'The correct answer is (.*?)\.(?=\s+[A-Z])', block, re.S)
    if m:
        answers = find_numbers(m.group(1))
        # "Note that 9/2 and 4.5 are examples of ways to enter a correct answer."
        note = re.search(r'Note that\s+(.{1,150}?)\s+(?:are|is)\s+(?:examples?|an example)\s+of\s+ways?\s+to\s+enter', block, re.S)
        if note:
            answers += find_numbers(note.group(1))
        if answers:
            return 'spr', list(dict.fromkeys(answers))

    return None


def parse_answer_key(path):
    # Domain/Skill lấy từ đường dẫn, giống cách làm với phần Reading and Writing
    domain = os.path.basename(os.path.dirname(path))
    skill = re.sub(r'\s+\d+\s+Answer Key\.pdf$', '', os.path.basename(path), flags=re.IGNORECASE)

    text = '\n'.join(page.get_text() for page in pymupdf.open(path))
    questions, failed = [], []

    for block in re.split(r'Question ID ', text)[1:]:
        q_id = block[:8]
        parsed = parse_answer(block)
        if not parsed:
            failed.append(q_id)
            continue

        diff_match = re.search(r'Question Difficulty:\s*\n(Easy|Medium|Hard)', block)
        q_type, answer = parsed
        q = {
            'id': q_id,
            'section': MATH_SECTION,
            'domain': domain,
            'skill': skill,
            # None: PDF không ghi độ khó, build_bank.py lấy từ nguồn khác
            'difficulty': diff_match.group(1) if diff_match else None,
            'type': q_type,
            'passage': '',
            'question': '',
        }
        if q_type == 'mcq':
            q['options'] = ['', '', '', '']
            q['correctAnswer'] = answer
        else:
            q['options'] = []
            q['acceptedAnswers'] = answer
        questions.append(q)

    return questions, failed


def main():
    with open(questions_path, encoding='utf-8') as f:
        bank = json.load(f)

    # Giữ nguyên phần R&W (gắn section nếu chưa có), thay toàn bộ phần Math
    rw = [q for q in bank if q.get('section', RW_SECTION) == RW_SECTION]
    for q in rw:
        q.setdefault('section', RW_SECTION)
        q.setdefault('type', 'mcq')

    math, failed = [], []
    for path in sorted(glob.glob(os.path.join(answer_key_dir, '**', '*.pdf'), recursive=True)):
        qs, bad = parse_answer_key(path)
        math += qs
        failed += bad

    # Bỏ câu trùng ID (một câu có thể nằm ở nhiều file)
    math = list({q['id']: q for q in math}.values())

    with open(questions_path, 'w', encoding='utf-8') as f:
        json.dump(rw + math, f, ensure_ascii=False, indent=2)

    n_spr = sum(1 for q in math if q['type'] == 'spr')
    print(f"R&W: {len(rw)} | Math: {len(math)} ({len(math) - n_spr} MCQ, {n_spr} SPR)")
    if failed:
        print(f"Không đọc được đáp án ({len(failed)}): {', '.join(failed)}")


if __name__ == '__main__':
    main()
