# AI Office Showcase

AI Office Showcase 是一个静态前端演示项目，用于集中展示多款 AI 办公产品页面与统一总览首页。

## 项目结构

- `index.html`：总览首页（产品导航、概览介绍）
- `styles.css` / `main.js` / `presentation.css` / `presentation.js`：首页样式与交互
- `projects/`：各产品正式展示页（当前主版本）
  - `insightflow/`
  - `officehub/`
  - `readmind/`
  - `testmind/`
  - `listenmind/`
  - `ecoasset/`
  - `supervision/`
- `assets/`、`图片/`：静态资源

## 版本说明

当前仓库以 `projects/*/index.html` 作为各产品页主版本。历史或临时版本请放在非发布目录中，避免与主版本混用。

## 本地运行

推荐使用任意静态服务器启动（以 Python 为例）：

```bash
python3 -m http.server 8080
```

打开：

- 首页：`http://localhost:8080/index.html`
- 产品页示例：`http://localhost:8080/projects/officehub/index.html`

## Git 约定

- 汇报稿类文件（如 `汇报稿*.docx`）已在 `.gitignore` 中忽略，不会提交到远端。
- 建议所有新增产品页统一放在 `projects/<product>/` 下，便于维护与发布。
