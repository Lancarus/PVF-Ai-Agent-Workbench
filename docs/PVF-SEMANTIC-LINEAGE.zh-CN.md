# 外部 PVF 语义谱系

`workbench.bat pvf-lineage` 以完整 PVF SHA256 为版本主键，在 Workbench 外建立文件清单、`.lst` registry、Section/tag、NUT 函数/常量/调用和历史行为证据的分层谱系。

文件清单只用路径与长度定位新增、删除和长度变化；相同长度明确标为内容未检查。Registry、NUT 和选中的语义文件另做原始 no-simplified readback 与文本 SHA。外部索引仍不是最终证据，查询结果要读回目标 PVF 文件。

```bat
workbench.bat pvf-lineage build --pvf "D:\v1\Script.pvf" --label v1 --pvf "D:\v2\Script.pvf" --label v2 --out "D:\research\lineage"
workbench.bat pvf-lineage query --catalog "D:\research\lineage\PVF-LINEAGE-CATALOG.json" --golden blood-sword-tp-derivative
workbench.bat pvf-lineage query --catalog "D:\research\lineage\PVF-LINEAGE-CATALOG.json" --symbol ActionClash_BerserkerTryBloodSwordDerivative
workbench.bat pvf-lineage verify --catalog "D:\research\lineage\PVF-LINEAGE-CATALOG.json" --rehash-pvfs
workbench.bat pvf-lineage profile-check --catalog "D:\research\lineage\PVF-LINEAGE-CATALOG.json" --profile "D:\research\lineage\PRIVATE-REGRESSION-PROFILE.json"
```

`introduced / changed / removed` 描述静态谱系；`behavior-pass / behavior-fail` 只能来自独立、SHA 绑定的证据记录。文档陈述、静态 readback 和实机事实不得合并成一个状态。
