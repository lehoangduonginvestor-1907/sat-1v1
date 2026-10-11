import io
import os
import sys
import json
import tarfile
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

# Tải các bộ dữ liệu College Board Question Bank công khai trên GitHub về data/sources/
# (thư mục này bị .gitignore). Ghim theo commit để build_bank.py luôn cho ra cùng kết quả.

SOURCES_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'sources')

MDN522 = ('mdn522/sat-question-bank', 'e373c75b59ad5e0551c38127a6aeb73f96980469')
CBQB = ('emingurbuz9483/SAT-CBQB', '0c52d54dbdf09d3c93d8e94965907dd18072a917')
GIRFF = ('Girff/sat-website', '8a69fb0cbebb6770b23d9d16f0c82f77f033faa1')


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(url) as res, open(dest, 'wb') as f:
        f.write(res.read())
    print(f'  {os.path.relpath(dest, SOURCES_DIR)}')


def fetch_mdn522():
    # Bản JSON gốc từ API của Question Bank (9/2024), có cờ "live" = câu nằm trong đề Bluebook
    repo, sha = MDN522
    for name in ['cb-digital-questions.json', 'lookup.json']:
        download(f'https://raw.githubusercontent.com/{repo}/{sha}/data/{name}', os.path.join(SOURCES_DIR, 'mdn522', name))


def fetch_cbqb():
    # Bản trích từ PDF export mới (đã loại câu Bluebook), kèm hình và sprite công thức
    repo, sha = CBQB
    out = os.path.join(SOURCES_DIR, 'cbqb')
    if os.path.exists(os.path.join(out, 'questions.json')):
        return
    with urllib.request.urlopen(f'https://codeload.github.com/{repo}/tar.gz/{sha}') as res:
        archive = tarfile.open(fileobj=io.BytesIO(res.read()), mode='r:gz')
    for member in archive.getmembers():
        # <repo>-<sha>/data/... -> cbqb/...
        parts = member.name.split('/', 2)
        if len(parts) < 3 or parts[1] != 'data' or not member.isfile():
            continue
        dest = os.path.join(out, parts[2])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with archive.extractfile(member) as src, open(dest, 'wb') as f:
            f.write(src.read())
    print('  cbqb/ (questions.json, math/questions.json, figures, sprites)')


def fetch_girff():
    # Chỉ dùng để đối chiếu đáp án (không biết câu nào là PSAT/đề Bluebook nên không đưa vào kho)
    repo, sha = GIRFF
    out = os.path.join(SOURCES_DIR, 'girff')
    index_path = os.path.join(out, 'index.json')
    download(f'https://raw.githubusercontent.com/{repo}/{sha}/public/data/index.json', index_path)
    with open(index_path, encoding='utf-8') as f:
        chunks = sorted({q['chunk'] for q in json.load(f)})
    for chunk in chunks:
        download(f'https://raw.githubusercontent.com/{repo}/{sha}/public/data/questions/{chunk}.json',
                 os.path.join(out, 'chunks', f'{chunk}.json'))


if __name__ == '__main__':
    print('Fetching sources into', os.path.abspath(SOURCES_DIR))
    fetch_mdn522()
    fetch_cbqb()
    fetch_girff()
    print('Done.')
