# 网站素材与证据交接清单

核查日期：2026-09-27。此次只检查文件、Git 跟踪状态和已保存报告，没有重跑浏览器、构建或线上验证。下文的测试通过记录明确属于 2026-09-17 / 18 的历史结果。

路径前缀统一为 `/Users/conny/Documents/Codex/2026-09-15/i-wan/`。

## 1. 先区分三个阶段

| 内容 | 位置 | 用途与状态 |
| --- | --- | --- |
| 目前已发布网站的源码与素材 | `MeConny-live/`，实际前端在 `web/` | Git 已提交的生产来源。部署与远端最新状态由主交接文档另行核查。 |
| 最新设计 demo | `MeConny-demo/` | 保留睁眼 3D 开场，改为纵向 Works、真实项目证据和同页 About。**仍有未提交修改及未跟踪新文件**，不应只交付仓库 URL。 |
| 早期比较版本 | `MeConny/`、`my-3d-resume/` | 保留原先自建方案和参考作者方案。它们不是当前生产编辑入口。 |

`WEBSITE-WORKSPACE.md` 是工作区索引。`MeConny-demo/DEMO.md` 是 demo 启动与范围说明。旧 `outputs/handoff-summary.md` 是更早的阶段记录，其“人物未重建 / 生产未改变”等结论已被后来发布覆盖，不要当作当前状态。

## 2. 最值得交给下一位 agent 的成品

### 最新本地 demo

- 源码：`MeConny-demo/web/`。
- 项目数据：`MeConny-demo/web/src/data/projects.ts`。
- Works 布局与详情：`MeConny-demo/web/src/ui/Works.tsx`、`Works.css`。
- About：`MeConny-demo/web/src/ui/About.tsx`、`About.css`；身份和公开联系方式来自 `MeConny-demo/content/site.ts`。
- 页面编排与整体样式：`MeConny-demo/web/src/App.tsx`、`editorial.css`。
- 3D 与 Works 的衔接：`MeConny-demo/web/src/scene/Scene.tsx`。
- 同页 About 与旧 `/hub` 兼容：`App.tsx` 和 `web/scripts/copy-hub.mjs`。
- 四张项目图片：`MeConny-demo/web/public/projects/`。

2026-09-27 读取的 `git status --short` 显示，修改但未提交的文件有 `web/index.html`、`web/scripts/copy-hub.mjs`、`web/src/App.tsx`、`web/src/main.tsx`、`web/src/scene/Scene.tsx`、`web/src/ui/NoiseOverlay.tsx`、`web/src/ui/Resume.tsx`、`web/src/ui/Works.tsx`。未跟踪内容有 `DEMO.md`、`web/public/projects/`、`projects.ts`、`editorial.css`、`About.tsx`、`About.css`、`Works.css`。交接包必须同时覆盖 tracked diff 与 untracked files。

本地曾使用 `http://localhost:3023/`。本次不证明服务当前仍在运行。启动命令为在 `MeConny-demo/` 下运行：

```bash
npm run dev --prefix web -- --host 127.0.0.1 --port 3023 --strictPort
```

Node.js 24。此电脑的 `MeConny-demo/web/node_modules` 是到 `../../MeConny-live/web/node_modules` 的符号链接。迁移到别的电脑时不要依赖它，使用 `web/package-lock.json` 和 `npm ci --prefix web` 安装依赖。

### 可以直接查看的视觉证据

最新 demo 的 32 张截图位于 `outputs/editorial-demo/verification/`，优先看：

- `desktop-hero.png`、`phone-hero.png`：开场。
- `desktop-project-1.png`、`phone-project-1.png`：Pediatric Savior 完整作品单元。
- `desktop-project-2.png`：speciesOT。
- `desktop-project-3.png`、`desktop-project-4.png`：两个工程项目。
- `desktop-clinical-dialog.png`、`phone-clinical-dialog.png`：项目详情。
- `desktop-about.png`、`phone-about.png`：About。
- `compact-phone-story-5.png`：小手机的最后一个人物段落，是已知可进一步打磨的重叠处。

已发布睁眼版的 33 张历史截图位于 `outputs/live-site-next/portrait-production/`。其中 `desktop-hero.png`、`desktop-works.png`、`phone-hero.png` 适合与 demo 比较。截图不是实时线上状态证明。

## 3. 可复用 3D 人物、贴纸、镜头与作者工具

| 文件 | 用途 | 保存状态 |
| --- | --- | --- |
| `MeConny-live/web/public/models/me.glb` | 已接受的睁眼版完整运行场景，含人物、脸部贴纸、镜头、动画与焦点 | 已提交；demo 有完全相同副本 |
| `MeConny-live/assets/portrait/conny-character.glb` | 平滑法线与材质处理后的纯人物输入，可重新放贴纸 | 已提交 |
| `MeConny-live/assets/portrait/reference.jpg` | 用户批准的睁眼参考图 | 已提交 |
| `MeConny-live/web/public/stickers/*-illustrated.webp` | pulse、dna、hub、chip，加 bike、headphones 备用插画 | 已提交 |
| `MeConny-live/web/scripts/portrait-calibration.json` | 人物尺度、脸部贴纸定位、相机和对焦修正 | 已提交 |
| `MeConny-live/web/scripts/build-portrait-scene.mjs` | 将参考场景的镜头/焦点与 Conny 人物组合，并投射浅层贴纸几何 | 已提交 |
| `MeConny-live/web/scripts/calibrate-portrait-camera.mjs` | 独立相机/焦点校准后处理 | 已提交 |
| `MeConny-live/docs/portrait/README.md`、`provenance.json` | 可复现步骤、来源哈希、材质决策、限制与历史验证 | 已提交 |
| `MeConny-live/docs/reference/scene-contract.json` | 参考场景、模型及依赖的验证约束 | 已提交 |
| `MeConny-live/web/public/textures/env.hdr` | 继承的 HDR 环境光素材 | 已提交；来源许可仍待确认 |
| `work/reference-comparison/source/upstream-me.glb` | 重建时使用的原作者不可变镜头输入 | 仅本地档案；不是要公开复用的作者人物 |
| `work/live-site-next/portrait/conny-open-eyes-original.glb` | Fal / Meshy 7 原始生成结果，尚未做网站材质压缩 | 仅本地档案 |
| `work/live-site-next/portrait/` | 法线、材质、镜头、动画研究的中间 GLB、PNG、脚本与报告 | 仅本地研究档案；不要把任意中间模型当最终模型 |

本次实际重算的 SHA-256：

```text
最终模型：6,283,724 bytes
168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01

准备后人物：5,956,512 bytes
440fa132ff3b87beff432508fd7a6b3c94c303395aecc204e2f502bac8a650b3

批准参考图：288,646 bytes
bb0699b54c6925cdd32e246a6a3598f63e634402a753fa4f66ed8acb152f770b

原始生成模型：21,704,520 bytes
1b8dea2b1373092e9deeefa47bd56bc3453017bdc2abdb7eac6f01253172db2b

原作者镜头输入：1,735,396 bytes
77e8cf1ef81943c81cbe6f1c5f65048ccaecc4f001f12fc60857d3f38e4229ef
```

最终模型包含 185,765 个人物三角面、524 个贴纸三角面。紫色上衣、微笑、peace sign 保留。脸部贴纸是真实浅层投射几何，无需 Blender 就能调位置。双眼是静态带纹理网格，**没有独立眼球、眨眼或视线追踪**。鼻口小块面、领口和手部接缝仍存在，未人工重新拓扑。不要把滚动相机动画误称为人物骨骼动画。

用户此前批准一次 $0.80 报价的 Fal / Meshy 7 生成。生成记录保存在 provenance；这里不表示后续生成已获授权。

前一个 wink / 衣服贴纸版留在 Git 历史 `611b0970c416cd235afbe8612a2e8e30c4a13b59`。`build-reference-scene.mjs` 对应该旧流程，当前睁眼版应使用 portrait 工具。两个 portrait 脚本要求新的输出路径，保护输入不被覆盖。

## 4. 项目内容与图片来源

详细证据：`work/editorial-demo/evidence.md`。当时检出的公开项目源码在 `work/editorial-demo/sources/`，属于审查输入，不需要整个复制到网站仓库。

| 项目 | 固定来源 commit | 网站采用的证据 |
| --- | --- | --- |
| Pediatric Savior / Airway-Management-Assistant | `9edcba81b3535c37852a89d2f6b6fac273843d6b` | 原项目 React 界面在隔离本地 harness 中运行，后端使用空 fixture，得到 chat、case editor、instruction editor 三张图。没有真实病人信息，也不是在线临床服务截图。 |
| speciesOT | `109bf12648ec48ea679a3fbd7646752f1cf7cde4` | 未改动的完整 v08 transport UMAP 图，保留 raw/decoded 对照及原有 caveat。探索性研究输出，不是验证过的准确率证明。 |
| Job Search OS | `28f5f31daea1d48c066ca8a09769d26cfb45236b` | 根据实际公开实现绘制工作流，Simplify 是 application ledger，repo 是策略/记忆层。没有复制个人申请记录。 |
| scGen / CellOT Autoresearch | `5d1a7d9f6dc065536ad567e7f15258c013dac3f8` | 根据公开实现绘制 planning / agenda / cluster execution 工作流。没有伪造未发表研究结果、性能图或实验行。 |

原始证据图片在 `outputs/editorial-demo/evidence-assets/`。网站的四张 PNG 是它们的副本。Pediatric 渲染工具为 `work/editorial-demo/render-pediatric.mjs`，harness 与捕获元数据在 `work/editorial-demo/pediatric-harness/`。这是源代码渲染的真实 UI 状态，不应添加虚构对话让人误以为是真实运行记录。

## 5. 历史验证与下一轮应该更新的边界

### 生产版历史记录（2026-09-17）

- `MeConny-live/docs/portrait/README.md` 记录构建、lint、30 项产物检查通过；lint 当时有 5 个已存在 warning。
- `outputs/live-site-next/portrait-production/results.json` 记录 2026-09-17T17:23:35Z 至 17:25:09Z 对 `https://www.connyzhou.com` 的 169 项桌面/手机/小手机浏览器检查与 33 张截图。
- 生产工具 `web/scripts/verify-reference.mjs` 包含五个镜头停点、横向 Works、四详情、焦点/贴纸/手机遮挡等约束。
- `web/scripts/verify-publication.mjs` 包含 source hash、Vercel 路由、旧 hub、许可证等检查。根目录 `npm run verify` 会串联 lint、build 和这些发布产物检查。

### 本地 demo 历史记录（2026-09-18）

- `work/editorial-demo/verification.md`：155 项主流程通过；最终 DOM 顺序调整后，85 项专项复查通过；字体载入后的字面 hash reload 2 项通过。
- JSON 在 `outputs/editorial-demo/verification/{results.json,project-flow-results.json,deep-link-refresh.json}`。
- 155 项通过在最后的阅读顺序调整之前，不能单独作为最终版本证明。85 项复查覆盖最后改变的几何、键盘顺序、封面激活、回焦、滚动位置和运行错误。
- `work/editorial-demo/final-review.md`：独立审查对“本地设计决策”给出 PASS，明确不是部署就绪证明。
- `work/editorial-demo/final-checks.md`：最后人工浏览器观察、模型一致性和生产工作区未变更。
- 本次核查确认这些记录存在，但没有重跑。未来更改后应重新观察，而不是引用旧通过数。

Demo 自己的脚本在 `work/editorial-demo/verify-demo.mjs`、`verify-project-flow.mjs`，**不在应用仓库内**，并硬编码了本机工作区/Playwright/部分 URL。移机或修改端口要先改配置。Demo 延续的生产验证脚本仍描述旧的横向 Works、旧 hub 和 source hash 合约；如果将新设计正式化，需要有意更新这些合约，不能为让它“变绿”而删除约束，也不能认为 demo 的 `npm run verify` 已经通过。

已知仍可完善：当前公开 résumé 尚未选定，所以没有简历按钮；小手机最后的全身桥接卡仍覆盖人物大半脸，但没有挡住四个贴纸目标；记录未覆盖超过 1280px 的 demo 桌面宽度；生成模型细节仍有限制；没有真实临床后端、未发表研究数据、分析统计、部署预览方面的 demo 验证。

## 6. 许可与来源边界

- 原参考代码来自 `dayinji/sen-3d-resume`，通过用户 fork `JunyiZhou-Conny/my-3d-resume` 引入。`MeConny-live/docs/reference/LICENSE`、`NOTICE` 原样保留。MIT 适用于场景源码，**不覆盖作者人物、肖像、简历、项目内容和品牌素材**。
- 当前人物、人物纹理、贴纸、文案已替换为 Conny 的内容。原作者 Blender 源没有作为 Conny 的模型源引入。
- Cormorant Upright / Mansalva 的 SIL OFL 许可证与固定来源在 `docs/reference/fonts/`。构建会把 scene 和 font notices 发布到 `/licenses/scene/`、`/licenses/fonts/`。
- `env.hdr` 的来源许可在原 NOTICE 中仍标为待确认；文档没有假定它已经获得新许可。后续公开分发应补齐来源或替换为来源明确的环境素材。

## 7. 原始用户资料现在是否还在

本次仅检查用户曾给的准确路径，没有搜索整个个人目录。

仍在：`/Users/conny/Documents/Codex/2026-09-16/can-x20/outputs/Conny_Bust_Aesthetics_and_Motion_Review.pdf`（1,528,976 bytes）。

下列原始路径已经不存在：

- `/Users/conny/Downloads/intro3d-replication-spec.pdf`
- `/Users/conny/Desktop/astra-handoff.pdf`
- `/Users/conny/Downloads/intro3d-critique.pdf`
- `/Users/conny/Downloads/intro3d-critique-v2.pdf`
- `/Users/conny/Downloads/3d_resume_handoff/`
- `/Users/conny/Downloads/3D_Resume_Agent_Handoff.md`
- `/Users/conny/Downloads/DOWNLOADS.html`
- `/Users/conny/Downloads/Zu66ZA7jiK5kTqkpg82Xe_model.glb`

工作区仍保存早期提取文字，可继续参考：`work/intro3d-replication-spec.txt`、`work/astra-handoff.txt`、`work/intro3d-critique.txt`、`work/critique-v2/critique-v2/text.txt`、`work/critique-v2/bust-motion/text.txt`。它们不替代 PDF 的版面与图片证据。当前已提交的 prepared character 和最终 GLB 完整存在，因此原 Downloads GLB 缺失并不阻止继续改网站。

## 8. 交接最小集合

1. 当前 MeConny 生产 Git 来源及 `docs/publication.md`、`docs/portrait/`。
2. 完整 `MeConny-demo` 改动（包括所有未跟踪文件），不是只有分支名。
3. `work/editorial-demo/` 中 plan、architecture、evidence、verification、final-review、final-checks、decisions.tsv 与两个验证脚本。
4. `outputs/editorial-demo/verification/` 和 `evidence-assets/`。
5. 如需继续人物制作，再带 raw generated GLB 和原作者镜头输入；只做文字、布局、Works/About 不需要复制全部中间模型、Blender 程序或四个项目的完整源码克隆。

下一位 agent 应先比较生产和 demo，再从 demo 接着打磨。此前明确授权的是“本地设计，不部署”。交接本身不等于新的上线授权。
