// Gắn chủ đề nhỏ (topic) cho câu R&W để bài học trong /learn lấy đúng dạng câu luyện tập.
// Chỉ dựa vào câu hỏi + đáp án (không cần dữ liệu thêm); câu không nhận ra chủ đề vẫn thuộc skill của nó.

const strip = html => String(html || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&[lr]squo;|&#8217;/g, '’')
  .replace(/\s+/g, ' ')
  .trim();

const words = s => s.split(/\s+/).filter(Boolean);

const PRONOUNS = new Set([
  'it', 'its', 'it’s', 'they', 'them', 'their', 'theirs', 'they’re', 'this', 'that', 'these', 'those',
  'he', 'she', 'him', 'her', 'his', 'hers', 'we', 'us', 'our', 'you', 'your', 'one', 'one’s', 'who', 'whom',
  'whose', 'which', 'each', 'some', 'either', 'neither', 'itself', 'themselves', 'himself', 'herself',
]);
const AUX = /\b(is|are|was|were|has|have|had|will|would|be|been|being|do|does|did)\b/i;

// Đoạn văn chứa ô trống: phần trước và sau "______"
function aroundBlank(q) {
  const text = strip(q.stimulus).replace(/\s*blank\b/, '');
  const at = text.indexOf('__');
  if (at < 0) return { before: text, after: '' };
  return { before: text.slice(0, at), after: text.slice(at).replace(/^_+/, '') };
}

// Phần câu (tính từ dấu chấm gần nhất) đứng trước ô trống
function sentenceBefore(before) {
  const parts = before.split(/(?<=[.!?])\s+(?=[A-Z“"])/);
  return parts[parts.length - 1] || '';
}

const MARKS = ['.', ';', ':', '—', ',', '(', ')'];
const FANBOYS = /,\s+(and|but|so|yet|or|for|nor)\b/i;

// Mỗi dạng câu Boundaries ứng với một bài: nối hai câu (joining), câu + mệnh đề phụ / cụm từ (fragment-join),
// dấu hai chấm / gạch ngang (colon-dash), thành phần chen giữa (nonessential), dấu phẩy thừa / thiếu (commas)
function boundaryTopics(q) {
  const options = q.options.map(strip);
  const answer = options[q.correctAnswer] || '';
  const sentence = sentenceBefore(aroundBlank(q).before);

  // Dấu câu riêng của từng lựa chọn (bỏ phần dấu mà lựa chọn nào cũng có, vd. "ran—fast" ở cả bốn)
  const count = (s, m) => s.split(m).length - 1;
  const base = Object.fromEntries(MARKS.map(m => [m, Math.min(...options.map(o => count(o, m)))]));
  const extra = (o, m) => count(o, m) - base[m];
  const offered = m => options.some(o => extra(o, m) > 0);

  const dashesBefore = count(sentence, '—');
  const openParen = count(sentence, '(') > count(sentence, ')');
  const commaPairs = options.some(o => extra(o, ',') >= 2) && options.some(o => extra(o, ',') === 0);

  // Câu hỏi trực tiếp / gián tiếp (dấu chấm hỏi)
  if (options.some(o => o.includes('?'))) return ['question-marks'];
  if (extra(answer, '.') > 0 || extra(answer, ';') > 0 || (FANBOYS.test(answer) && !options.every(o => FANBOYS.test(o)))) {
    return ['joining'];
  }
  // Cặp dấu đang mở trước ô trống, hoặc tên riêng / cụm chen giữa bằng hai dấu phẩy
  if (dashesBefore % 2 === 1 || openParen || commaPairs) return ['nonessential'];
  if (extra(answer, ':') > 0 || extra(answer, '—') > 0) return ['colon-dash'];
  // Có lựa chọn dấu chấm / chấm phẩy nhưng sai: một vế không phải câu hoàn chỉnh
  if (offered('.') || offered(';')) return ['fragment-join'];
  return ['commas'];
}

function formTopics(q) {
  const options = q.options.map(strip);
  const lower = options.map(o => o.toLowerCase());
  const firstWords = lower.map(o => words(o)[0] || '');
  const avgWords = options.reduce((s, o) => s + words(o).length, 0) / options.length;
  const tags = [];

  const hasApostrophe = options.some(o => /[’']/.test(o));
  const pronounish = firstWords.filter(w => PRONOUNS.has(w)).length >= 3 ||
    lower.filter(o => /\b(it|its|it’s|they|their|they’re|them|one|we|you)\b/.test(o)).length >= 3;
  // Các lựa chọn chỉ khác nhau ở dấu nháy / đuôi -s (story’s / stories’ ...)
  const unpossessed = new Set(lower.map(o => o.replace(/[’']/g, '').replace(/(ie)?s\b/g, '').replace(/y\b/g, '')));

  if (hasApostrophe && unpossessed.size === 1) return ['possessives'];
  if (avgWords >= 5) {
    tags.push('modifiers');
    return tags;
  }
  if (pronounish) {
    tags.push('pronouns');
    if (lower.some(o => /\b(it’s|they’re|its|their)\b/.test(o)) && hasApostrophe) tags.push('possessives');
    return tags;
  }
  if (hasApostrophe) {
    tags.push('possessives');
    return tags;
  }
  const verbish = lower.filter(o => AUX.test(o) || /^to\s/.test(o) || /\b\w+(ing|ed)\b/.test(o)).length >= 2;
  if (verbish) {
    tags.push('verbs');
    // Có lựa chọn không chia (to ..., -ing, having ...) → kiểm tra câu đủ/thiếu động từ chính
    if (lower.some(o => /^(to|having)\s/.test(o) || /^\w+ing$/.test(o))) tags.push('fragments');
    return tags;
  }
  tags.push('parallel');
  return tags;
}

function readingTopics(q) {
  const stem = strip(q.stem).toLowerCase();
  const visual = /<(table|img|svg|figure)/i.test(q.stimulus || '') || /\b(graph|table|chart)\b/.test(stem);
  switch (q.skill) {
    case 'Central Ideas and Details':
      return /main idea|central idea/.test(stem) ? ['main-idea'] : ['details'];
    case 'Text Structure and Purpose':
      return /overall structure|main purpose|primary purpose/.test(stem) ? ['purpose'] : ['function'];
    case 'Command of Evidence':
      return visual ? ['quantitative'] : /quotation/.test(stem) ? ['illustrate'] : ['support'];
    default:
      return [];
  }
}

// Math: chỉ dựa vào chữ + MathML (câu CBQB có công thức dạng ảnh sprite nên nhận ra được ít hơn)
function mathTopics(q) {
  const html = [q.stimulus, q.stem, ...(q.options || []), q.rationale || ''].join(' ');
  const text = strip(html).toLowerCase();
  const tags = [];
  if (/exponential|compound|half-life|doubles|triples|decay|growth factor|percent (?:each|every|per) (?:year|month|day|hour)/.test(text)) tags.push('exponential');
  if (/quadratic|parabola|vertex|discriminant/.test(text) || /<mn>2<\/mn><\/msup>/.test(html)) tags.push('quadratic');
  if (/<msqrt|<mroot|square root|radical/.test(html + text)) tags.push('radicals');
  if (/exponent/.test(text) || (/<msup>/.test(html) && !/<mn>2<\/mn><\/msup>/.test(html))) tags.push('exponents');
  return tags;
}

function topicsOf(q) {
  if (q.section === 'Math') return mathTopics(q);
  if (q.type !== 'mcq') return [];
  if (q.skill === 'Boundaries') return boundaryTopics(q);
  if (q.skill === 'Form, Structure, and Sense') return formTopics(q);
  return readingTopics(q);
}

module.exports = { topicsOf };
