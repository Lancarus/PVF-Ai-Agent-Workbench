不应默认重哈希 25GB。默认使用 metadata，按容器 pattern 做 scoped 范围限制；相同请求使用按路径、大小、mtime 绑定的增量缓存或 `--reuse-cache`，并在中断时保留 checkpoint。整个流程只读，不写 NPK、IMG 或客户端。

