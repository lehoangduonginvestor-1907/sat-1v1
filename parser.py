import os
import fitz  # PyMuPDF
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Tải API key từ file .env
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env")
    exit(1)

client = genai.Client(api_key=API_KEY)

system_instruction = """Bạn là một chuyên gia phân tích dữ liệu giáo dục. Nhiệm vụ của bạn là nhận diện nội dung từ hình ảnh của một câu hỏi thi Digital SAT và chuyển nó thành cấu trúc JSON.
Bạn phải tuân thủ nghiêm ngặt định dạng JSON sau:
{
  "question_id": "Mã ID câu hỏi (nếu có, ví dụ e312081b)",
  "domain": "Domain của câu hỏi (ví dụ Advanced Math)",
  "skill": "Kỹ năng (ví dụ Equivalent expressions)",
  "difficulty": "Độ khó (ví dụ Easy, Medium, Hard dựa trên số ô vuông, 1 ô = Easy, 2 ô = Medium, 3 ô = Hard)",
  "question_text": "Nội dung câu hỏi. Vui lòng chuyển tất cả công thức toán học thành mã LaTeX (bọc trong dấu $$ hoặc $).",
  "options": {
    "A": "Nội dung đáp án A",
    "B": "Nội dung đáp án B",
    "C": "Nội dung đáp án C",
    "D": "Nội dung đáp án D"
  }
}
Lưu ý: Chỉ trả về đoạn mã JSON hợp lệ, không chứa bất kỳ ký tự nào khác (không bọc trong markdown ```json). Nếu câu hỏi không phải trắc nghiệm (Grid-in), phần options để null.
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
                    "Hãy trích xuất câu hỏi trong ảnh này thành JSON.", 
                    types.Part.from_bytes(data=img_data, mime_type='image/png')
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1
                )
            )
            
            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:-3].strip()
                
            parsed_data = json.loads(json_str)
            results.append(parsed_data)
            
            # Tránh Rate limit (Free tier của Gemini giới hạn 5 req/phút)
            print("  Đợi 15 giây để tránh Rate Limit...", flush=True)
            time.sleep(15) 
            
        except Exception as e:
            print(f"  Error at page {page_num + 1}: {str(e)}", flush=True)
            
    return results

if __name__ == "__main__":
    # Ví dụ chạy thử với 1 file
    test_file = r"D:\Question Bank (Unformatted)\Math\Advanced Math\Equivalent Expressions\Equivalent Expressions 1.pdf"
    
    if os.path.exists(test_file):
        data = process_pdf_file(test_file)
        
        with open("output_test.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print("Done. Result saved to output_test.json", flush=True)
    else:
        print("Test file not found.", flush=True)
