"""
Markdown 文章 → 网站 fresh.json 转换脚本
=========================================
用法: python scripts/convert-article.py [文章路径]

功能:
1. 读取 articles/ 下的 .md 文件（或指定文件）
2. 解析 frontmatter（标题/日期/分类等）
3. 将 Markdown 正文转为 HTML
4. 更新 data/fresh.json 的 items 数组
5. 如果没有指定文件，自动处理所有未转换的新文章
"""

import json, os, re, sys, uuid
from datetime import datetime
import markdown

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_DIR = os.path.join(PROJECT_ROOT, 'articles')
FRESH_JSON = os.path.join(PROJECT_ROOT, 'data', 'fresh.json')
PROCESSED_LOG = os.path.join(ARTICLES_DIR, '.processed.json')

# Markdown 扩展 - 让排版更好看
MD_EXTENSIONS = [
    'extra',              # 表格、脚注、缩略语等
    'codehilite',         # 代码高亮
    'toc',                # 目录
    'sane_lists',         # 更合理的列表
]

CATEGORY_MAP = {
    'blog': 'blog',
    '随笔': 'blog',
    '生活': 'blog',
    'life': 'blog',
    'ai': 'ai',
    '设计': 'ai',
    'design': 'ai',
    '科技': 'ai',
    'tech': 'ai',
    '音乐': 'music',
    'music': 'music',
    '文化': 'culture',
    'culture': 'culture',
    '体育': 'sports',
    'sports': 'sports',
}

# 作者颜色 - 按分类自动分配
CAT_COLORS = {
    'blog': '#22c55e',
    'ai': '#6366f1',
    'music': '#ec4899',
    'culture': '#f59e0b',
    'sports': '#ef4444',
}

def parse_frontmatter(text):
    """解析 Markdown 的 frontmatter（--- 之间），返回 (metadata, body)"""
    text = text.strip()
    if text.startswith('---'):
        parts = text.split('---', 2)
        if len(parts) >= 3:
            import yaml
            try:
                meta = yaml.safe_load(parts[1]) or {}
            except:
                meta = {}
            body = parts[2].strip()
            return meta, body
    return {}, text

def get_cat_key(cat_input):
    """将分类名转为网站用的 key"""
    if not cat_input:
        return 'blog'
    cat_lower = str(cat_input).strip().lower()
    return CATEGORY_MAP.get(cat_lower, cat_lower)

def get_reading_time(html_text):
    """估算阅读时间（中英文混合）"""
    # 去掉 HTML 标签
    text = re.sub(r'<[^>]+>', '', html_text)
    # 中文字符算 1 个词，英文按空格分
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    english_words = len(re.sub(r'[\u4e00-\u9fff]', ' ', text).split())
    total_words = chinese_chars + english_words
    minutes = max(1, round(total_words / 400))
    return f"{minutes} min read"

def md_to_html(md_text):
    """将 Markdown 正文转为适合网站的 HTML"""
    html = markdown.markdown(md_text, extensions=MD_EXTENSIONS)
    
    # 给表格加响应式包装
    html = re.sub(r'<table>', '<div class="table-wrap"><table>', html)
    html = re.sub(r'</table>', '</table></div>', html)
    
    # 给图片加 figure 包装
    def wrap_img(match):
        img_tag = match.group(0)
        return f'<figure>{img_tag}</figure>'
    html = re.sub(r'<img[^>]+>', wrap_img, html)
    
    return html

def load_processed_log():
    """读取已处理文件记录"""
    if os.path.exists(PROCESSED_LOG):
        try:
            with open(PROCESSED_LOG, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_processed_log(log):
    """保存已处理文件记录"""
    with open(PROCESSED_LOG, 'w', encoding='utf-8') as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

def load_fresh_json():
    """加载现有的 fresh.json"""
    if os.path.exists(FRESH_JSON):
        with open(FRESH_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"heroGroups": [], "categories": [], "items": []}

def save_fresh_json(data):
    """保存更新后的 fresh.json"""
    # 确保 categories 里有 blog
    cat_keys = [c['key'] for c in data.get('categories', [])]
    if 'blog' not in cat_keys:
        data['categories'].insert(1, {"key": "blog", "label": "Blog"})
    
    with open(FRESH_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"✅ 已更新 {FRESH_JSON}")

def convert_file(md_path):
    """转换一个 Markdown 文件"""
    filename = os.path.basename(md_path)
    print(f"\n📄 处理: {filename}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    # 解析 frontmatter
    meta, body = parse_frontmatter(raw)
    
    title = meta.get('title', filename.replace('.md', ''))
    title_en = meta.get('titleEn', meta.get('title_en', ''))
    date = meta.get('date')
    if not date:
        # 从文件名取日期：2026-06-15-xxx.md
        date_match = re.match(r'(\d{4}-\d{2}-\d{2})', filename)
        if date_match:
            date = date_match.group(1)
        else:
            date = datetime.now().strftime('%Y-%m-%d')
    
    # 格式化为 MM/DD 显示
    try:
        if hasattr(date, 'strftime'):
            dt = date
            display_date = dt.strftime('%m/%d')
            full_date = dt.strftime('%Y-%m-%d')
        else:
            dt = datetime.strptime(str(date), '%Y-%m-%d')
            display_date = dt.strftime('%m/%d')
            full_date = str(date)
    except:
        display_date = str(date)
        full_date = str(date)
    
    category = get_cat_key(meta.get('category', 'blog'))
    cover = meta.get('cover', meta.get('image', ''))
    tags = meta.get('tags', '')
    
    # 转换正文
    body_html = md_to_html(body)
    
    # 从正文中提取摘要（前 120 字）
    text_only = re.sub(r'<[^>]+>', '', body_html).strip()
    summary = text_only[:120]
    if len(text_only) > 120:
        summary += '...'
    
    summary_en = meta.get('summaryEn', meta.get('summary_en', ''))
    read_time = get_reading_time(body_html)
    
    # 构建文章对象
    article = {
        'id': str(uuid.uuid4())[:8],
        'cat': category,
        'headline': title,
        'headlineEn': title_en,
        'summary': summary,
        'summaryEn': summary_en,
        'body': body_html,
        'bodyEn': meta.get('bodyEn', meta.get('body_en', '')),
        'image': cover,
        'date': display_date,
        'fullDate': full_date,
        'author': 'Vipen',
        'authorInitial': 'V',
        'authorBg': CAT_COLORS.get(category, '#6366f1'),
        'readTime': read_time,
        'tags': tags,
        'likeCount': 0,
        'isLiked': False,
        'commentCount': 0,
        'comments': [],
    }
    
    return article

def convert_all(unprocessed_only=True):
    """转换所有文章"""
    processed = load_processed_log() if unprocessed_only else {}
    fresh = load_fresh_json()
    existing_ids = {item['id'] for item in fresh.get('items', [])}
    
    # 获取所有 .md 文件
    if not os.path.exists(ARTICLES_DIR):
        os.makedirs(ARTICLES_DIR)
        print(f"📁 已创建 {ARTICLES_DIR}，放你的 .md 文件进去")
        return
    
    md_files = sorted([f for f in os.listdir(ARTICLES_DIR) if f.endswith('.md') and f != 'README.md'])
    
    if not md_files:
        print("📂 articles/ 文件夹里没有 .md 文件")
        return
    
    new_articles = []
    for filename in md_files:
        md_path = os.path.join(ARTICLES_DIR, filename)
        file_mtime = os.path.getmtime(md_path)
        
        # 检查是否已处理过
        if unprocessed_only and filename in processed:
            if processed[filename] == file_mtime:
                print(f"⏭️  跳过 {filename}（已处理）")
                continue
        
        article = convert_file(md_path)
        
        # 检查是否已存在
        file_id = f"from:{filename}"
        existing = [i for i in fresh['items'] if i.get('id', '').startswith('from:') and file_id in i.get('id', '')]
        if existing:
            # 更新已存在的
            for i, item in enumerate(fresh['items']):
                if item.get('id', '').startswith('from:') and file_id in item.get('id', ''):
                    article['id'] = item['id']  # 保留原始 id
                    fresh['items'][i] = article
                    print(f"🔄 更新 {filename}")
                    break
        else:
            article['id'] = f"from:{filename}"
            new_articles.append(article)
            print(f"➕ 添加 {filename}")
        
        # 记录处理状态
        processed[filename] = file_mtime
    
    if new_articles:
        # 新文章加在前面（最新的在前）
        fresh['items'] = new_articles + fresh['items']
        print(f"\n📝 新增 {len(new_articles)} 篇文章")
    else:
        print(f"\n📝 没有新文章")
    
    # 确保 categories 里有 blog
    cat_keys = [c['key'] for c in fresh.get('categories', [])]
    if 'blog' not in cat_keys:
        fresh['categories'].insert(1, {"key": "blog", "label": "Blog"})
    
    save_fresh_json(fresh)
    save_processed_log(processed)
    print(f"\n✨ 完成！文章总数: {len(fresh['items'])}")
    print(f"   🌐 部署方式: git push 即可触发 Cloudflare Pages 自动更新")

def main():
    if len(sys.argv) > 1:
        # 处理指定文件
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"❌ 文件不存在: {filepath}")
            sys.exit(1)
        article = convert_file(filepath)
        fresh = load_fresh_json()
        article['id'] = f"from:{os.path.basename(filepath)}"
        fresh['items'].insert(0, article)
        save_fresh_json(fresh)
        print(f"\n✅ 已添加: {article['headline']}")
    else:
        # 批量处理 articles/ 下所有新文件
        convert_all(unprocessed_only=True)

if __name__ == '__main__':
    main()
