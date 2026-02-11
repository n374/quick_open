# Quick Open Chrome Extension

这是一个 Chrome 扩展程序，用于快速跳转。

## 安装与使用

1. **加载扩展**：
   - 打开 Chrome 扩展管理页面 `chrome://extensions/`。
   - 开启右上角的“开发者模式”。
   - 点击“加载已解压的扩展程序”，选择本项目的根目录。

2. **触发方式**：
   - 在 Chrome 地址栏输入 **`q`**，然后按 **Space** 或 **Tab** 键。

## 开发指南

### 依赖安装
```bash
npm install
```

### 构建项目
修改 `src/config.json` 或源代码后，**必须**重新构建才能生效。
```bash
npm run build
```

### 开发模式
监听文件变化并自动构建：
```bash
npm run watch
```

### 运行测试
```bash
npm test
```

## 配置说明
核心配置位于 `src/config.json`。
- `var.regions`: 定义所有支持的区域及其对应的域名、参数。
- `pattern`: 定义所有支持的命令模式。
