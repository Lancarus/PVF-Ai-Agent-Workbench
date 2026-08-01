# PVF 产品化能力总路由

状态：默认可用

## 用途

把常见 PVF 工具中的产品功能还原成干净 Workbench 可独立执行的知识路线。这里按完整功能面分类，不以用户点名的页面作为白名单，也不依赖任何外部 GUI、资料目录、缓存或服务。

## 分级含义

| 等级 | 含义 | 默认动作 |
| --- | --- | --- |
| A 已覆盖 | 现有百科、词典、workflow 或 planner 已能承接。 | 路由到现有入口，读取目标 PVF 后处理。 |
| B 新增高价值路线 | 本路由新增了可迁移的数据模型、阻断条件和预览流程。 | 读取本表指定的新任务卡，默认只读。 |
| C 只吸收审计边界 | 可借鉴引用闭合、兼容性或风险检查，但不继承批量写入。 | 只做 preview / audit；客户端动作仍需单独授权。 |
| D 工作台外 | 通用转换、认证、加解密、混淆或破坏性客户端写入不提升 PVF 能力上限。 | 不作为 Workbench 默认能力。 |


| 分区 | 功能 | 等级 | Workbench 路由或边界 |
| --- | --- | --- | --- |
| 副本与世界 | 副本接口布局 | A | `dungeon-world-standardization` |
| 副本与世界 | 副本编辑器 | A | `dungeon-map-entry-clear` / `dungeon-extraction` |
| 副本与世界 | 副本难度系数 | A | `dungeon-difficulty-ultimate-list` |
| 副本与世界 | 深渊组可视化 | A | `hellparty-visualization` |
| 副本与世界 | 地狱副本列表 | A | `dungeon-difficulty-ultimate-list` |
| 副本与世界 | 城镇预览 | A | `formal-region-town-worldmap-area-entry` |
| 副本与世界 | 城镇副本 ANI | A | `client-assets-imagepacks-ui` |
| 副本与世界 | 地图宽屏补全 | A | `map-widescreen-structural-migration` |
| 角色与战斗单位 | 角色基础属性 | A | `character-job-branch` |
| 角色与战斗单位 | APC 编辑器 | A | `apc-extraction` / APC 既有索引 |
| 角色与战斗单位 | 怪物编辑器 | A | `monster` / monster-action 既有索引 |
| 技能 | 技能树排版 | B | `skill-tree-layout-merge-safety` |
| 技能 | 技能合并 | B | `skill-tree-layout-merge-safety` |
| 技能 | 技能脚本编辑 | A | `skill-parameters` / `skill-state-nut-runtime` |
| 技能 | 白金徽章生成 | B | `atomic-content-generation` |
| 任务 | 新增任务 | B | `atomic-content-generation`，并复用 `quest-drop-reward-ticket` |
| 任务 | 编辑任务 | A | `quest-drop-reward-ticket` |
| 任务 | 通关任务向导 | B | `atomic-content-generation` |
| 道具与礼包 | 道具编辑 | A | `equipment-stackable` |
| 道具与礼包 | 礼盒生成器 | B | `atomic-content-generation` |
| 道具与礼包 | NPC 商店 | A | `npc-shop` |
| 道具与礼包 | 加百利商店 | A | ETC / 商店既有入口，目标样本优先 |
| 道具与礼包 | 脚本化奖励页 | C | 只吸收 NUT、物品引用与客户端资源审计，不继承直接写回 |
| 道具与礼包 | 物品来源词典 | B | `item-source-graph` |
| 装备·时装 | 装备编辑器 | A | `equipment-stackable` |
| 装备·时装 | APD 编辑 | A | appendage / equipment special-effect 既有入口 |
| 装备·时装 | 装备复制 | B | `atomic-content-generation` |
| 装备·时装 | 套装编辑器 | A | set / equipment dependency 既有入口 |
| 装备·时装 | 时装合成 | A | avatar / package 既有入口；保留源拼写 |
| 装备·时装 | 时装镶嵌栏批量 | A | avatar / socket 既有入口；写前逐文件预览 |
| 装备·时装 | 装备升级生成 | C | 只吸收配方、材料、registry 和近邻模板审计 |
| 装备·时装 | 强化 / 增幅 | A | upgrade / reinforce / amplify 既有入口 |
| 装备·时装 | 锻造 | A | upgrade / forge 既有入口 |
| 装备·时装 | 魔法封印词条生成 | C | 只吸收词条 registry、合法池与冲突审计；不默认随机批改 |
| 掉落·副职业 | 掉落概率 | A | `clear-reward-card-flip` |
| 掉落·副职业 | 整理独立掉落 | B | `independent-drop-normalization` |
| 掉落·副职业 | 补全英雄级掉落 | B | `independent-drop-normalization` |
| 掉落·副职业 | 副职业 | A | character / ETC 既有入口 |
| 掉落·副职业 | 分解机配置 | A | ETC / item reward 既有入口 |
| 运营配置 | 商城 | A | bookmark + ETC / shop 既有入口 |
| 运营配置 | QP 商店 | A | ETC / economy 既有入口 |
| 运营配置 | 称号簿 | A | ETC / equipment reward 既有入口 |
| 运营配置 | 契约列表 | A | serverparameter / premium 既有入口 |
| 运营配置 | 黑钻机 | A | PC room / reward 既有入口 |
| 运营配置 | 账号金库 | A | economy / counter 既有入口 |
| 运营配置 | 每日门票 | A | quest / ticket / reset 既有入口 |
| 脚本质检 | SQR 检测 | B | `pvf-package-quality-audit` |
| 脚本质检 | ACT 检测 | B | `pvf-package-quality-audit` |
| 脚本质检 | 五类完整性检查 | B | `pvf-package-quality-audit` |
| 脚本质检 | LST 编号查重 | B | `pvf-package-quality-audit` / `lst-registry-lifecycle` |
| 脚本质检 | equipment / stackable 同号交集 | B | `pvf-package-quality-audit` |
| 脚本与加解密 | 批量解密 SQR | D | 不迁入；不把未知解密或覆盖写回作为默认能力 |
| 脚本与加解密 | 去注释 / 去 print | D | 不迁入；会破坏调试、格式和语义线索 |
| 脚本与加解密 | 文件解密 | D | 通用文件工具，不属于 PVF 安全知识路线 |
| 脚本与加解密 | PVF 加雷 / 干扰目录 | D | 禁止作为默认能力 |
| 客户端资源 | PVF 文件提取 | A | `client-asset-path-preview` / 只读提取流程 |
| 客户端资源 | Base64 编解码 | D | 通用转换，不提升 PVF 领域能力 |
| 客户端资源 | NPK 浏览 | C | 只读 NPK / IMG 索引与兼容性审计 |
| 客户端资源 | ANI 格式转换 | C | 只吸收 `[IMAGE EX]` / `[IMAGE]` 兼容边界；写客户端需单独授权 |
| 客户端资源 | NPK 整理 | D | 客户端重写不进入默认能力 |
| 客户端资源 | NPK 打包 | D | 客户端写入不进入默认能力 |
| 客户端资源 | NPK 精简 | D | 引用命中不足以安全删除；不进入默认能力 |
| 内置文档 | PVF 知识库 | A | 干净 `knowledge-pack` 与 `knowledge-query` 已承接 |

## 数据准备与检索入口

常见产品还会提供 27 个辅助入口。Workbench 的对应关系如下：

| 产品入口族 | Workbench 承接方式 |
| --- | --- |
| 加载、登记、切换、健康检查、路径探测 | `profile`、`doctor`、`check`、`pvf-index`；本机路径只进 local profile。 |
| 物品 / 任务 / 副本 / 技能浏览与导出 | `pvf-read`、`pvf-index`；输出写到 Workbench 外部运行目录。 |
| 单文件读取、字符串 / 数字 / 路径检索 | `pvf-read`、`knowledge-query`；0 命中不证明不存在。 |
| 书签 | `knowledge-query bookmark`；命中后仍确认目标路径并 readback。 |
| Registry 资源列表、LST 合并与导出 | `lst-registry-lifecycle`。 |
| 双 PVF 对比、结果集、ST / Section 频次 | `pvf-semantic-compare-workset`。 |
| 图标填充与图标缓存浏览 | 只吸收资源候选和兼容审计，不把本地缓存带入干净 Workbench。 |
| UT 连通、GUI 导航、写回磁贴 | 不需要；普通路线使用随包 backend 与受控 `pvf-change`。 |

## 新增高价值入口

- `task-cards/pvf-package-quality-audit-readonly.zh-CN.md`
- `task-cards/pvf-semantic-compare-workset-readonly.zh-CN.md`
- `task-cards/lst-registry-lifecycle-readonly-plan.zh-CN.md`
- `task-cards/independent-drop-normalization-readonly-plan.zh-CN.md`
- `task-cards/item-source-graph-readonly.zh-CN.md`
- `task-cards/skill-tree-layout-merge-readonly-plan.zh-CN.md`
- `task-cards/atomic-content-generation-readonly-plan.zh-CN.md`

## 总边界

1. 产品功能名只决定任务分类，不证明字段、列位或运行行为。
2. 任何结论都回到目标 PVF raw no-simplified 文本和正确 registry。
3. 跨包比较必须记录两侧完整 SHA256；截断、解析失败和 unresolved 必须可见。
4. 批量改动先缩小结果集并逐类 preview，不能用高命中、高相似或高频次代替安全判断。
5. 新文件、registry 登记和引用方必须作为一个原子计划审阅。
6. 客户端资源默认只读；PVF 写出授权不包含 NPK、IMG、ANI 或其他客户端写入。

