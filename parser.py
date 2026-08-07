import os
import fitz  # PyMuPDF
import json
import time
import uuid
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

# Tải API key từ file .env
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env")
    exit(1)

client = genai.Client(api_key=API_KEY)

class Question(BaseModel):
    id: str
    domain: str
    skill: str
    passage: str
    question: str
    options: list[str]
    correctAnswer: int

system_instruction = """Bạn là một chuyên gia phân tích dữ liệu giáo dục và giải đề thi Digital SAT chuyên nghiệp.
Nhiệm vụ của bạn là nhận diện nội dung câu hỏi từ hình ảnh và trích xuất thành định dạng JSON theo đúng schema.
Nếu câu hỏi có chứa đáp án đúng được khoanh hoặc đánh dấu trong hình, hãy lấy đó làm correctAnswer (index từ 0 đến 3 cho A, B, C, D).
Nếu câu hỏi chưa có đáp án, bạn hãy TỰ GIẢI để tìm ra đáp án đúng và điền index của đáp án đó vào trường correctAnswer.
Lưu ý:
- "id" có thể lấy mã ID của câu hỏi ở góc màn hình. Nếu không có, hãy tạo 1 chuỗi ngẫu nhiên.
- "domain" và "skill" lấy từ context của câu hỏi (Ví dụ: Math, Advanced Math).
- "passage" là phần ngữ cảnh hoặc đoạn văn. Đối với câu hỏi toán học, nếu không có đoạn văn, hãy lấy phần bối cảnh, hoặc để chuỗi rỗng.
- Chuyển tất cả công thức toán học thành mã LaTeX (bọc trong dấu $ hoặc $$).
- Mảng "options" chứa 4 đáp án dạng chuỗi (KHÔNG bao gồm chữ cái A., B., C., D. ở đầu mỗi chuỗi). 
- Nếu là câu điền đáp án (Grid-in) không có trắc nghiệm, trả về mảng rỗng [] và correctAnswer = 0.
"""

def extract_page_to_image(pdf_path, page_num):
    doc = fitz.open(pdf_path)
    page = doc.load_page(page_num)
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Phóng to 2x để rõ nét
    
    img_data = pix.tobytes("png")
    return img_data

def process_pdf_file(pdf_path):
    print(f"Processing file: {pdf_path}", flush=True)
    doc = fitz.open(pdf_path)
    results = []
    
    for page_num in range(len(doc)):
        print(f"  Parsing page {page_num + 1}/{len(doc)}...", flush=True)
        try:
            img_data = extract_page_to_image(pdf_path, page_num)
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    "Hãy trích xuất và giải câu hỏi trong ảnh này thành mảng JSON theo đúng định dạng. Lưu ý 1 trang có thể có nhiều câu hỏi.", 
                    types.Part.from_bytes(data=img_data, mime_type='image/png')
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=list[Question]
                )
            )
            
            json_str = response.text.strip()
            parsed_data = json.loads(json_str)
            
            # Gán UUID cho những câu không có ID
            for item in parsed_data:
                if not item.get("id") or item["id"] == "string":
                    item["id"] = str(uuid.uuid4())[:8]
            
            results.extend(parsed_data)
            
            # Tránh Rate limit
            print("  Đợi 15 giây để tránh Rate Limit (5 req/min)...", flush=True)
            time.sleep(15) 
            
        except Exception as e:
            print(f"  Error at page {page_num + 1}: {str(e)}", flush=True)
            
    return results

if __name__ == "__main__":
    test_file = r"D:\Question Bank (Unformatted)\Math\Advanced Math\Equivalent Expressions\Equivalent Expressions 1.pdf"
    
    if os.path.exists(test_file):
        data = process_pdf_file(test_file)
        
        # Đảm bảo thư mục backend/data tồn tại
        os.makedirs(r"D:\web-sat-challenge\backend\data", exist_ok=True)
        out_path = r"D:\web-sat-challenge\backend\data\questions.json"
        
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"\nDone! Parsed {len(data)} questions successfully.")
        print(f"Result saved to: {out_path}", flush=True)
    else:
        print("Test file not found.", flush=True)
