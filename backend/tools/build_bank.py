import os
import re
import sys
import json
import glob
import base64
import hashlib
import shutil
import urllib.request
import html as htmllib
from fractions import Fraction
from html.parser import HTMLParser
from xml.etree import ElementTree

from fetch_sources import GIRFF

sys.stdout.reconfigure(encoding='utf-8')

# Dựng data/questions.json từ nhiều nguồn:
#   - data/pdf_bank.json     : trích từ PDF Question Bank của mình (import_math.py & parse_all_rw.py)
#   - sources/mdn522         : JSON gốc của College Board (HTML + MathML), có cờ câu đề Bluebook
#   - sources/cbqb           : trích từ PDF export mới (HTML + sprite công thức), đã loại câu Bluebook
#   - sources/girff          : bản export đầy đủ mới nhất (cả PSAT, câu Bluebook), chỉ dùng để đối chiếu
#                              đáp án/độ khó và phát hiện câu đã bị gỡ khỏi Question Bank
# Chạy backend/tools/fetch_sources.py trước để tải các nguồn.

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(TOOLS_DIR, '..', 'data')
SOURCES_DIR = os.path.join(DATA_DIR, 'sources')
MEDIA_ROOT = os.path.join(TOOLS_DIR, '..', '..', 'frontend', 'public', 'media')
MEDIA_DIR = os.path.join(MEDIA_ROOT, 'cbqb')  # hình/sprite chép từ CBQB
CB_MEDIA_DIR = os.path.join(MEDIA_ROOT, 'cb')
GIRFF_MEDIA_DIR = os.path.join(MEDIA_ROOT, 'girff')  # hình nguyên vẹn thay cho hình bị tách của CBQB  # ảnh nhúng (base64/SVG) tách thành file, đặt tên theo hash
OUT_PATH = os.path.join(DATA_DIR, 'questions.json')
REPORT_PATH = os.path.join(DATA_DIR, 'build_report.json')

RW, MATH = 'Reading and Writing', 'Math'

# Tên skill thống nhất theo tên file trong bản export PDF của College Board
SKILL_NAMES = {
    'central ideas and details': 'Central Ideas and Details',
    'inferences': 'Inferences',
    'command of evidence': 'Command of Evidence',
    'words in context': 'Words in Context',
    'text structure and purpose': 'Text Structure and Purpose',
    'cross-text connections': 'Cross-Text Connections',
    'rhetorical synthesis': 'Rhetorical Synthesis',
    'transitions': 'Transitions',
    'boundaries': 'Boundaries',
    'form, structure, and sense': 'Form, Structure, and Sense',
    'linear equations in one variable': 'Linear Equations in One Variable',
    'linear functions': 'Linear Functions',
    'linear equations in two variables': 'Linear Equations in Two Variables',
    'systems of two linear equations in two variables': 'Systems of Linear Equations',
    'systems of linear equations': 'Systems of Linear Equations',
    'linear inequalities in one or two variables': 'Linear Inequalities',
    'linear inequalities': 'Linear Inequalities',
    'nonlinear functions': 'Nonlinear Functions',
    'nonlinear equations in one variable and systems of equations in two variables': 'Nonlinear Equations and Systems',
    'nonlinear equations and systems': 'Nonlinear Equations and Systems',
    'equivalent expressions': 'Equivalent Expressions',
    'ratios, rates, proportional relationships, and units': 'Ratios, Rates, Proportions, and Units',
    'ratios, rates, proportions, and units': 'Ratios, Rates, Proportions, and Units',
    'percentages': 'Percentages',
    'one-variable data: distributions and measures of center and spread': 'One-Variable Data',
    'one-variable data': 'One-Variable Data',
    'two-variable data: models and scatterplots': 'Two-Variable Data',
    'two-variable data': 'Two-Variable Data',
    'probability and conditional probability': 'Probability',
    'probability': 'Probability',
    'inference from sample statistics and margin of error': 'Sample Statistics and Margin of Error',
    'sample statistics and margin of error': 'Sample Statistics and Margin of Error',
    'evaluating statistical claims: observational studies and experiments': 'Evaluating Statistical Claims',
    'evaluating statistical claims': 'Evaluating Statistical Claims',
    'area and volume': 'Area and Volume',
    'lines, angles, and triangles': 'Lines, Angles, and Triangles',
    'right triangles and trigonometry': 'Right Triangles and Trigonometry',
    'circles': 'Circles',
}
DIFFICULTY = {'E': 'Easy', 'M': 'Medium', 'H': 'Hard', 'Easy': 'Easy', 'Medium': 'Medium', 'Hard': 'Hard'}


def skill_name(raw):
    name = SKILL_NAMES.get(raw.strip().lower())
    if not name:
        raise ValueError(f'Unknown skill: {raw!r}')
    return name


# ---------------------------------------------------------------------------
# Làm sạch HTML: chỉ giữ thẻ/thuộc tính an toàn, đổi <svg> thành <img> để CSS
# và id bên trong hình không ảnh hưởng tới trang, đổi <mfenced> (Chrome không còn
# hỗ trợ) thành <mrow><mo>(</mo>...<mo>)</mo></mrow>.
# ---------------------------------------------------------------------------

HTML_TAGS = {
    'p', 'br', 'span', 'div', 'em', 'strong', 'b', 'i', 'u', 's', 'sup', 'sub', 'small',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
    'col', 'colgroup', 'figure', 'figcaption', 'blockquote', 'cite', 'img',
}
MATH_TAGS = {
    'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'mspace', 'mrow', 'mfrac', 'msqrt', 'mroot',
    'msup', 'msub', 'msubsup', 'munder', 'mover', 'munderover', 'mtable', 'mtr', 'mtd',
    'mlabeledtr', 'mstyle', 'mpadded', 'mphantom', 'menclose', 'semantics', 'mmultiscripts',
    'mprescripts', 'none', 'merror', 'maction',
}
DROP_WITH_CONTENT = {
    'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'head', 'title',
    'link', 'meta', 'form', 'input', 'button', 'textarea', 'select', 'annotation', 'annotation-xml',
}
VOID_TAGS = {'br', 'img', 'col', 'hr', 'wbr', 'mspace', 'mprescripts', 'none'}
COMMON_ATTRS = {
    'class', 'style', 'title', 'role', 'aria-label', 'aria-hidden', 'alt', 'colspan', 'rowspan',
    'scope', 'width', 'height', 'align', 'valign',
}
MATH_ATTRS = {
    'alttext', 'mathvariant', 'displaystyle', 'scriptlevel', 'notation', 'lspace', 'rspace',
    'stretchy', 'fence', 'separator', 'accent', 'accentunder', 'columnalign', 'rowalign',
    'linethickness', 'form', 'largeop', 'movablelimits', 'symmetric', 'minsize', 'maxsize',
    'depth', 'voffset', 'columnspacing', 'rowspacing', 'columnlines', 'rowlines', 'frame',
    'framespacing', 'equalrows', 'equalcolumns', 'display', 'mathsize', 'bevelled',
    'numalign', 'denomalign', 'width', 'height',
}
SAFE_IMG_SRC = re.compile(r'^/media/[\w./-]+$')
DATA_URI = re.compile(r'^data:image/(png|jpeg|gif|svg\+xml);base64,([A-Za-z0-9+/=\s]+)$')


def store_media(data, ext):
    # Ảnh trùng nội dung chỉ lưu một lần
    name = f'{hashlib.sha1(data).hexdigest()[:16]}.{ext}'
    path = os.path.join(CB_MEDIA_DIR, name)
    if not os.path.exists(path):
        os.makedirs(CB_MEDIA_DIR, exist_ok=True)
        with open(path, 'wb') as f:
            f.write(data)
    return f'/media/cb/{name}'
SAFE_URL = re.compile(r'url\(\s*["\']?(/media/[\w./-]+)["\']?\s*\)')


def clean_style(style):
    kept = []
    for decl in style.split(';'):
        d = decl.strip()
        if not d or ':' not in d:
            continue
        low = d.lower()
        prop = low.split(':', 1)[0].strip()
        if prop in ('position', 'behavior') or any(bad in low for bad in ('expression', 'javascript', '@import')):
            continue
        if 'url(' in low and not SAFE_URL.search(d):
            continue
        kept.append(d)
    return ';'.join(kept)


class Node:
    __slots__ = ('tag', 'attrs', 'children', 'parent')

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.children, self.parent = tag, attrs, [], parent


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node('#root', [], None)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID_TAGS:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, attrs, self.cur))

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def svg_to_img(match):
    svg = match.group(0)
    svg = re.sub(r'<script\b.*?</script\s*>', '', svg, flags=re.S | re.I)
    svg = re.sub(r'<foreignObject\b.*?</foreignObject\s*>', '', svg, flags=re.S | re.I)
    svg = re.sub(r'\son\w+\s*=\s*("[^"]*"|\'[^\']*\')', '', svg, flags=re.I)
    svg = re.sub(r'\s(xlink:)?href\s*=\s*("(?!#)[^"]*"|\'(?!#)[^\']*\')', '', svg, flags=re.I)
    # Thực thể HTML (&nbsp;...) không hợp lệ trong XML
    svg = re.sub(r'&([a-zA-Z][a-zA-Z0-9]*);',
                 lambda m: m.group(0) if m.group(1) in ('lt', 'gt', 'amp', 'quot', 'apos') else htmllib.unescape(m.group(0)),
                 svg)
    head = svg[:svg.index('>')]
    if 'xmlns=' not in head:
        svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"', 1)
    if 'xlink:' in svg and 'xmlns:xlink' not in head:
        svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
    try:
        ElementTree.fromstring(svg)
    except ElementTree.ParseError as e:
        raise ValueError(f'Malformed SVG: {e}')

    attr = lambda name: (re.search(rf'\s{name}\s*=\s*"([^"]*)"', head, re.I) or [None, None])[1]
    label = attr('aria-label') or ''
    width = attr('width')
    if not width:
        viewbox = attr('viewBox')
        width = viewbox.split()[2] if viewbox and len(viewbox.split()) == 4 else None
    px = re.fullmatch(r'([\d.]+)(px)?', width or '')
    style = f' style="width:{float(px.group(1)):g}px"' if px and float(px.group(1)) > 0 else ''
    return f'<img class="svg-figure" alt="{htmllib.escape(label)}"{style} src="{store_media(svg.encode("utf-8"), "svg")}">'


def serialize(node, out):
    if isinstance(node, str):
        out.append(htmllib.escape(node, quote=False))
        return
    tag = node.tag
    if tag in DROP_WITH_CONTENT:
        return
    if tag == 'mfenced':
        attrs = dict(node.attrs)
        open_, close = attrs.get('open', '('), attrs.get('close', ')')
        seps = (attrs.get('separators', ',') or '').replace(' ', '')
        kids = [c for c in node.children if not (isinstance(c, str) and not c.strip())]
        out.append('<mrow>')
        if open_:
            out.append(f'<mo>{htmllib.escape(open_)}</mo>')
        for i, kid in enumerate(kids):
            if i and seps:
                out.append(f'<mo>{htmllib.escape(seps[min(i - 1, len(seps) - 1)])}</mo>')
            serialize(kid, out)
        if close:
            out.append(f'<mo>{htmllib.escape(close)}</mo>')
        out.append('</mrow>')
        return
    if tag not in HTML_TAGS and tag not in MATH_TAGS:
        # Thẻ lạ (vd. itembody): bỏ thẻ, giữ nội dung
        for child in node.children:
            serialize(child, out)
        return

    allowed = COMMON_ATTRS | (MATH_ATTRS if tag in MATH_TAGS else set())
    parts = [tag]
    for name, value in node.attrs:
        value = value or ''
        if tag == 'img' and name == 'src':
            uri = DATA_URI.match(value)
            if uri:
                ext = {'svg+xml': 'svg', 'jpeg': 'jpg'}.get(uri.group(1), uri.group(1))
                value = store_media(base64.b64decode(uri.group(2)), ext)
            if not SAFE_IMG_SRC.match(value):
                return  # Ảnh từ nguồn lạ: bỏ hẳn
        elif name not in allowed:
            continue
        if name == 'style':
            value = clean_style(value)
            if not value:
                continue
        parts.append(f'{name}="{htmllib.escape(value)}"')
    if tag == 'img' and not any(p.startswith('src=') for p in parts):
        return
    out.append('<' + ' '.join(parts) + '>')
    if tag in VOID_TAGS:
        return
    for child in node.children:
        serialize(child, out)
    out.append(f'</{tag}>')


def sanitize(raw):
    if not raw:
        return ''
    raw = re.sub(r'<svg\b.*?</svg\s*>', svg_to_img, raw, flags=re.S | re.I)
    builder = TreeBuilder()
    builder.feed(raw)
    builder.close()
    out = []
    for child in builder.root.children:
        serialize(child, out)
    return ''.join(out).strip()


def has_content(fragment):
    # Một lựa chọn/đề hợp lệ phải có chữ, công thức hoặc hình
    text = re.sub(r'<[^>]+>', '', fragment).strip()
    return bool(text) or '<img' in fragment or '<math' in fragment or 'class="m"' in fragment


# ---------------------------------------------------------------------------
# Chuyển nội dung từng nguồn về dạng { stimulus, stem, options, rationale } (HTML)
# ---------------------------------------------------------------------------

# Lời giải gốc của College Board viết theo thứ tự lựa chọn cũ (đáp án đúng đã được kiểm tra
# bằng cách tự giải lại): sửa chữ cái cho khớp thứ tự lựa chọn hiện tại.
RATIONALE_ERRATA = {
    # 5.5r + 3b = 37, 6.5r + 8b = 66 -> b = 5 (B); 4 (A) là số pint raspberries
    '1e11190a': [('Choice C is correct', 'Choice B is correct'),
                 ('Choices A and B are incorrect', 'Choices C and D are incorrect'),
                 ('Choice D is incorrect', 'Choice A is incorrect')],
    # y < -4x + 4: chỉ (-4, 0) thỏa mãn (A)
    'bf5f80c6': [('Choice D is correct', 'Choice A is correct'),
                 ('Choices A, B, and C are incorrect', 'Choices B, C, and D are incorrect')],
}


def apply_errata(qid, rationale):
    for old, new in RATIONALE_ERRATA.get(qid, []):
        assert rationale.count(old) == 1, (qid, old)
        rationale = rationale.replace(old, new)
    return rationale


def from_mdn(q):
    c = q['content']
    if q['ibn']:  # Câu cũ (disclosed), công thức là ảnh PNG nhúng
        answer = c['answer']
        options = [answer['choices'][k]['body'] for k in 'abcd'] if answer.get('style') == 'Multiple Choice' else []
        return {
            'stimulus': c.get('body') or '',
            'stem': c.get('prompt') or '',
            'options': options,
            'rationale': answer.get('rationale') or '',
        }
    options = [o['content'] for o in c.get('answerOptions') or []]
    if c['type'] == 'mcq':
        # Thứ tự answerOptions chính là A-D: đối chiếu với id của đáp án đúng
        ids = [o['id'] for o in c['answerOptions']]
        assert ids.index(c['keys'][0]) == 'ABCD'.index(c['correct_answer'][0]), q['questionId']
    return {
        'stimulus': c.get('stimulus') or '',
        'stem': c.get('stem') or '',
        'options': options,
        'rationale': c.get('rationale') or '',
    }


CBQB_MEDIA = set()


def cbqb_media(html):
    def repl(m):
        CBQB_MEDIA.add(m.group(2))
        return f'{m.group(1)}/media/cbqb/{m.group(2)}'
    # Sprite công thức (url(data/math/sprites/...)) và hình trong lựa chọn (src="data/math/figures/...")
    return re.sub(r'(url\(|src=")data/((?:math/)?(?:sprites|figures)/[\w.]+)', repl, html or '')


def cbqb_figure(block):
    src = block['src']  # "figures/x.png" (R&W) hoặc "math/figures/x.png"
    CBQB_MEDIA.add(src)
    width = f' style="width:{block["width"]:g}px"' if block.get('width') else ''
    return f'<figure class="image"><img src="/media/cbqb/{src}" alt="{htmllib.escape(block.get("alt") or "")}"{width}></figure>'


def cbqb_table(block):
    rows = []
    for row in block['rows']:
        cells = []
        for cell in row:
            tag = 'th' if cell.get('header') else 'td'
            attrs = ''
            if cell.get('colspan', 1) > 1:
                attrs += f' colspan="{cell["colspan"]}"'
            if cell.get('rowspan', 1) > 1:
                attrs += f' rowspan="{cell["rowspan"]}"'
            if cell.get('align'):
                attrs += f' style="text-align:{cell["align"]}"'
            cells.append(f'<{tag}{attrs}>{cbqb_media(cell["html"])}</{tag}>')
        rows.append('<tr>' + ''.join(cells) + '</tr>')
    caption = f'<caption>{block["caption"]}</caption>' if block.get('caption') else ''
    return f'<table class="table">{caption}<tbody>{"".join(rows)}</tbody></table>'


def cbqb_block(block):
    kind = block['type']
    if kind == 'p':
        style = ' style="text-align:center"' if block.get('center') else ''
        return f'<p{style}>{cbqb_media(block["html"])}</p>'
    if kind == 'label':
        return f'<p class="text-label"><strong>{block["html"]}</strong></p>'
    if kind == 'quote':
        if 'lines' in block:
            lines = ''.join(
                f'<span class="poem-line" style="padding-left:{2 * line.get("indent", 0)}em">{line["html"]}</span>'
                for line in block['lines'])
            return f'<blockquote class="poem">{lines}</blockquote>'
        indent = f' style="padding-left:{2 * block["indent"]}em"' if block.get('indent') else ''
        return f'<blockquote><p{indent}>{block["html"]}</p></blockquote>'
    if kind == 'list':
        return '<ul>' + ''.join(f'<li>{item}</li>' for item in block['items']) + '</ul>'
    if kind == 'table':
        return cbqb_table(block)
    if kind == 'figure':
        return cbqb_figure(block)
    if kind == 'girff-figure':
        width = f' style="width:{block["width"]:g}px"' if block.get('width') else ''
        return f'<figure class="image"><img src="{block["src"]}" alt="{htmllib.escape(block.get("alt") or "")}"{width}></figure>'
    raise ValueError(f'Unknown CBQB block type: {kind}')


def girff_figure(path):
    """Ảnh hình của girff (figures/<id>-f1.webp): tải vào cache sources/girff/ nếu chưa có, chép sang media."""
    cache = os.path.join(SOURCES_DIR, 'girff', path)
    if not os.path.exists(cache):
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        repo, sha = GIRFF
        with urllib.request.urlopen(f'https://raw.githubusercontent.com/{repo}/{sha}/public/data/{path}') as res, open(cache, 'wb') as f:
            f.write(res.read())
    os.makedirs(GIRFF_MEDIA_DIR, exist_ok=True)
    shutil.copyfile(cache, os.path.join(GIRFF_MEDIA_DIR, os.path.basename(path)))
    return f'/media/girff/{os.path.basename(path)}'


SPRITE_WIDTH = re.compile(r'<span class="m" style="width:([\d.]+)em')


def is_figure_label(block):
    # Nhãn trong hình bị tách thành đoạn riêng: 1 ký hiệu ngắn (t, j, k, 134°) hoặc mẩu "Note: Figure not drawn to scale."
    if block['type'] != 'p' or block.get('center'):
        return False
    text = re.sub(r'<[^>]+>', '', block['html']).strip()
    if re.fullmatch(r'(Note:\s*)?(Figure not\s*)?(drawn to scale\.?)?', text) and text:
        return True
    widths = [float(w) for w in SPRITE_WIDTH.findall(block['html'])]
    return len(text) <= 3 and len(widths) <= 1 and all(w < 2.2 for w in widths) and bool(text or widths)


def fix_cbqb_figures(c, g):
    """CBQB cắt nhãn trong hình Math (t, j, k...) thành đoạn rời quanh hình:
    thay toàn bộ hình + nhãn bằng ảnh nguyên vẹn của girff (đã gồm nhãn và ghi chú)."""
    figures = [b for b in c['stimulus'] if b['type'] == 'figure']
    if c['section'] != MATH or not figures:
        return c
    girff_images = [b for b in g.get('stem') or [] if isinstance(b, dict) and b.get('kind') == 'image']
    if not girff_images or len(girff_images) > len(figures):
        return c
    blocks = c['stimulus']
    is_figure = lambda i: 0 <= i < len(blocks) and blocks[i]['type'] == 'figure'
    has_words = lambda b: len(re.sub(r'<[^>]+>', '', b.get('html', '')).strip()) > 3
    # Đề girff chỉ gồm hình + câu hỏi: mọi đoạn chỉ có sprite trong stimulus CBQB đều là chữ trong hình
    girff_text = [b for b in g.get('stem') or [] if isinstance(b, dict) and b.get('kind') != 'image']
    figure_only = len(girff_text) == 1
    # Nhãn chỉ bị bỏ khi nằm sát hình (liền trước/sau một hình hoặc một nhãn khác đã bỏ)
    drop = [b['type'] == 'figure' or (figure_only and b['type'] == 'p' and not has_words(b)) for b in blocks]
    for i, block in enumerate(blocks):
        if not drop[i] and is_figure_label(block) and ((i > 0 and drop[i - 1]) or is_figure(i + 1)):
            drop[i] = True
    for i in range(len(blocks) - 2, -1, -1):  # nhãn đứng trước một nhãn khác ngay trước hình
        if not drop[i] and drop[i + 1] and is_figure_label(blocks[i]):
            drop[i] = True
    stimulus, inserted = [], False
    for block, dropped in zip(blocks, drop):
        if dropped:
            if not inserted:
                stimulus += [{'type': 'girff-figure', 'src': girff_figure(img['src']), 'width': img.get('width'), 'alt': ''}
                             for img in girff_images]
                inserted = True
            continue
        stimulus.append(block)
    return {**c, 'stimulus': stimulus}


def from_cbqb(q):
    return {
        'stimulus': ''.join(cbqb_block(b) for b in q['stimulus']),
        'stem': f'<p>{cbqb_media(q["stem"])}</p>' if q['stem'] else '',
        'options': [cbqb_media(c['html']) for c in q['choices']],
        'rationale': ''.join(f'<p>{cbqb_media(p)}</p>' for p in q['rationale']['paragraphs']),
    }


# Câu chỉ có trong girff: chữ dùng markup nhỏ ($latex$, <i>, <b>, <u>, <sup>, <sub>, <br/>, \$ = dấu đô la),
# công thức LaTeX đổi sang MathML để hiển thị giống các câu lấy từ JSON gốc của College Board
INLINE_MATH = re.compile(r'(?<!\\)\$((?:[^$\\]|\\.)+?)\$')
GROUPED_DIGITS = re.compile(r'<mn>([\d,]+)</mn><mrow><mo>&#x0002C;</mo></mrow><mn>(\d+)</mn>')


def tex(latex, display=False):
    from latex2mathml.converter import convert  # chỉ cần khi dựng lại kho: pip install latex2mathml
    latex = re.sub(r'\\text\{ ', r'\\ \\text{', latex.strip())  # giữ khoảng trắng trước đơn vị: 5\text{ cm}
    mathml = convert(latex, display='block' if display else 'inline')
    # \$ và \% ra <mi> (chữ nghiêng): College Board viết ký hiệu đơn vị dạng toán tử đứng
    mathml = mathml.replace('<mi>&#x00024;</mi>', '<mo>$</mo>').replace('<mi>&#x00025;</mi>', '<mo>%</mo>')
    while GROUPED_DIGITS.search(mathml):  # 3{,}577 -> một số
        mathml = GROUPED_DIGITS.sub(r'<mn>\1,\2</mn>', mathml)
    return mathml


def girff_text(value):
    parts = INLINE_MATH.split(value)
    html = []
    for i, part in enumerate(parts):
        if i % 2:
            html.append(tex(part))
        else:
            part = re.sub(r'<img\s+src="?([\w./-]+)"?([^>]*)/?>',
                          lambda m: f'<img src="{girff_figure(m.group(1))}"{m.group(2)}>', part)
            html.append(part.replace(r'\$', '$'))
    return ''.join(html)


def girff_table(block):
    head = ''.join(f'<th>{girff_text(h)}</th>' for h in block['headers'])
    rows = ''.join('<tr>' + ''.join(f'<td>{girff_text(c)}</td>' for c in row) + '</tr>' for row in block['rows'])
    return f'<table class="table"><tbody><tr>{head}</tr>{rows}</tbody></table>'


def girff_blocks(blocks):
    html, bullets = [], []
    for block in blocks or []:
        kind = block['kind']
        if kind == 'text' and block.get('style') == 'bullet':
            bullets.append(f'<li>{girff_text(block["value"])}</li>')
            continue
        if bullets:
            html.append('<ul>' + ''.join(bullets) + '</ul>')
            bullets = []
        if kind == 'text':
            style = ' style="text-align:center"' if block.get('style') == 'center' else ''
            html.append(f'<p{style}>{girff_text(block["value"])}</p>')
        elif kind == 'math':
            html.append(f'<p>{tex(block["latex"], display=True)}</p>')
        elif kind == 'table':
            html.append(girff_table(block))
        elif kind == 'image':
            width = f' style="width:{block["width"]:g}px"' if block.get('width') else ''
            html.append(f'<figure class="image"><img src="{girff_figure(block["src"])}" alt="{htmllib.escape(block.get("alt") or "")}"{width}></figure>')
        else:
            raise ValueError(f'Unknown girff block kind: {kind}')
    if bullets:
        html.append('<ul>' + ''.join(bullets) + '</ul>')
    return ''.join(html)


def girff_inline(content):
    # Lựa chọn một dòng: không bọc <p> (giống lựa chọn trong JSON gốc)
    if len(content) == 1 and content[0]['kind'] == 'math':
        return tex(content[0]['latex'])
    if len(content) == 1 and content[0]['kind'] == 'text' and not content[0].get('style'):
        return girff_text(content[0]['value'])
    return girff_blocks(content)


def from_girff(q):
    stem = q['stem']
    if q['section'] == 'math' and stem and stem[-1]['kind'] == 'text':
        # Đề Math gồm hình/bảng/phương trình rồi câu hỏi: tách câu hỏi cuối ra làm stem
        stimulus, stem = girff_blocks(stem[:-1]), girff_blocks(stem[-1:])
    else:
        stimulus, stem = girff_blocks(q.get('passage')), girff_blocks(stem)
    choices = sorted(q.get('choices') or [], key=lambda c: c['label'])
    return {
        'stimulus': stimulus,
        'stem': stem,
        'options': [girff_inline(c['content']) for c in choices],
        'rationale': girff_blocks(q['rationale']['overall']),
    }


def girff_rationale_key(q):
    """Đáp án ghi trong lời giải của girff (nguồn thứ hai cho câu chỉ có ở girff)."""
    text = ' '.join(b.get('value', '') for b in q['rationale']['overall'] if b['kind'] == 'text')
    if q['type'] == 'mcq':
        m = re.search(r'Choice ([A-D]) is (?:correct|the best answer)', text)
        return ('mcq', m.group(1)) if m else None
    m = re.search(r'correct answers? (?:is|are)(.*?)(?:\.\s|$)', text)
    if not m:
        return None
    values = []
    for latex in INLINE_MATH.findall(m.group(1)) or [m.group(1)]:
        s = re.sub(r'\\d?frac\{(-?\d+)\}\{(\d+)\}', r'\1/\2', latex.replace('{,}', '').replace(' ', ''))
        s = s.replace('\\left', '').replace('\\right', '').strip('()')
        if re.fullmatch(r'-?\d*\.?\d+(/\d+)?', s):
            values.append(s)
    return ('spr', values) if values else None


# ---------------------------------------------------------------------------
# Đáp án từ từng nguồn + đối chiếu
# ---------------------------------------------------------------------------

def spr_values(forms):
    """Giá trị chính xác (phân số / số thập phân hữu hạn) của các cách ghi đáp án."""
    values = set()
    for f in forms:
        f = f.strip().replace(',', '')
        try:
            values.add(Fraction(f))
        except (ValueError, ZeroDivisionError):
            pass
    return values


def key_from_rationale(text):
    m = re.search(r'Choice ([A-D]) is (?:correct|the best answer)', re.sub(r'<[^>]+>', '', text or ''))
    return m.group(1) if m else None


def keys_of(qid, pdf, mdn, cbqb, girff):
    """Trả về {nguồn: ('mcq', 'B') | ('spr', [forms])}"""
    keys = {}
    if qid in pdf:
        q = pdf[qid]
        keys['pdf'] = ('mcq', 'ABCD'[q['correctAnswer']]) if q.get('type', 'mcq') == 'mcq' else ('spr', q['acceptedAnswers'])
    if qid in mdn:
        q, c = mdn[qid], mdn[qid]['content']
        if q['ibn']:
            a = c['answer']
            if a.get('style') == 'Multiple Choice':
                keys['mdn'] = ('mcq', (a.get('correct_choice') or '').upper() or key_from_rationale(a['rationale']))
        elif c['type'] == 'mcq':
            keys['mdn'] = ('mcq', c['correct_answer'][0])
        else:
            keys['mdn'] = ('spr', [k.strip() for k in c['keys']])
    if qid in cbqb:
        q = cbqb[qid]
        keys['cbqb'] = ('spr', q['answers']) if q.get('type') == 'spr' else ('mcq', q['answer'])
    if qid in girff:
        q = girff[qid]
        keys['girff'] = ('mcq', q['correct'][0]) if q['type'] == 'mcq' else ('spr', q['correct'])
    return keys


def resolve_key(qid, keys):
    """Đáp án cuối cùng + số nguồn đồng ý. Ưu tiên: mdn (JSON gốc) > pdf > cbqb > girff."""
    order = [s for s in ('mdn', 'pdf', 'cbqb', 'girff', 'rationale') if s in keys]
    types = {keys[s][0] for s in order}
    primary = order[0]
    kind = keys[primary][0]
    conflicts = []
    if len(types) > 1:
        conflicts.append({s: keys[s] for s in order})

    if kind == 'mcq':
        votes = {s: keys[s][1] for s in order if keys[s][0] == 'mcq'}
        answer = votes[primary]
        agree = [s for s, v in votes.items() if v == answer]
        if len(agree) != len(votes):
            conflicts.append(votes)
        return {'type': 'mcq', 'correctAnswer': 'ABCD'.index(answer)}, agree, conflicts

    sprs = {s: keys[s][1] for s in order if keys[s][0] == 'spr'}
    base = spr_values(sprs[primary])
    forms, agree = [], []
    for source, source_forms in sprs.items():
        if spr_values(source_forms) & base or source == primary:
            agree.append(source)
            forms += [f.strip() for f in source_forms]
        else:
            conflicts.append({s: v for s, v in sprs.items()})
    return {'type': 'spr', 'acceptedAnswers': list(dict.fromkeys(f for f in forms if f))}, agree, conflicts


# ---------------------------------------------------------------------------

def load_sources():
    with open(os.path.join(DATA_DIR, 'pdf_bank.json'), encoding='utf-8') as f:
        pdf = {q['id']: q for q in json.load(f)}
    with open(os.path.join(SOURCES_DIR, 'mdn522', 'cb-digital-questions.json'), encoding='utf-8') as f:
        mdn = {q['questionId']: q for q in json.load(f).values()}
    with open(os.path.join(SOURCES_DIR, 'mdn522', 'lookup.json'), encoding='utf-8') as f:
        lookup = json.load(f)
    live = set(lookup['mathLiveItems']) | set(lookup['readingLiveItems'])
    cbqb = {}
    for path, section in [('questions.json', RW), ('math/questions.json', MATH)]:
        with open(os.path.join(SOURCES_DIR, 'cbqb', path), encoding='utf-8') as f:
            for q in json.load(f):
                q['section'] = section
                cbqb[q['id']] = q
    girff = {}
    for path in glob.glob(os.path.join(SOURCES_DIR, 'girff', 'chunks', '*.json')):
        with open(path, encoding='utf-8') as f:
            for q in json.load(f):
                girff[q['id']] = q
    return pdf, mdn, live, cbqb, girff


def main():
    pdf, mdn, live, cbqb, girff = load_sources()
    # Thư mục media do script này sinh ra hoàn toàn: xoá để không còn file thừa
    for d in (MEDIA_DIR, CB_MEDIA_DIR, GIRFF_MEDIA_DIR):
        shutil.rmtree(d, ignore_errors=True)

    # Kho chính: câu trong các bản export hiện tại (không gồm câu đề Bluebook).
    # Câu chỉ có trong mdn522 và được đánh dấu "live" = câu đề Bluebook -> chỉ dùng khi người chơi bật.
    core = set(pdf) | set(cbqb)
    bluebook = {qid for qid, q in mdn.items() if q['external_id'] in live} - core
    # Câu chỉ có trong bản export đầy đủ (girff): phân bố độ khó và tỉ lệ câu tự điền trùng với nhóm câu đề
    # Bluebook ở trên, khác hẳn kho chính -> phần lớn là câu các đề luyện Bluebook ra sau 2024 (SAT, PSAT).
    # Cũng chỉ dùng khi người chơi bật; đáp án đối chiếu với lời giải chính thức đi kèm.
    extra = set(girff) - core - bluebook - set(mdn)

    bank, report = [], {'conflicts': [], 'excluded': [], 'difficulty_conflicts': [], 'single_source': []}
    for qid in sorted(core | bluebook | extra):
        p, m, c = pdf.get(qid), mdn.get(qid), cbqb.get(qid)

        if qid in extra:
            g = girff[qid]
            if g['parseConfidence'] == 'low' or g.get('issues'):
                report['excluded'].append({'id': qid, 'reason': 'girff: ' + '; '.join(g.get('issues') or ['low parse confidence'])})
                continue
            keys = {'girff': ('mcq', g['correct'][0]) if g['type'] == 'mcq' else ('spr', g['correct'])}
            if girff_rationale_key(g):
                keys['rationale'] = girff_rationale_key(g)
            answer, agree, conflicts = resolve_key(qid, keys)
            if conflicts or len(agree) < 2:
                report['excluded'].append({'id': qid, 'reason': 'girff key not confirmed by its rationale', 'keys': keys})
                continue
            section, domain, skill = (MATH if g['section'] == 'math' else RW), g['domain'], skill_name(g['skill'])
            difficulty = DIFFICULTY[g['difficulty']]
            raw = from_girff(g)
        else:
            if c and not m and any('missing' in n for n in c.get('notes') or []):
                report['excluded'].append({'id': qid, 'reason': 'Math missing in College Board source'})
                continue
            # girff là bản export đầy đủ mới nhất (10/2026): câu không còn ở đó đã bị College Board gỡ
            if qid not in girff:
                report['excluded'].append({'id': qid, 'reason': 'Retired from the Question Bank'})
                continue

            if m:
                section = MATH if m['module'] == 'math' else RW
                domain, skill = m['primary_class_cd_desc'], skill_name(m['skill_desc'])
            if c:
                section, domain, skill = c['section'], c['domain'], skill_name(c['skill'])
            if p:
                section, domain, skill = p['section'], p['domain'], skill_name(p['skill'])

            # College Board có chấm lại độ khó theo thời gian: ưu tiên bản export mới nhất
            # (cbqb/girff 10/2026 > pdf 8/2025 > mdn 9/2024)
            difficulties = {s: DIFFICULTY[d] for s, d in (
                ('cbqb', c and c['difficulty']), ('girff', girff[qid]['difficulty']),
                ('pdf', p and p.get('difficulty')), ('mdn', m and m['difficulty'])) if d}
            difficulty = next(iter(difficulties.values()))
            if len(set(difficulties.values())) > 1:
                report['difficulty_conflicts'].append({'id': qid, **difficulties})

            keys = keys_of(qid, pdf, mdn, cbqb, girff)
            answer, agree, conflicts = resolve_key(qid, keys)
            if conflicts:
                report['conflicts'].append({'id': qid, 'chosen': answer, 'votes': conflicts})
            if len(agree) < 2:
                report['single_source'].append(qid)

            raw = from_mdn(m) if m else from_cbqb(fix_cbqb_figures(c, girff[qid]))
            raw['rationale'] = apply_errata(qid, raw['rationale'])
            if m and c and '<u>' in json.dumps(c['stimulus']) and not re.search(r'<u>|underline', raw['stimulus']):
                # College Board thêm gạch chân sau bản 2024 (vd. 73d457b6): lấy đoạn văn bản mới
                raw['stimulus'] = from_cbqb(c)['stimulus']
        content = {k: sanitize(v) if k != 'options' else [sanitize(o) for o in v] for k, v in raw.items()}

        problems = []
        if not has_content(content['stem']) and not has_content(content['stimulus']):
            problems.append('empty stem')
        if answer['type'] == 'mcq' and (len(content['options']) != 4 or not all(map(has_content, content['options']))):
            problems.append('bad options')
        if answer['type'] == 'spr' and not answer['acceptedAnswers']:
            problems.append('no accepted answers')
        if problems:
            report['excluded'].append({'id': qid, 'reason': ', '.join(problems)})
            continue

        rationale_key = key_from_rationale(content['rationale'])
        if answer['type'] == 'mcq' and rationale_key and 'ABCD'.index(rationale_key) != answer['correctAnswer']:
            report['conflicts'].append({'id': qid, 'chosen': answer, 'votes': [{'rationale': rationale_key}]})

        bank.append({
            'id': qid,
            'section': section,
            'domain': domain,
            'skill': skill,
            'difficulty': difficulty,
            'bluebook': qid in bluebook or qid in extra,
            **{k: v for k, v in answer.items() if k != 'type'},
            'type': answer['type'],
            'stimulus': content['stimulus'],
            'stem': content['stem'],
            'options': content['options'] if answer['type'] == 'mcq' else [],
            'rationale': content['rationale'],
            'sources': agree,
        })

    # Chép hình / sprite của CBQB sang frontend/public/media/cbqb
    for rel in sorted(CBQB_MEDIA):
        src = os.path.join(SOURCES_DIR, 'cbqb', rel)
        dest = os.path.join(MEDIA_DIR, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copyfile(src, dest)

    # Mỗi câu một dòng để git diff dễ đọc
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(q, ensure_ascii=False, separators=(',', ':')) for q in bank) + '\n]\n')
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    by = lambda pred: sum(1 for q in bank if pred(q))
    print(f'Questions: {len(bank)} | R&W {by(lambda q: q["section"] == RW and not q["bluebook"])}'
          f' + Math {by(lambda q: q["section"] == MATH and not q["bluebook"])}'
          f' | Bluebook (opt-in) {by(lambda q: q["bluebook"])}, of which girff-only {by(lambda q: q["id"] in extra)}')
    print(f'Key conflicts: {len(report["conflicts"])} | difficulty conflicts: {len(report["difficulty_conflicts"])}'
          f' | single-source keys: {len(report["single_source"])} | excluded: {len(report["excluded"])}')
    print(f'CBQB media files: {len(CBQB_MEDIA)} | report: {os.path.relpath(REPORT_PATH)}')


if __name__ == '__main__':
    main()
