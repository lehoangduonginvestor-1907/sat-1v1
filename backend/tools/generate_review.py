import os
import random

image_dir = r'D:\web-sat-challenge\backend\data\images'
output_html = r'D:\web-sat-challenge\review_50_cau.html'

images = [f for f in os.listdir(image_dir) if f.endswith('.png')]

if len(images) > 50:
    sample = random.sample(images, 50)
else:
    sample = images

html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Review 50 Random Questions</title>
    <style>
        body { font-family: sans-serif; background: #f0f0f0; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .card { background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .card img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        h3 { text-align: center; color: #333; }
    </style>
</head>
<body>
    <h1>Review 50 Random Questions</h1>
    <div class="grid">
"""

for img in sample:
    html_content += f"""
        <div class="card">
            <h3>{img}</h3>
            <img src="backend/data/images/{img}" alt="{img}" />
        </div>
    """

html_content += """
    </div>
</body>
</html>
"""

with open(output_html, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated {output_html} with {len(sample)} images.")
