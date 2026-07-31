不能直接写回。`previousText/newText` 必须来自目标 PVF 的 raw no-simplified 原始文本读回；`&#20320;` 这类 HTML 数字实体禁止进入 PVF。先 dry-run；若读回或客户端 UI smoke 出现实体化/乱码，必须停止部署。

