# 更新日志

## 2.0.0

- 普通任务改为完全自包含：随包提供固定 Node.js runtime 与 native PVF backend，不依赖外部 MCP、编辑器插件或已下架工具。
- 统一 `workbench.bat` 入口，覆盖环境检查、只读读取、索引、受控 change-set、dry-run、显式授权输出、备份和 readback。
- 知识包收口为百科、字段词典、工作流、任务卡和轻量路由；删除研究账本、历史验收报告、来源定位、样本统计和机器路径。
- 内置 NUT 声明、PVF tag 可信分层和常用任务书签；普通任务无需携带额外知识目录。
- 增加全包质检、语义比较、LST 生命周期、掉落整理、物品来源、技能树安全合并、原子内容生成与统一依赖预览。
- 增加副本与世界标准化路线，包括 map 宽屏结构迁移、worldmap 接口布局、深渊组、难度表、地狱名单、城镇预览和 ANI 边界。
- 增加外部 SHA 锁定的 PVF 谱系与客户端兼容矩阵；所有报告、缓存和真实路径保持在 Workbench 外。
- 增加项目级 `dnf-pvf-xpilot` Skill 适配器，同时保留无 Skill 宿主直接读取 `AGENTS.md` 的路线。
- 增加 runtime 完整性、知识语义纯净性、Agent eval 与三段 portable release gate。
- native 通过完整性校验但因 VC++ v14 x64 运行库加载失败时，人工终端会打开微软官方说明页；Agent/CI 只打印链接，不弹窗或自动安装。
- 增加无 npm 依赖的纯 JavaScript 只读备用后端：native 加载失败时自动接管文件树、脚本/LST/StringLink、NUT、二进制 ANI、搜索和注册表读取；所有备份、apply 与保存以 `READ_ONLY_FALLBACK` 硬阻断。
- 增加合成 PVF 双后端自检、stdio 集成负控和外部多 PVF native/fallback 差分工具，并纳入无 PVF Release Gate 3。
- 版本号从公开基线直接升级为 `2.0.0`。

## 1.1.0

- 早期公开版本。
