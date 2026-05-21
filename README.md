# AI Office Showcase

AI Office Showcase 是一个面向企业场景的 AI 办公产品展示站，聚焦“阅读、学习、会议、流程与管理”五类核心办公任务，提供统一入口与分产品沉浸式演示页。

## 在线访问

- GitHub Pages（启用后）：`https://tinywhite1867.github.io/ai-office-showcase/`

## 产品矩阵

- `InsightFlow`：思路沉淀与文字工作流
- `OfficeHub`：智能管理中台（空间/办公协同）
- `ReadMind`：AI 辅助阅读与知识吸收
- `TestMind`：学习训练与语音陪练
- `ListenMind`：会议分析与决策辅助
- `EcoAsset`：环资流系统展示
- `Supervision`：监督与执行闭环场景

## 项目亮点

- 一站式产品总览：首页承载统一叙事、产品定位与导航入口
- 单产品深度体验：每个产品独立页面，支持单独演示与传播
- 纯静态部署：无需后端即可上线，适合低成本公开展示
- 对外友好：适用于路演、招聘、合作沟通与方案介绍

## 技术实现

- 基础栈：`HTML` + `CSS` + `JavaScript`
- 架构形式：多页面静态站（`index.html` + `projects/*/index.html`）
- 发布方式：GitHub Pages（推荐）或任意静态托管服务

## 目录结构

- `index.html`：总览首页
- `projects/`：各产品正式展示页
- `styles.css` / `main.js`：首页核心样式与交互
- `presentation.css` / `presentation.js`：展示增强样式与脚本

## 本地预览

```bash
python3 -m http.server 8080
```

- 首页：`http://localhost:8080/index.html`
- 示例：`http://localhost:8080/projects/officehub/index.html`

## 维护说明

- 历史归档、重资源与汇报稿已配置为本地保留，不进入公开仓库
- 新增产品建议使用 `projects/<product>/index.html` 的统一结构，便于持续扩展
