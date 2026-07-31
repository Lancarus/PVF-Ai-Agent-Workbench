# PVF-Agent-Workbench

这是给桌面 Agent 使用的干净、自包含 PVF 工作区。把 Codex、Claude Code、OpenCode、Trae 等工具的工作区指向这个目录后，Agent 可以读取这里的规则、运行本地命令，并通过随包内置的 PVF 后端检查 PVF。

当前便携发行目标是 **64 位 Windows**。Node.js 已随包携带，普通任务不需要 npm、联网下载、外部 MCP 或已下架插件。工作台默认使用功能完整的 native backend；如果它因 Microsoft Visual C++ v14 runtime 等加载问题不可用，会自动切换到随包的纯 JavaScript 只读备用后端。此时文件列表、读取、注册表解析和搜索仍可用，但所有 PVF 写入与备份都会以 `READ_ONLY_FALLBACK` 硬阻断。`workbench.bat check` 会明确显示降级状态和微软官方链接；人工交互终端会打开官方说明页，Agent 和自动化中不会强开浏览器。

## 先读

1. `AGENTS.md`
2. `knowledge-pack/README.zh-CN.md`
3. `knowledge-pack/safety/README.zh-CN.md`
4. `knowledge-pack/indexes/knowledge-index.json`
5. 按路由读取 `knowledge-pack/encyclopedia/`、`knowledge-pack/dictionaries/`、`knowledge-pack/workflows/` 或 `knowledge-pack/task-cards/`

## 第一次使用

如果你是第一次使用 AI Agent 修改 PVF，可以先把 Agent 的工作区指向本目录，然后对 Agent 说：

```text
请先只读 AGENTS.md、knowledge-pack/README.zh-CN.md、knowledge-pack/safety/README.zh-CN.md 和 knowledge-pack/indexes/knowledge-index.json。
读完后告诉我：
1. 这个工作台是做什么的
2. 你需要我提供哪些信息才能开始 PVF 修改
3. 本次任务应该先只读、dry-run，还是可以准备输出 PVF
```

通常你只需要继续提供：

- 目标 `Script.pvf` 路径
- 想修改的内容，例如技能参数、NPC 商店、装备、礼包、宠物、宝珠、副本或 APC
- 是否允许生成新的输出 PVF
- 是否会进行实机测试

新手建议从只读查询、NPC 商店、简单技能参数或装备字段开始；不建议第一步就做副本导入、客户端资源或 NUT/SQR 逻辑修改。

普通任务统一使用根目录唯一入口 `workbench.bat` 完成只读检查、索引、dry-run 和受控输出。无需安装或配置已经下架的 VSCode 插件、`pvf_bridge` MCP 或 TypeSquirrel；NUT 声明、PVF tag 注释和常用任务书签已编译进干净知识包。

副本与世界任务也已内置标准化知识路线：地图宽屏补全、worldmap 副本接口布局、深渊组可视化、难度表、地狱名单、城镇预览和 ANI 都能由 Agent 从干净 Workbench 直接学习并形成只读迁移计划，不需要另外携带原工具或资料目录。

其他产品化能力也已做完整分级：全包脚本质检、双 PVF 语义对比与结果集、通用 LST 生命周期、独立掉落规范化、物品来源反查、技能树布局 / 合并和任务 / 礼盒 / 徽章 / 装备复制的原子生成都有随包工作流。加解密、加雷、认证、账号 / GM 和 NPK 写入不会混入普通 PVF 任务。

## Agent Skill

Workbench 自带项目级 `.agents/skills/dnf-pvf-xpilot`。支持 Agent Skills 的宿主可以在打开本目录时自动发现；不支持 Skill 的宿主仍可读取 `AGENTS.md` 并使用全部 Workbench 命令。

需要让 Codex 在其他工作目录也能调用这个 Workbench 时，可以选择安装用户级适配器：

```bat
workbench.bat skill status --client codex
workbench.bat skill install --client codex
```

跨客户端通用位置使用 `--client agents`，目标为当前用户的 `.agents/skills`。安装器不会默认覆盖已有的外部同名 Skill；只有用户明确确认后才应使用 `--force`，原目录会先保留为时间戳备份。Workbench 移动目录后需要重新运行安装命令，以更新安装副本记录的 Workbench 路径。

## 常用命令

根目录固定只保留 10 个发行与入口文件：`.gitattributes`、`.gitignore`、`AGENTS.md`、`CHANGELOG.zh-CN.md`、`LICENSE`、`LICENSE-KNOWLEDGE-CC0.md`、`README.md`、`README.zh-CN.md`、`VERSION` 和 `workbench.bat`。`workbench.bat check` 会阻止新的实现文件重新堆回根目录。

```bat
workbench.bat help
workbench.bat check
workbench.bat runtime-help --open
workbench.bat fallback-self-test
workbench.bat profile status
workbench.bat profile init --name main-local --workspace "D:\MyDNFWork" --source-pvf "D:\MyDNFWork\Script.pvf" --output "D:\MyDNFWork\pvf-lab" --client "D:\MyDNFWork\client" --set-active
workbench.bat pvf-read list-files --pvf "D:\MyDNFWork\Script.pvf" --prefix itemshop --limit 5
workbench.bat pvf-read read --pvf "D:\MyDNFWork\Script.pvf" --path itemshop/itemshop.lst --max-chars 1200
workbench.bat pvf-read read-batch --pvf "D:\MyDNFWork\Script.pvf" --path etc/newcashshop.etc --path etc/worlddrop.etc --max-chars-per-file 1200
workbench.bat pvf-read resolve-path --pvf "D:\MyDNFWork\Script.pvf" --path itemshop/birken.shp --registry itemshop/itemshop.lst
workbench.bat pvf-index build --pvf "D:\MyDNFWork\Script.pvf" --scope itemshop --prefix itemshop --limit 1000
workbench.bat pvf-change validate --file workspaces\examples\change-set.replace-text.example.json
workbench.bat pvf-change dry-run --file workspaces\examples\change-set.replace-text.example.json --pvf "D:\MyDNFWork\Script.pvf"
workbench.bat absorb new --id KV-XX --title "实机验证标题" --domain itemshop --status PASS
workbench.bat research inventory --source "D:\materials" --source-id materials --out "D:\research\materials"
workbench.bat nut-api query --name sq_GetSkillLevel --kind function --group dnf --exact
workbench.bat tag-knowledge query --tag duration --exact
workbench.bat pvf-lineage query --catalog "D:\research\lineage\PVF-LINEAGE-CATALOG.json" --golden blood-sword-tp-derivative
workbench.bat dependency-plan plan --pvf "D:\target\Script.pvf" --domain dungeon --id 11 --out "D:\research\dependency-plans"
workbench.bat client-matrix query --matrix "D:\research\client-matrix\CLIENT-COMPATIBILITY-MATRIX.json" --status divergent
workbench.bat knowledge-query nut --name sq_GetSkillLevel --kind function --group dnf --exact
workbench.bat knowledge-query bookmark --text 商城
workbench.bat eval self-test
workbench.bat skill self-test
workbench.bat release gate3
```

## 发行与 Agent 回归

- `VERSION` 和 `CHANGELOG.zh-CN.md` 记录 Workbench 版本。
- `release/PORTABLE-RELEASE-MANIFEST.json` 定义干净发行文件集合。
- `.agents/skills/dnf-pvf-xpilot` 提供宿主可选的轻量路由适配器，Workbench 本体不依赖它才能运行。
- 三段 Release Gate 分别检查候选文件、stage 复制哈希和无真实 PVF 冷启动。
- `workbench.bat eval` 提供宿主无关的 PVF 安全与路由回归评测。
- 发行门禁和 eval 只生成本机报告，不写 PVF，不修改客户端。报告默认写到 Workbench 外部；在本工作区中使用 `derived/reports/pvf-agent-workbench/runtime-runs/`。

## 本机 profile

频繁换电脑时，不要每次在对话里重复交代 PVF、客户端、输出目录和编码。用 `workbench.bat profile init ... --set-active` 把这些写进本机私有 `config/workspace-profiles.local.json`。

这个 local 文件被 `.gitignore` 排除，只给当前机器用；干净工作台和 `knowledge-pack` 仍不包含真实路径。

如果要把工作台复制到新电脑，先看 `docs/CLEAN-COPY.zh-CN.md`，不要把本机 profile、真实 PVF、客户端、索引缓存或运行产物一起带走。

## 边界

- 默认只读。
- 不覆盖源 PVF。
- 不写客户端文件。
- 日常读取走随包内置 backend；写出 PVF 只能走 `workbench.bat pvf-change apply` 这个受控写入通道。
- backend 选择默认为 `native -> 只读备用` 自动降级；备用后端绝不保存、备份或改写 PVF。进入受控写入前必须由 `workbench.bat check` 确认 native 可用。
- 写出 PVF 必须提供同一源 PVF、同一 change-set 的未阻塞 dry-run manifest 及其 approval code，并走显式 output、备份、readback 和 manifest。
- 受控写入必须使用原始 no-simplified 文本做精确替换；不要把简体化显示文本或 `&#数字;` 实体写回 PVF。
- 这里不包含 API key、真实 PVF、客户端、索引缓存或运行报告；`workbench.bat check` 会把 Workbench 内残留的运行产物视为错误。
- 这里不包含 OpenCode 桌面端 runtime；具体 Agent 的 API/provider 设置由该 Agent 自己管理。

## 这里包含

- `runtime/node/node.exe`
- `runtime/node/LICENSE` 与 `release/BUNDLED-RUNTIME-MANIFEST.json`
- `tools/pvf-bridge/server.js`
- `tools/pvf-bridge/native/pvf_rust_core.node`
- `tools/pvf-bridge/fallback/` 的无 npm 依赖只读备用后端
- `core/pvf-agent-core/` 的 PVF CLI、contract、schema 和检查脚本
- `knowledge-pack/` 的纯净百科、词典、workflow、安全规则和路由索引
- `knowledge-pack/indexes/` 的内置 NUT、PVF tag 和任务书签紧凑事实目录
- `workspaces/examples/` 示例
- `evals/agent/` 的 Agent 回归场景、规则和自检夹具
- `commands/` 的高级兼容入口；普通用户只使用根目录 `workbench.bat`
- `docs/` 和 `release/` 的迁移说明、发行文档与 manifest
- 三段 portable release dry-run

备用后端的能力、限制和恢复路线见 `docs/READONLY-FALLBACK.zh-CN.md`。随包二进制的固定版本、SHA-256、许可证和系统运行库边界见 `docs/THIRD-PARTY-NOTICES.md`。当前 native Rust 源码和 `Cargo.lock` 不在发行包内，因此不要把本仓库描述为该 native 组件的可复现源码构建。
