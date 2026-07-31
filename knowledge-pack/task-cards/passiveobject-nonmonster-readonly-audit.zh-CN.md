# PassiveObject 非 Monster 只读审计卡

状态：默认可用

用途：当任务涉及飞行物、召唤物、地图对象、角色公共对象、`.obj/.act/.atk/.ani`、攻击框或 PVP 覆盖块时，用本卡完成目标 PVF 的只读闭合。它不是写 PVF 配方。

## 怎么查

1. 判断入口是数字 ID、`.obj` 直接路径，还是上游 `.act/.skl/.map/.dgn` 引用。
2. 数字 ID 先用 `passiveobject/passiveobject.lst` 解析；未命中就停止猜测。
3. 读取 `.obj`，记录动作、动画、 AttackInfo、数据块、销毁条件、追踪块和生命字段。
4. 相对路径从 owner 文件所在目录解析；同名文件不能替代目标路径。
5. 读取 `.act`，展开 `[BASE ANI]`、`[SUB ANI]`、`[TRIGGER]`、`[BEHAVIOR]` 与创建/召唤块。
6. `[CREATE PASSIVEOBJECT] [INDEX]` 走 `passiveobject/passiveobject.lst`；随机候选逐个解析。
7. `[SUMMON MONSTER] [INDEX]`、`[WHICH] [MONSTER] ... [IS INDEX]` 走 `monster/monster.lst`。
8. `[SUMMON APC] [INDEX]`、`[WHICH] [AI CHARACTER] ... [IS INDEX]` 走 `aicharacter/aicharacter.lst`。
9. `.map [passive object]` 仍先解析 PassiveObject registry，但结论应写成地图静态放置，不写成 action 创建链。
10. 对 `.ani` 做二进制反编译；只记录实际展开的帧与 `[ATTACK BOX]` / `[DAMAGE BOX]`。
11. 读取 `.atk` 的完整父块和闭合范围；只记录字段、列形和引用，不推断伤害公式或运行效果。
12. 遇到 `[pvp] ... [/pvp]` 必须读到结束标签；它只表示覆盖结构。

## 通过标准

- 所有数字 ID 已按父块上下文通过正确 `.lst` 解析，或明确标为未解析。
- `name_数字` 没有被误当作 registry ID。
- `.obj -> .act/.ani/.atk` 已按 owner 目录读回，缺失引用仍然可见。
- 所有相关闭合块均读取完整，没有用截断片段推断父子关系。
- ANI 反编译失败已标为未展开；成功时没有把攻击框当作运行命中证明。
- `.atk` 没有被扩写为伤害、异常、击退、浮空或 PVP 最终规则。
- 结论只描述当前目标 PVF，不夹带旧目标、历史报告或外部材料定位。

## 何时需要实机

伤害、命中、卡肉、击退、浮空、追踪轨迹、销毁时序、同步和竞技场结果都属于运行行为。只有任务确实依赖这些结果时，才进入单独的受控修改与高收益实机验证。
