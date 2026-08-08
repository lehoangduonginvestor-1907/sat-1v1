import os
import glob
import pdfplumber
import pypdfium2 as pdfium
import re

pdf_dir = r'D:\Question Bank (Unformatted)'
out_dir = r'D:\web-sat-challenge\backend\data\images'

os.makedirs(out_dir, exist_ok=True)

# Find all PDF files in all subdirectories, but EXCLUDE Answer Keys
all_pdf_files = glob.glob(os.path.join(pdf_dir, '**', '*.pdf'), recursive=True)
pdf_files = [f for f in all_pdf_files if 'Answer Key' not in os.path.basename(f)]
print(f"Found {len(pdf_files)} Question PDF files (excluding Answer Keys).")

scale = 2
processed = 0

for path in pdf_files:
    print(f"Processing {os.path.basename(path)}...")
    try:
        with pdfplumber.open(path) as pdf_plumb:
            pdf_fium = pdfium.PdfDocument(path)
            
            for i, page in enumerate(pdf_plumb.pages):
                words = page.extract_words()
                
                id_word = None
                q_id = None
                
                for j, w in enumerate(words):
                    if w['text'] == 'ID:' and j + 1 < len(words):
                        q_id = words[j+1]['text']
                        q_id = re.sub(r'[^a-zA-Z0-9]', '', q_id)
                        id_word = w
                        break
                
                if not id_word or not q_id:
                    continue
                    
                crop_y_top = id_word['top']
                crop_y_px = int(crop_y_top * scale)
                
                page_img = pdf_fium[i].render(scale=scale).to_pil()
                width, height = page_img.size
                
                # Crop to the very bottom to guarantee nothing is cut off
                cropped_img = page_img.crop((0, max(0, crop_y_px - 10), width, height))
                
                out_path = os.path.join(out_dir, f"{q_id}.png")
                cropped_img.save(out_path)
                processed += 1
    except Exception as e:
        print(f"Error processing {path}: {e}")

print(f"Extraction complete. Processed {processed} questions.")
