# Quick Open Chrome Extension

这是一个 Chrome 扩展程序，用于快速跳转各类内部服务（Bytedoc, Grafana, Argos, TCC 等）。

## 安装与使用

1. **加载扩展**：
   - 打开 Chrome 扩展管理页面 `chrome://extensions/`。
   - 开启右上角的“开发者模式”。
   - 点击“加载已解压的扩展程序”，选择本项目的根目录。

2. **触发方式**：
   - 在 Chrome 地址栏输入 **`q`**，然后按 **Space** 或 **Tab** 键。

## 支持的命令

### 1. Bytedoc (`bd`)
快速访问 Bytedoc 文档或数据库概览。

- **访问首页**：
  `bd [region]`
  示例：`bd sg` (跳转新加坡 Bytedoc 首页)

- **访问数据库**：
  `bd [region] [db]`
  示例：
  - `bd ce oda` (访问 China East 的 object_data_access)
  - `bd sg vda` (访问 Singapore 的 video_data_access)
  - `bd boe odat` (访问 BOE 的 ToB ODA)

  **支持的数据库缩写**：
  - `vd`: video_delete
  - `rt`: oda_route_table
  - `oda`, `oda0`~`oda9`: object_data_access
  - `odat`, `odat0`~`odat9`: object_data_access_tob

### 2. Grafana 监控 (`grafana`)
快速访问 VDA/ODA 相关的 Grafana 监控大盘。

- **命令格式**：
  `grafana [region] [dashboard]`
  
- **支持的面板**：
  - `vda`: VDA 数据层服务监控
  - `oda`: ODA/ODM 监控大盘
  - `fuxi`: Fuxi ODA 大盘监控

- **示例**：
  - `grafana sg vda`
  - `grafana ce oda`

### 3. 其他服务

- **TCC 配置中心** (`tcc`)：
  `tcc [region] [psm]`
  示例：`tcc sg sync`

- **Argos 服务概览** (`a`)：
  `a [region] [psm]`
  示例：`a ce vda`

- **Trace ID 查询** (`tid`)：
  `tid [region] [trace_id]`

- **Argos 日志查询** (`log`)：
  `log [region] [psm] [query]`

- **Fuxi Schema** (`fuxi`)：
  `fuxi [region]`

## 支持的区域 (Region)

| 缩写 | 说明 |
| :--- | :--- |
| `boe` | 中国 BOE 环境 |
| `boei18n` | 海外 BOE 环境 |
| `cn` | 中国北部 (China North) |
| `ce` | 中国东部 (China East) |
| `sg` | 新加坡 (Singapore) |
| `va` | 美东 (US East) |
| `gcp` | GCP 美东红区 |
| `eu2` | 欧洲 TTP2 |
| `ttp1` | 美国 TTP1 |
| `ttp2` | 美国 TTP2 |
| `sinf` | SINF 国内 |
| `sinfi18n` | SINF 海外 |

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
