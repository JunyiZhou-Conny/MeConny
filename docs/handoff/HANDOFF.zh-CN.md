# Conny 官网：给下一位 agent 的完整交接

> **GitHub 云端交接补充（2026-09-27）**：本文件最初为 Mac 本地 ZIP 编写。现在用户已要求把交接传到 `claude/website-handoff-docs-sx9xp0`。请先读同目录 [README.md](README.md)：它提供无需 Mac 或 ZIP 的完整恢复命令。此分支的 `web/` 仍是生产基线；完整 demo 保存在 `patches/editorial-demo.patch`，包含所有未跟踪文件和图片。应用后直接编辑根目录 `web/`，不需要文中原 ZIP 的 `demo-source/`。本分支已禁用 Vercel 自动部署；这是资料传递，不是新版网站上线。下文“未 push”描述 demo 原始工作区；资料现已通过本分支交付。旧本机路径、原始 PDF 和完整 ZIP 的素材列表是历史存档位置，不表示云端已挂载；当前 GitHub 实际包含哪些材料以 README 为准。

核查日期：**2026-09-27**。原工作区：`/Users/conny/Documents/Codex/2026-09-15/i-wan/`。

## 1. 目前到底做到哪里了

**官网已经上线，当前是用户选定的睁眼 3D 人物版。最新一轮 Works / About 改版已经做成本地 demo，但没有提交、推送或上线。下一位 agent 应从这个 demo 继续。**

| 版本 | 现在的内容 | 查看位置 | 状态 |
| --- | --- | --- | --- |
| 正式官网 | 睁眼人物、紫衣、微笑、peace sign、四张脸部贴纸；原横向 Works；More about me 仍去旧 `/hub` | [www.connyzhou.com](https://www.connyzhou.com/)；本机 `MeConny-live/` | 已发布；main `62749f9` |
| 最新设计 demo | 保留同一个 3D 人物；更清楚的文字；纵向 Works；实际项目内容；同页 About | 本机 `MeConny-demo/`；启动后 <http://localhost:3023/>；包内 `demo-source/` | 本地设计候选；尚未由用户选定为新版官网 |
| 早期自建版 | 原先独立制作的人物和页面方案 | `MeConny/`，历史端口 3018 | 比较存档 |
| 作者参考版 | 在作者仓库配置上替换 Conny 人物的比较方案 | `my-3d-resume/`，历史端口 3020 | 后来导入正式仓库的参考来源 |
| 睁眼人物制作分支 | 制作、校准人物和脸部贴纸的已合并分支 | `MeConny-portrait/`，历史端口 3022 | 已由 PR14 发布，保留制作记录 |

历史端口不代表这些服务现在都在运行。本次已重新启动 3023，HTTP 200；其他比较服务没有重新启动。

### 本次重新确认的事实

- GitHub `MeConny/main` 仍是 `62749f90f3ff1af836366c1a2f2361e4f264f8a5`，2026-09-17 发布后没有新提交；本机 `MeConny-live` 与之相同且干净。
- 2026-09-27 通过 curl 实际请求：首页 200，`/hub` 200，apex → www、`/hub/` → `/hub`、`/3d` → `/` 正常。
- 线上 GLB 与本机已接受模型完全一致：6,283,724 bytes，SHA-256 `168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01`。
- GitHub 上没有 `codex/editorial-demo` 分支。**只克隆 GitHub 会丢失最新 demo。**
- 今天没有重新执行整套浏览器视觉回归；旧截图和旧通过数都有历史日期。一次 Python 请求的 403 已用成功的 curl 请求澄清，不应据此说官网故障。

原始事实保存在 `reports/current-audit/`，包括机器可读 JSON。

## 2. 我们是怎么走到这里的

1. **早期自建方案。** 按原始 handoff、3D replication spec 和后续 critique 做人物、镜头、贴纸、滚动页面；保留在 `MeConny/`，没有用它覆盖后来的正式版。
2. **作者方案比较。** 用户 fork 了 `JunyiZhou-Conny/my-3d-resume`，要求尽量沿用作者的配置、镜头和设置，换自己的模型。我们制作了 3020 比较版。
3. **接入原有域名。** 用户选定 3020 参考方案替换官网。把对应 Vite 前端导入真正绑定域名的 `MeConny`，继续沿用原来的 Vercel 项目；旧文字网站暂留 `/hub`。
4. **睁眼人物与脸部贴纸。** 用户先保留 wink / peace sign，后来批准睁眼参考图及一次 Fal / Meshy 7 生成，再明确选择睁眼版上官网。我们处理材质和法线、压缩模型、投射脸部贴纸、重新校准相机和手机构图，通过 PR14 发布。
5. **最新阅读体验 demo。** 用户指出文字小、Works 割裂、封面不响应、贴纸不适合大图、About 返回旧站。我们保留人物开场，重做文字、纵向作品单元和同页 About，并根据真实公开项目源码补内容。用户明确要求“不要 host”，所以这轮停在本地设计候选。

## 3. GitHub、Vercel 和 CI/CD 的实际关系

### 哪个仓库负责上线

- **正式源仓库：** [JunyiZhou-Conny/MeConny](https://github.com/JunyiZhou-Conny/MeConny)，生产分支 `main`。
- **参考 fork：** [JunyiZhou-Conny/my-3d-resume](https://github.com/JunyiZhou-Conny/my-3d-resume)，不是当前域名的部署源。
- **上游：** `dayinji/sen-3d-resume`，引入时固定在 `c9a9fe373cde72c77ff7f2dabde17fb79dce89b3`。
- MeConny 已经包含导入的前端；构建时不会临时拉取另一个仓库。

### 发布方式

```text
MeConny 功能分支 / PR
    → Vercel Git integration 自动生成 Preview
    → agent 主动做构建、页面、模型、手机与交互检查
    → 审阅后合并 main
    → Vercel 自动构建 Production
    → connyzhou.com → www.connyzhou.com
    → 再核查真实线上页面和资源
```

Vercel 项目是 **`junyizhou-conny/me-conny`**。`vercel.json` 配置：

| 配置 | 实际值 |
| --- | --- |
| 项目入口 | 仓库根目录 |
| Framework | `vite` |
| Node | 根 `package.json` 要求 `24.x` |
| Install | `npm ci --prefix web` |
| Build | `npm run build --prefix web` |
| Output | `web/dist` |
| Postbuild | `web/scripts/copy-hub.mjs`，处理 hub 和许可证副本 |

**实际运行的是 `web/` 的 React 18 + Vite 应用。根目录 `app/` 的 Next.js / React 19 是归档实现。** 根目录常用 npm 命令转发到 web；不要因为看到 `app/page.tsx` 就在那里改当前首页。

当前主要技术：React 18、TypeScript、Vite 5、Three.js 0.169、React Three Fiber 8、Drei 9、Framer Motion、Zustand。模型和纹理是静态资源，3D 在访客浏览器运行。生成模型时用过 Fal / Meshy；网站运行不需要调用生成 API，也没有为这次官网部署 AWS 后端。

### CI 和 CD 不能混为一谈

- **有自动发布（CD）：** Vercel 接收 GitHub 变化并构建；main 合并触发生产发布。
- **没有当前 GitHub Actions 测试流水线：** main 不含 `.github/`，Actions 里只剩一个 8 月旧分支的 GitHub Pages 失败记录，与现在的 Vercel 发布无关。
- `npm run verify`、Playwright、线上资源校验都是 agent 主动执行；不是每次 push 都被 Actions 强制运行。
- PR14 曾有 Vercel、Cursor Approval Agent、Cursor Bugbot 等 app 检查；不能把这些当成完整自动测试流水线。
- 本次查到 main 没有 branch protection，rulesets 为空。因此不能声称“不通过完整 CI 就绝对不能合并”。

以后若要建立正式 CI，应单独实施并验证。目前交接没有替用户新增 CI 或改变发布权限。

### 已完成的正式发布

| PR | 作用 | 合并后的 commit |
| --- | --- | --- |
| [#12](https://github.com/JunyiZhou-Conny/MeConny/pull/12) | 导入参考 3D 首页，接管官网入口 | `4793b09` |
| [#13](https://github.com/JunyiZhou-Conny/MeConny/pull/13) | 发布文档与 Cloudflare 邮件保护的验证适配 | `611b097` |
| [#14](https://github.com/JunyiZhou-Conny/MeConny/pull/14) | 用户选定的睁眼人物和脸部贴纸 | `62749f9` |

最新 GitHub Production deployment：`6508335903`，2026-09-17 状态 success。[Vercel 记录](https://vercel.com/junyizhou-conny/me-conny/2RuS3ycz6eHNABiyu3aCK6NYCGiT)。独立 deployment 域名目前会要求 Vercel SSO；公开展示使用自定义域名。

域名前面可观察到 Cloudflare，含旧 hub 的邮件混淆。上次发布沿用已有域名指向，没有迁移 DNS。本轮没有审查注册商账号、完整 DNS 控制台、Vercel 环境变量或账单。

旧 PR2–11 仍然开放，属于早期探索。不要为了“清理项目”直接合并它们。旧 wink 生产 commit `611b0970c416cd235afbe8612a2e8e30c4a13b59` 可供比较；此次没有执行或验证回滚。

**官网托管不依赖你的电脑开机。3023 本地 demo 和本机 agent 则依赖电脑运行。** 把文件交给云端 agent，并不自动转移本机进程或账号权限；云端要重新准备运行环境。当前没有为新版 demo 创建云端任务或托管部署。

## 4. 最新 demo 具体改了什么

- 保留用户已经喜欢的睁眼人物和前五个相机停点，没有再次生成模型。
- 正文改为清楚的 sans-serif；桌面约 17px / 26.35px 行高，手机约 16px / 24px。手写风格留给标题。
- 纸色背景稳定文字对比；噪点留在场景下面，文字、按钮、项目画面保持清晰。
- Works 变成自然纵向阅读。Pediatric Savior、speciesOT、Job Search OS、Autoresearch 是主标题，领域退到辅助层级。
- 封面、标题、明确的 case-study 按钮均可打开详情。使用原生 dialog；关闭后恢复焦点和阅读位置；支持 Escape 和键盘。
- 手机内容顺序调整为项目名 → 图片 → 介绍 → 入口 → GitHub。
- About 与作品在同一页，包含背景、研究兴趣、工作方式和联系方式。demo 的 `/hub`、`/hub/`、`/hub.html` 导向 `/#about`；正式线上暂时仍保留旧 hub。
- 尚未选定要公开的最新简历，所以没有强行添加 résumé 按钮。

### 项目画面不是随意生成的示意截图

| 项目 | 来源与真实性边界 |
| --- | --- |
| Pediatric Savior | 从 Airway-Management-Assistant 的实际 React 组件渲染聊天、病例和指令编辑界面，使用空数据；没有连接临床后端，没有真实病人数据，也没有虚构对话 |
| speciesOT | 采用公开仓库完整 v08 transport UMAP 输出；保留 raw/decoded 对照及局限，不能描述为已验证的准确率 |
| Job Search OS | 按当前公开 Simplify ledger、发现、审核、执行和同步流程画图；没有使用个人申请记录 |
| Autoresearch | 按公开实现表达计划、集群执行、观察、反思和下一轮决策；没有捏造未发表实验结果 |

固定来源 commit、引用和重现说明在 `reports/editorial-demo/evidence.md`。四个来源仓库的完整克隆未打包，所需图片与来源已经保留。

## 5. 下一位 agent 应该改哪些文件

以下相对路径以 `MeConny-demo/` 或解压后的 `demo-source/` 为根：

| 目标 | 编辑入口 |
| --- | --- |
| 页面编排、导航、hero、hub 路径处理 | `web/src/App.tsx` |
| 字号、留白、颜色、导航、开场布局 | `web/src/editorial.css` |
| 五段开场叙述 | `web/src/ui/Resume.tsx` |
| 项目介绍、来源、图、详情内容 | `web/src/data/projects.ts` |
| 纵向 Works 和详情交互 | `web/src/ui/Works.tsx`、`Works.css` |
| About | `web/src/ui/About.tsx`、`About.css` |
| 身份和公开联系方式 | `content/site.ts` |
| 3D 滚动相机与 Works 过渡 | `web/src/scene/Scene.tsx` |
| 噪点层 | `web/src/ui/NoiseOverlay.tsx` |
| 生成后的 hub 兼容入口 | `web/scripts/copy-hub.mjs` |

`web/src/main.tsx` 先导入基础 CSS，再导入 App；不要无意改回旧顺序覆盖新版字体。旧 `data/works.ts`、Markdown work docs 和根 README 留有历史内容，不是新版项目文案的主要入口。

### 需要保住的 3D 接口

- `.tl-entry[data-point]`、`.tl-body` 和 `FOCUS_POINTS` 中的 `focus-1` 到 `focus-5` 关联滚动与镜头。
- 前五个镜头段每段 50 帧，合计前 250 帧；entry 顶端到约 30vh 时控制相机停点。
- 移动端依据实际卡片高度调整构图。更改文字、字体和间距后，需要复查 375×667，不能只看桌面。
- `.wk-gallery` 仍被 Scene 使用，即使新版已改为纵向。
- demo 的 Works 过渡改为按纵向进入，约 0.55 个视口高度完成相机收束。不要直接删除旧选择器或把滚动坐标改成任意动画时间。

## 6. 人物、贴纸与可复用素材

### 已做好且保存在源码里的部分

- `web/public/models/me.glb`：当前最终运行场景，约 6.28 MB，包含人物、脸部贴纸、镜头、焦点和动画数据。
- `assets/portrait/conny-character.glb`：准备后的纯人物输入，约 5.96 MB。
- `assets/portrait/reference.jpg`：用户批准的睁眼参考图。
- `web/public/stickers/`：pulse、dna、hub、chip 四个使用中的贴纸，以及 bike、headphones 备用素材。
- `web/scripts/portrait-calibration.json`：尺度、贴纸、相机、焦点配置。
- `build-portrait-scene.mjs`、`calibrate-portrait-camera.mjs`：重建和校准工具。
- `docs/portrait/README.md`、`provenance.json`：生成、压缩、法线、材质、来源、哈希和复现步骤。

用户批准过一次报价 $0.80 的 Fal / Meshy 7 image-to-3D 生成。后处理保留几何、处理法线、去掉不良 normal map、调整 roughness / metalness，使用 2048 WebP 纹理。模型约 185,765 个人物三角面及 524 个贴纸三角面。

脸部贴纸已经是真实的浅层投射几何，**调整它们不必先用 Blender**。人物眼睛是静态纹理网格；没有独立眼球、眨眼、gaze tracking 或完整人物骨骼动画。鼻口、领口、手部的生成网格瑕疵仍可看到。若下一轮专门改善人物拓扑，那是独立建模工作。

原始生成的 21.7 MB GLB 和 1.7 MB 作者场景输入在包内 `model-authoring/`；只做页面文案、Works、About 无需重新处理它们。重建用 portrait 工具，不要误用旧 `build-reference-scene.mjs` 恢复 wink / 衣服贴纸。两个 portrait 工具要求新的输出路径，以保留输入。

完整路径、SHA-256 和截图清单见 `reports/current-audit/artifact-inventory.md`。

### 来源与许可

保留 `docs/reference/LICENSE`、`NOTICE` 和字体 SIL OFL 文件。参考代码许可不自动授予原作者人物、肖像和品牌素材的复用权；运行人物和个人内容已经换成 Conny。构建会发布 scene / font notices。

继承的 `web/public/textures/env.hdr` 来源许可尚未补齐，是已知待办；后续发布前可补证据或换成来源明确的环境素材。本交接没有把这个未知项标记为已解决。

## 7. 之前我是怎样运作的

### poteto-mode / pstack

用户要求安装技能时，把完整技能目录放到 `MeConny/.agents/skills/<name>/SKILL.md`，保留原文、references 和 playbooks，没有把整个 Cursor plugins 仓库塞进项目。Codex 的发现目录是 `.agents/skills/`。

当前包的 `workflow/pstack-skills/` 保留完整 47 个目录。原本它们只在早期工作区，不在当前生产 Git 树中；交接包把它们单独带上。新 agent 如要继续使用，在目标仓库创建 `.agents/skills/` 并复制每个目录，已有同名技能跳过，保留原文，不重写 playbook。技能指令不能覆盖用户当前“本地审阅、不要部署”的要求。

### 实际工作节奏

1. 读 critique、源码和现有页面，先分清事实、建议、已接受决定。
2. 用独立 Git worktree 保留生产和比较版本，避免一个实验覆盖另一版。
3. 将可独立的来源核查、页面结构、About、人物检查、审查分给不同 agent；主 agent 负责整体集成和 3D / 滚动关系。
4. 先验证一个完整作品单元，再扩展到其他项目；优先阅读、点击和内容真实性（Experience First）。
5. 用项目数据表集中管理内容（Model the Domain），实际运行页面、检查手机和交互、保存证据（Prove It Works）。
6. 用独立审查发现问题，修订后做针对性复查；把决策和局限记录下来，而不是只交一张效果图。

记录集中在 `reports/editorial-demo/`：plan、architecture、decisions、evidence、verification、final-checks、final-review。早期 `review.md` 是中间审查，以后续 final 记录为准。

## 8. 验证到什么程度，哪里还没验证

| 时间 / 版本 | 保存的证据 | 能证明什么 |
| --- | --- | --- |
| 2026-09-17 正式睁眼发布 | lint、build、30 项产物检查；72 项线上资源/路由检查；169 项浏览器检查；33 张截图 | 当时发布的桌面、390×844 和 375×667 行为 |
| 2026-09-18 本地 demo | 155 项主检查；最后 DOM 调整后 85 项专项检查；2 项字面 hash 刷新检查；32 张截图 | 当时本地设计和最终改变部分的交互；无运行时错误 |
| 2026-09-27 本次交接 | GitHub / Vercel 记录、线上 HTTP / 模型哈希、源文件和包完整性、本地服务 HTTP 200 | 当前版本身份和交接没有遗漏；不是整套视觉回归重跑 |

155 项主检查发生在最后 DOM 调整之前，不能单独称为最终全部回归。独立 final-review 给本地设计方向 PASS，并不表示可以直接上线。

### 重要：demo 的生产验证尚未迁移

根 `npm run verify` 会调用旧 `verify-publication.mjs`，里面仍有旧源码哈希和旧 hub 的约束。另外，独立浏览器脚本 `verify-reference.mjs` 保留旧横向 Works 和详情交互的假设，根 `npm run verify` 不会执行它。**不能声称最新 demo 已通过这两套生产合约。** 正式化时要有意更新合约，保留真实行为和资源检查；不要简单删掉失败项。

当前可先运行：

```bash
npm run lint --prefix web
npm run build --prefix web
```

demo 浏览器脚本在 `reports/editorial-demo/verify-demo.mjs` 和 `verify-project-flow.mjs`；原位置在仓库外 `work/editorial-demo/`。它们硬编码了本机 Playwright 路径、工作区和部分端口，**移机先参数化路径再运行**。不能原封不动宣称已在云端重现。

### 下一轮值得继续打磨

- 3D 叙述进入 Works 的节奏，尤其小手机最后一张桥接卡目前覆盖较多人物脸部。
- 让项目文案更凝练，职责、方法、产出更容易扫读；继续以真实源码和可核实证据为准。
- 桌面更宽屏、长内容、键盘和窄屏的完整回归；demo 现有桌面记录没有覆盖超过 1280px 的尺寸。
- 选定当前公开简历后再加入口。
- 若用户决定上线，再处理生产验证、CI、来源许可和发布步骤；不要把设计稿通过等同于正式发布通过。

## 9. 最快的接手方式

### 在这台电脑

直接使用 `MeConny-demo/`。其中 8 个 tracked 文件修改、10 个 untracked 文件都属于这轮 demo；不要清理或覆盖。它的 `web/node_modules` 链接到 `MeConny-live/web/node_modules`。

```bash
cd /Users/conny/Documents/Codex/2026-09-15/i-wan/MeConny-demo
npm run dev --prefix web -- --host 127.0.0.1 --port 3023 --strictPort
```

若 3023 已在运行，直接打开页面，不要误杀其他项目的服务。

### 在另一台电脑 / 另一个模型的沙箱

交给它整个 ZIP。按包内 README 安装 Node 24 和 `web/` 依赖，启动 `demo-source/`。若需要 Git 历史，从生产基线 `62749f9` 创建本地分支，应用包含 untracked 文件的完整 patch。本次已经用干净的基线重建并对照快照验证 patch 完整性，详见 `VERIFICATION.md`。

先看正式官网，再看 demo 的 hero、Pediatric Savior 单元、详情和 About。确认自己启动的是正确版本后，再做小步修改。修改后重复验证最受影响的阅读和操作流程。

**下一轮仍以本地设计审阅为边界。未经新的用户上线指示，不 push、不合并、不部署，也不生成付费模型。** 用户已经明确选定睁眼人物，优先保留并改善页面衔接。

## 10. 交接包之外还保留了什么

本机 `WEBSITE-WORKSPACE.md` 是多版本入口索引。完整生产复现和发布文档在 `MeConny-live/docs/publication.md`，快照也带有同一份文件；以后源码变化时要随之更新。

最初 Downloads/Desktop 的多份 PDF、handoff 文件夹和原 wink GLB 已不在原给定路径，未做全盘搜索。早期提取文字仍在，已选入 `historical-briefs/`；bust review PDF 原件也已收入。提取文字不保留 PDF 版面和图片。旧 `outputs/handoff-summary.md` 描述更早阶段，其“未上线”等结论已过时。

没有打包全部中间 GLB、Blender 工具、四个项目的完整源码克隆、node_modules 或 Git 对象库。包含的最终模型、准备后人物、原始生成输入、来源、最新源码和验证材料足够继续这轮页面设计；如需要重新渲染项目界面，再按固定 commit 拉取对应公开项目。
