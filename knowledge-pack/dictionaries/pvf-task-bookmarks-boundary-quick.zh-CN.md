# PVF 任务书签快速边界

状态：默认可用

## 用途

`workbench.bat knowledge-query bookmark` 把常见诉求直接映射到候选 PVF 路径，例如商城、掉率/爆率、主要 `.lst`、职业技能表、副本/地图/怪物/APC、宠物、活动、强化增幅和 UI。

```bat
workbench.bat knowledge-query bookmark --text 商城
workbench.bat knowledge-query bookmark --text 爆率
workbench.bat knowledge-query bookmark --path etc/newcashshop.etc
```

每条结果只含：

- `path`：候选 PVF 路径，保留原始拼写。
- `labels` / `groups`：同一路径的用途别名和分组。

## 固定边界

- 书签是导航，不是目标存在性或字段语义证明。
- 每个新任务都要先在目标 PVF 检查路径，再读取原文。
- 标签说明不能代替 Section/tag 查询、`.lst` 解析或父块结构核对。
- 同一路径在不同版本中可能语义、字段或内容不同；写入时仍取目标 raw no-simplified 文本并走受控 change-set。
- 书签不证明客户端资源、服务端逻辑或实机结果。
