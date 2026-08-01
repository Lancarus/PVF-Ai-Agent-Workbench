# Dungeon Full Lifecycle 边界

状态：默认可用

用途：把区域入口、副本、地图、战斗单位、奖励和客户端候选压缩成一条可复核的静态生命周期。

```text
region -> town -> worldmap -> dungeon -> map
                                 |       |
                                 |       +-> monster / passiveobject / APC
                                 +-> difficulty / entry item / clear reward
worldmap / map / action -> UI / ANI / IMG / audio candidates
```

## 固定边界

- 每层数字按父块走对应 registry；同号跨 registry 不能互证。
- `.dgn`、`.map`、`.mob`、`.obj`、`.act`、`.atk` 与 `.ani` 必须按真实引用逐层读回。
- 门票、掉落、清算和翻牌是不同系统，不因同一物品 ID 出现而合并语义。
- UI、ANI、IMG 与音频引用只产生客户端候选，不证明资源存在或实机加载。
- 静态闭合不证明可进入、刷怪、AI、机关、扣票、发奖或服务端放行。

执行入口：`task-cards/content-lifecycle-dungeon-full-lifecycle-readonly-audit.zh-CN.md`。
