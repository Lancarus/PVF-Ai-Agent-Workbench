# ActionObject / MapObject / BreakableObject / SPC Object 只读审计卡

状态：默认可用


## 快速结论

- `actionobject/` 常见 `.obj -> [basic action] .act -> [BASE ANI]/[SUB ANI] .ani`，并可通过 `[attack info]` 连接 `.atk`。
- `.act [CREATE PASSIVEOBJECT] [INDEX]` 走 `passiveobject/passiveobject.lst`；`.act [SUMMON MONSTER] [INDEX]` 走 `monster/monster.lst`；`.act [SUMMON APC] [INDEX]` 走 `aicharacter/aicharacter.lst`。
- 静态只读只能确认字段、路径和 registry 入口存在；不证明对象实际生成、路径门开关、破坏物血量、生效阵营、攻击命中、掉落、音效播放或客户端资源完整。

## 首选阅读顺序

1. `dictionaries/actionobject-mapobject-breakable-spc-fields.zh-CN.md`
2. `indexes/actionobject-mapobject-breakable-spc-boundary.zh-CN.md`
3. `dictionaries/passiveobject-obj-fields.zh-CN.md`
4. `dictionaries/passiveobject-action-fields.zh-CN.md`
5. `task-cards/passiveobject-nonmonster-readonly-audit.zh-CN.md`
6. `indexes/passiveobject-attackinfo-hitbox-compact-router.zh-CN.md`

## 何时使用

| 问题 | 动作 |
| --- | --- |
| 地图里的 `[passive object]` 数字是什么 | 先按父块确认这是 map 静态放置块，再用 `passiveobject/passiveobject.lst` 解析对象 ID。 |
| `.obj` 写着 `[basic action]` | 按 owner 相对路径读 `.act`，再从 `.act` 追 `.ani`、声音 token、行为块或创建块。 |
| `.obj` 写着 `[basic motion]` 或 `[etc motion]` | 优先按 mapobject 静态动画/多动画入口处理，不要硬解释成 `.act` 行为。 |
| `.act` 里出现 `[CREATE PASSIVEOBJECT]` | `[INDEX]` 走 passiveobject registry；仍不证明实机创建成功或递归安全。 |
| `.act` 里出现 `[SUMMON MONSTER]` / `[SUMMON APC]` | 分别走 monster / aicharacter registry；不能用同一个数字表混解。 |

## 禁止外推

- 不把 `ActionObject`、`MapObject`、`BreakableObject` 或 `SPC` 目录名写成实机分类规则。
- 不把 `.obj/.act/.atk/.ani` 静态链路写成对象必定生成、动作必定播放、攻击必定命中或伤害正确。
- 不把 `[hp max]`、`[hp destroy]`、`[object destroy condition]` 写成破坏物实机血量、掉落、任务计数或机关状态已经生效。
- 不把 `.map [passive object]` 写成地图实机加载成功、坐标正确、门逻辑正常或客户端资源完整。
