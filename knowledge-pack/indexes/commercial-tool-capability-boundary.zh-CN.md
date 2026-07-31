# 商业工具能力复原边界

状态：需验证

## 用途

本入口只记录商业 PVF 工具能力对 Workbench 的复原边界。外部工具的产品外壳、源码方法体和操作界面只作为研究线索，不进入纯净知识包；经过目标 PVF 闭合的数据模型、匹配键、阻断条件和验收规则可以独立重建为 Workbench 知识。

## 可吸收

- 能力名称和输入 / 输出形态。
- 是否适合复原为只读 planner。
- 可复用的 Workbench 能力域。
- 明确的不复原边界。

## 不吸收

- 源码方法体。
- 外部工具自身的 UI 控件、按钮实现、行号证据链。PVF 内 `.ui` 的数据结构仍可按目标文件研究。
- 授权、群验证、数据库验证、机器码验证。
- 硬编码路径和本地环境假设。
- NUT/SQR 打乱、混淆、批量破坏性写入逻辑。
- NPK 删除、合并、写入行为；这类动作必须另行授权。

## 当前复原路线

| 能力域 | 处理 |
| --- | --- |
| 装备 / stackable / 宝珠 / 礼包 / 宠物 / 光环相邻依赖 | 优先复原为只读 planner。 |
| 副本提取 / map / APC | 进入提取类能力路由，复用现有 workflow，不重复造核心工具。 |
| 副本与世界标准化 | 进入 `dungeon-world-standardization` 路由，独立表达宽屏结构迁移、worldmap 接口、深渊组、难度表、地狱名单、城镇与 ANI 模型。 |
| 全产品能力分级 | 需在当前目标 PVF 中只读确认 |
| 全包质检 / 语义对比 / 结果集 / LST | 复原为只读审计规格、集合模型和通用 registry 生命周期；截断与 unresolved 必须可见。 |
| 独立掉落 / 物品来源 / 技能树 | 复原为目标形状优先的 preview；不把索引、候选列位或画布结果提升为运行事实。 |
| quest / 礼盒 / 徽章 / 装备复制 | 复原为原子 authoring preview；新脚本、registry 和引用方必须同组审阅。 |
| NPK / ImagePacks2 / ANI | 只吸收只读资源依赖和兼容边界；写 NPK、IMG、ANI 或客户端需单独授权。 |
| 授权验证、群验证、NUT/SQR 打乱 | 禁止复原为默认能力。 |

统一只读入口为 `workbench.bat dependency-plan`。它只依据 clean knowledge、公开结构、目标 PVF raw readback 和独立 fixture 实现；商业来源不提供方法体。

## 道具类吸收边界

- 礼包、宝珠、宠物和光环能力只吸收为 planner、workflow 路由和运行时验收分层。
- 礼包 wrapper、package data、booster/random/selection 子层、child item 必须分别读取，不互相替代。
- 宝珠只读链路不证明附魔成功；宠物蛋可用不证明礼包 wrapper 可打开；光环装备成功不证明视觉特效正常。
- 礼包生成器、抽奖模拟、服务端放行和客户端资源打包保持 authoring 或 runtime gap，不并入默认 extraction planner。

## 默认入口

- `dictionaries/dependency-planner-boundary-quick.zh-CN.md`
- `indexes/pvf-productized-capability-router.zh-CN.md`
- `indexes/dungeon-world-standardization-capability-router.zh-CN.md`
- `workflows/unified-dependency-planner.zh-CN.md`
- `indexes/extraction-capability-router.zh-CN.md`
- `workflows/item-stackable-dependency-planner.zh-CN.md`
- `workflows/equipment-avatar-aura-creature-extraction-planner.zh-CN.md`
- `workflows/stackable-package-orb-card-extraction-planner.zh-CN.md`
- `workflows/client-asset-path-preview.zh-CN.md`
- `workflows/dungeon-extraction-planner.zh-CN.md`
- `workflows/apc-extraction-planner.zh-CN.md`

## 边界

商业工具输出通常是提取或补登线索，不是目标 PVF 可直接使用的生产计划。所有 ID、路径、registry、客户端资源都必须在目标 PVF 和目标客户端重新闭合。

Workbench 不保留外部工具源码、实验样本、样本道具 ID、产品 UI 或证明链。可迁移知识保留能力路由、PVF 数据闭环、字段读法、匹配键、冲突条件、预览流程和执行边界。
