"""
Cắt lại ảnh câu hỏi June 2024 International SAT (frontend/public/media/dsat_june2024).

Bản cắt cũ trong import_june2024.py tìm số câu bằng OCR nên hay nhận nhầm số trên trục đồ thị
và không xử lý câu bị tràn sang trang sau. Ở đây mỗi câu được nhận ra nhờ thanh tiêu đề xám
(ô số câu màu đen bên trái), cắt từ thanh này tới thanh kế tiếp, nối các đoạn qua trang
và dừng ở khối xám lấp cuối module. Chỉ ghi lại ảnh, không đụng tới questions.json.

Chạy từ thư mục gốc repo: python backend/tools/recrop_june2024.py
"""

import io
import os

import numpy as np
import pymupdf as fitz
from PIL import Image

PDF_PATH = 'imported_pdfs/June 2024 SAT INT VER 1 (with ans).pdf'
MEDIA_DIR = 'frontend/public/media/dsat_june2024'
QUESTION_PAGES = range(0, 28)  # trang 28-31 là đáp án
MODULES = [('rw1', 27), ('rw2', 27), ('m1', 22), ('m2', 22)]

CONTENT_BOTTOM = 4830  # dưới đây là footer của tài liệu
CROP_X = (200, 3350)
TARGET_W = 1080


def load_page(doc, p):
    b = doc.extract_image(doc[p].get_images()[0][0])
    return Image.open(io.BytesIO(b['image'])).convert('RGB')


def classify_rows(gray):
    """Mỗi hàng: 'bar' (thanh tiêu đề câu), 'fill' (khối xám lấp), 'blank' hoặc 'ink'."""
    band = gray[:, 1000:3000]
    bar = ((band >= 222) & (band <= 238)).mean(1) > 0.85
    fill = ((band >= 240) & (band <= 250)).mean(1) > 0.85
    blank = (gray[:, CROP_X[0]:CROP_X[1]] > 250).mean(1) > 0.998  # cả bề ngang: đáp án ngắn nằm sát lề trái
    return np.where(bar, 'bar', np.where(fill, 'fill', np.where(blank, 'blank', 'ink')))


def runs(mask):
    out, start = [], None
    for y, v in enumerate(list(mask) + [False]):
        if v and start is None:
            start = y
        elif not v and start is not None:
            out.append((start, y))
            start = None
    return out


def find_headers(gray, rows):
    """Thanh tiêu đề: dải xám cao 50-100px, có ô số màu đen ở mép trái."""
    headers = []
    for y0, y1 in runs(rows == 'bar'):
        if not 50 <= y1 - y0 <= 100:
            continue
        badge = gray[y0:y1, 280:400]
        if (badge < 60).mean() > 0.5:
            headers.append(y0)
    return headers


def trim_blank(img, rows, y0, y1):
    """Bỏ hàng trắng ở hai đầu đoạn [y0, y1)."""
    while y0 < y1 and rows[y0] == 'blank':
        y0 += 1
    while y1 > y0 and rows[y1 - 1] == 'blank':
        y1 -= 1
    return (y0, y1) if y1 - y0 > 5 else None


def run():
    doc = fitz.open(PDF_PATH)
    pages, page_rows, events = {}, {}, []
    for p in QUESTION_PAGES:
        img = load_page(doc, p).crop((0, 0, 3509, CONTENT_BOTTOM))
        gray = np.asarray(img.convert('L')).astype(int)
        rows = classify_rows(gray)
        pages[p], page_rows[p] = img, rows
        events += [(p, y, 'header') for y in find_headers(gray, rows)]
        events += [(p, y0, 'fill') for y0, y1 in runs(rows == 'fill') if y1 - y0 > 150]
    events.sort()

    headers = [(p, y) for p, y, kind in events if kind == 'header']
    expected = sum(n for _, n in MODULES)
    if len(headers) != expected:
        raise SystemExit(f'Found {len(headers)} question headers, expected {expected}')

    names = [f'{key}_q{n:02d}.jpg' for key, count in MODULES for n in range(1, count + 1)]
    for i, (p, y) in enumerate(headers):
        # Kết thúc ở sự kiện kế tiếp (câu sau hoặc khối xám lấp cuối module)
        nxt = events[events.index((p, y, 'header')) + 1] if events[-1] != (p, y, 'header') else None
        end_p, end_y = (nxt[0], nxt[1]) if nxt else (max(QUESTION_PAGES), CONTENT_BOTTOM)
        parts = []
        for q in range(p, end_p + 1):
            y0 = y if q == p else 0
            y1 = end_y if q == end_p else CONTENT_BOTTOM
            seg = trim_blank(pages[q], page_rows[q], y0, y1)
            if seg:
                parts.append(pages[q].crop((CROP_X[0], seg[0], CROP_X[1], seg[1])))
        gap = 40
        out = Image.new('RGB', (CROP_X[1] - CROP_X[0], sum(im.height for im in parts) + gap * (len(parts) - 1)), 'white')
        top = 0
        for im in parts:
            out.paste(im, (0, top))
            top += im.height + gap
        out = out.resize((TARGET_W, round(out.height * TARGET_W / out.width)), Image.LANCZOS)
        out.save(os.path.join(MEDIA_DIR, names[i]), quality=88)
        print(f'{names[i]}: pages {p}-{end_p}, {out.height}px')


if __name__ == '__main__':
    run()
