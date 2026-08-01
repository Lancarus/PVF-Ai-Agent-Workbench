# Release Gate 1：候选包检查

入口：

```bat
workbench.bat release gate1
```

检查发行清单中的文件是否存在，计算每个文件的大小和 SHA-256，并扫描整个源码树，而不只是 manifest 已列出的文件。它拒绝 manifest 外文件、软链接、Windows 非法/冲突路径、本机 profile、密钥、机器路径、运行产物、PVF、客户端资源、数据库、额外二进制和压缩包；同时执行 GitHub 50/100 MiB 单文件边界检查。

它只生成报告，不复制、不压缩、不写 PVF。
