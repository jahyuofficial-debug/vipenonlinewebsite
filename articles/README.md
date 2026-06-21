# articles - 文章源文件

把公众号文章的 Markdown 源文件放在这里，然后运行 `run-convert.bat`。

## 文件命名格式

```
YYYY-MM-DD-简短英文标题.md
```

例如：`2026-06-15-ai-era-designer.md`

## Markdown 格式

每篇文章以 `---` frontmatter 开头，包含元信息：

```markdown
---
title: "文章标题"
titleEn: "English Title"        # 可选
date: 2026-06-15                 # 日期
category: blog                   # 分类: blog / ai / music / culture / sports
cover: https://...               # 封面图 URL（放在 R2 上）
tags: AI,设计,思考               # 可选，逗号分隔
---

# 文章大标题

正文写在这里，支持标准 Markdown 语法。

![图片描述](https://pub-xxx.r2.dev/images/photo.jpg)

*图注文字*

## 二级标题

- 列表项
- 列表项

> 引用文字
```

## 图片

图片上传到 Cloudflare R2，然后在 Markdown 里引用 R2 的 URL。

推荐 R2 目录结构：
```
articles/
  ai-era-designer/
    cover.jpg
    image-1.jpg
    image-2.jpg
```

## 工作流程

```
1. 写文章 → articles/xxx.md
2. 上传图片到 R2
3. 双击 run-convert.bat
4. git push（或双击后自动推送）
5. Cloudflare Pages 自动部署
```
