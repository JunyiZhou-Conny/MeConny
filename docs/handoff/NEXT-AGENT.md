# 可复制给下一位模型的任务说明

请继续实现网站设计改进，而不是只提交交接文档。交接文档已在本分支准备好。先读同目录 `README.md` 和 `HANDOFF.zh-CN.md`，按 README 在当前仓库应用完整 demo patch、启动并检查它，然后在 `web/` 继续精修。不要只根据旧报告推断现状。

## 当前状态

- 正式官网是 https://www.connyzhou.com/，源仓库 `JunyiZhou-Conny/MeConny`，2026-09-27 核查 main 为 `62749f90f3ff1af836366c1a2f2361e4f264f8a5`。Vercel Git integration 发布 `web/` 的 Vite 应用。
- 我已经选定睁眼、紫衣、微笑、peace sign 和脸部贴纸的人物。保留这套人物与 3D 开场，不要无故重新生成。
- 最新设计原在 Mac 的 `MeConny-demo/`。现在它的完整 patch 位于本仓库 `docs/handoff/patches/editorial-demo.patch`，包含纵向 Works、真实项目画面、清楚文字和同页 About。此资料分支尚未将 patch 应用到 `web/`，需先恢复；克隆 main 本身仍然只有正式版。无需访问 Mac 或下载完整 ZIP。
- 根目录 Next.js 文件属于归档。当前编辑入口是 `web/src/`，新版项目数据在 `web/src/data/projects.ts`。

## 设计方向

1. 保留人物和手写标题的个性，让正文和辅助信息更清楚、对比稳定。
2. 让 3D 开场、研究方向、Works、About、联系方式自然连贯；沿用纸色、鼠尾草绿和深绿。
3. 让具体项目名、真实内容和清晰入口承担视觉重点。保留纵向阅读，封面和标题均可点击。
4. 精修 Pediatric Savior 的完整作品单元，再把一致的改进推广到其他项目。
5. 使用真实项目证据。Pediatric 画面来自原源码空状态；speciesOT 是公开探索性图；两个工程项目是依据实现绘制的流程。不要编造对话、指标、实验结果或我的经历。
6. About 留在当前页面；简历文件还没有选定，不要替我猜一个旧简历。

## 工作方式和范围

用 poteto-mode 的 Experience First / Prove It Works 思路，小步实现、实际浏览、审查并修正。本仓库 `docs/handoff/workflow/pstack-skills/` 可复制到目标仓库 `.agents/skills/`，保持目录与 SKILL.md / references / playbooks 原样，已有同名技能跳过。

先启动 demo，观察桌面和 375×667 手机的 3D→Works 衔接、项目详情、键盘、关闭回焦、滚动恢复和 About；特别关注小手机最后一张桥接卡覆盖人物脸部的问题。保护五个 focus 点和 Scene 使用的 DOM hooks。

完成修改后运行适当的 lint/build 和浏览器验证。历史报告的 155 / 85 / 2 项检查不是你修改后的通过证据。`docs/handoff/reports/editorial-demo/` 的浏览器脚本有原电脑硬编码路径，先适配。生产 `npm run verify` 仍描述旧页面合约，不能盲目引用或删除检查来变绿。

**本轮先让我审阅运行在开发环境的 demo，不要部署、合并 main、创建托管 Preview 或执行新的付费生成。** 用户这次授权的是把交接资料推送到此指定分支；这不等于授权发布网站。该分支在 `vercel.json` 的 `git.deploymentEnabled` 中为 false，请保留这个限制。未来若要把设计改动推送到其他分支，先核对用户授权和该分支的部署行为。

最终请给我可查看的本地版本、说明改进了什么、真实测试了什么，以及还需我判断的设计选择。保留已接受的作品和已有证据，避免从零做一套无关设计。
