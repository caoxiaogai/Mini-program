# 首页准备文档

## 文档状态

- 阶段：准备阶段。
- 页面：销售小程序首页。
- 交付范围：静态 UI、前端展示交互、typed mock 数据。
- 不包含：真实接口、真实用户身份、真实统计、后端写入。
- Figma 文件：[Untitled](https://www.figma.com/design/kpT2Xd5s7zHkwDsiN1vzrm/Untitled?node-id=107-6040&m=dev)
- Figma 节点：`107:6040`。
- 设计基准：iPhone 16，画板宽度 393px。
- 当前状态：待用户确认本准备文档后进入实现。

## 页面目标

首页用轻量、友好的 AI 助手形象欢迎销售人员，并以三张摘要卡快速呈现当日核心动态。底部导航提供进入其他一级模块的视觉入口。

本轮只还原 Figma 中已经出现的内容，不扩展完整业务流程，不为尚未设计的页面创建占位页面。

## 视觉结构

页面自上而下分为五个区域：

1. 微信系统状态栏安全区。
2. 自定义导航栏：左侧显示“阿宝AI”，右侧保留微信胶囊按钮区域。
3. AI 问候区：机器人图片与问候语。
4. 今日摘要区：新增用户、累计阅读数、累计转发次数三张卡片。
5. 底部导航：通知、分析、素材、排名四项，固定在底部安全区上方。

页面使用浅蓝灰渐变背景。内容区保持左对齐，摘要卡使用半透明感的浅色背景、白色描边、圆角和轻阴影。

## 功能点清单（PRD）

### 1. 页面容器

- 以 Figma 的 393px 宽画板作为视觉基准。
- 页面背景覆盖完整视口，不因内容不足出现白底。
- 适配微信状态栏、胶囊按钮和底部安全区。
- 首页主体内容在不同屏幕高度下保持稳定：导航位于顶部，底部导航位于安全区上方，中间内容允许使用弹性空间，而不是复制 Figma 的绝对坐标。

验收标准：

- 393px 基准宽度下结构与 Figma 一致。
- 常见较窄和较宽机型下无横向溢出、胶囊遮挡或底部遮挡。

### 2. 顶部导航

- 左侧显示产品名称“阿宝AI”。
- 右侧不绘制假的胶囊按钮，使用微信运行环境的真实胶囊区域作为布局基准。
- 首页不显示返回按钮。
- 导航背景与页面背景融合，不出现独立白色栏。

静态 UI 行为：

- 标题无点击行为。
- 不实现更多菜单或关闭操作；这些由微信胶囊原生能力承担。

### 3. AI 问候区

- 展示 Figma 中的机器人图片。
- 展示问候文案：“下午好，有什么可以帮助你的吗”。
- 机器人图片与问候文案垂直排列并左对齐。

静态 UI 行为：

- 本轮问候语直接从 Mock ViewModel 读取。
- 不根据真实时间、用户姓名或登录状态动态生成。
- 机器人图片为本地静态资源，不作为 Mock 数据字段。

### 4. 今日新增用户摘要

- 展示“今日有 5 个新增用户”。
- 数字 `5` 使用强调色和更高字重。
- 展示“其中有 2 位高意向用户”。
- 展示最多五个重叠排列的访客头像。
- 卡片宽度按内容区和头像区域确定，保持单行核心信息。

静态 UI 行为：

- 数量和头像来自 Mock 数据。
- 本轮不点击进入用户列表。
- 头像只是虚构展示数据，不代表真实微信用户。

### 5. 今日累计阅读摘要

- 展示“今日累计阅读数 2983 次”。
- 数字 `2983` 使用强调色和更高字重。
- 次级文案显示“查看详细”。

静态 UI 行为：

- 阅读数来自 Mock 数据。
- “查看详细”本轮只作为视觉文案，不跳转。

### 6. 今日累计转发摘要

- 展示“今日累计转发次数 98 次”。
- 数字 `98` 使用强调色和更高字重。
- 次级文案显示代表性内容摘要，例如“AI 教程...”被转发了 80 次。

静态 UI 行为：

- 总转发次数、内容标题和内容转发次数来自 Mock 数据。
- 标题过长时单行省略，不能撑破卡片。
- 本轮不点击进入内容详情。

### 7. 底部导航

- 展示四个入口：通知、分析、素材、排名。
- 每项包含圆角图标容器、图标和文字标签。
- 通知入口右上方展示红色未读角标，Figma 示例值为 `2`。
- 底部导航固定在安全区上方，四项均匀分布。

静态 UI 行为：

- 本轮只实现按下反馈，不创建尚未开发的目标页面。
- 不自行推断当前选中项；Figma 没有提供明确的 active 样式。
- 未读数量来自 Mock 数据；数值为 `0` 时隐藏角标。
- 超过两位数时的展示规则尚未在设计稿中定义，本轮不扩展。

## 本轮不做

- 不请求真实首页数据。
- 不实现登录、授权或用户身份识别。
- 不实现真实页面跳转。
- 不实现下拉刷新、轮询、推送或消息已读。
- 不实现加载、空数据和错误状态；当前 Figma 只提供正常展示态，其他状态待设计确认。
- 不根据真实时间切换“早上好 / 下午好 / 晚上好”。
- 不定义新增用户、高意向、阅读或转发的生产统计口径。
- 不复制 iOS 状态栏时间、电量、网络图标；这些属于设备系统 UI。

## 实现方式对比

### 方案 A：原生页面 + 最小公共组件（推荐）

- 复用现有 `navigation-bar`。
- 首页问候区和摘要卡保留为页面内部结构。
- 只新增未来一级页面确定会复用的 `bottom-tab-bar`。
- 页面通过一个最小 service 获取 typed mock ViewModel。

优点：能快速跑通完整首页，组件边界清楚，没有预防性抽象；后续接真实数据时只替换 service。

代价：摘要卡首版不是公共组件；确认第二处复用后再抽取。

### 方案 B：全部保留在首页

- 导航以外的结构全部写在首页文件中，包括底部导航。

优点：文件数量最少，首屏实现速度最快。

代价：开发第二个一级页面时必然重复底部导航，不符合已经明确的四项底部入口结构。

### 方案 C：先建立完整组件与配置系统

- 把问候区、卡片、头像组、底部导航、指标类型和状态全部抽象为可配置组件。

优点：理论上拥有最高复用度。

代价：当前只有一个页面和一个正常态，抽象依据不足，会增加文件、配置和调试成本。

结论：采用方案 A。它是满足当前首页的最简单长期实现，同时保留明确的数据与组件边界。

## 组件分析

### 复用现有组件

#### `navigation-bar`

路径：`miniprogram/components/navigation-bar/`

用途：

- 负责状态栏安全区和微信胶囊的左右空间计算。
- 首页通过左侧 slot 展示“阿宝AI”，关闭返回和首页按钮。
- 背景保持透明，使渐变背景连续。

处理原则：优先复用现有组件，只补充当前设计必需且可长期使用的能力，不重新实现第二套导航栏。

### 新增公共组件

#### `bottom-tab-bar`

建议路径：`miniprogram/components/bottom-tab-bar/`

职责：

- 渲染固定数量的底部导航项。
- 展示图标、标签和可选 badge。
- 处理底部安全区和按下反馈。
- 通过事件把点击项交给页面，不在组件内部决定路由。

输入建议：

```ts
interface BottomTabItem {
  id: string
  label: string
  iconPath: string
  badgeCount?: number
  active?: boolean
}
```

当前不实现复杂配置系统。导航项可以由一个 typed 常量提供；等其他一级页面开始开发时再接入真实跳转和 active 状态。

### 首页内部结构，不抽公共组件

#### AI 问候区

当前只在首页出现，结构简单，保留在首页 WXML 中。若后续页面重复使用再抽取。

#### 今日摘要卡组

三张卡片共享基础 class，但内容结构不同。首版直接在首页 WXML 中编写三个语义清晰的区块，不为三种内容建立通用 schema 或复杂卡片组件。

#### 头像叠放组

首版作为新增用户卡片内部结构，通过列表渲染和负间距实现。只有在其他页面复用后再抽为公共组件。

## 静态资源清单

实现阶段需要从 Figma 下载并本地保存：

- AI 机器人图片：1 张 PNG。
- 示例头像：5 张 PNG。
- 通知图标：1 个 SVG 或 Figma 原始导出资源。
- 分析图标：1 个 SVG 或 Figma 原始导出资源。
- 素材图标：1 个 SVG 或 Figma 原始导出资源。
- 排名图标：1 个 SVG 或 Figma 原始导出资源。

不需要下载：

- iOS 时间、电量、Wi-Fi 和蜂窝网络图标。
- 微信小程序胶囊按钮图片。

所有下载资源存入 `miniprogram/assets/`，不长期使用 Figma 的临时 URL。

## 开发顺序（从简单到复杂）

### 第 1 步：页面骨架与全局视觉

- 清理默认首页模板内容，不保留兼容层。
- 建立首页全屏容器和渐变背景。
- 复用现有 `navigation-bar` 完成标题、状态栏和胶囊避让。
- 建立本页需要的最小颜色、间距、圆角和阴影变量。

完成标准：首页空骨架在基准尺寸和一个较窄尺寸下无溢出。

### 第 2 步：AI 问候区

- 下载并接入机器人图片。
- 实现问候语排版。
- 使用弹性布局确定中部位置，不复制绝对坐标。

完成标准：图片比例、左边距、文字字号和纵向间距与 Figma 一致。

### 第 3 步：Typed Mock 与首页摘要

- 定义最小 `HomeOverviewViewModel`。
- 创建单份稳定 Mock 数据。
- 通过首页 service 返回 Mock ViewModel。
- 实现三张摘要卡和数字强调样式。

完成标准：页面只调用 service，不直接导入 Mock；长标题不会撑破布局。

### 第 4 步：头像叠放细节

- 下载五张示例头像。
- 使用列表渲染重叠头像。
- 处理不足五张、空数组和圆形裁切。

完成标准：头像顺序、重叠量、边缘和卡片宽度与 Figma 接近。

### 第 5 步：底部导航

- 下载四个真实图标资源。
- 新建 `bottom-tab-bar` 公共组件。
- 实现四项均分、badge、按下反馈和底部安全区。
- 本轮不接路由。

完成标准：底部导航不会遮挡摘要卡，badge 为 0 时隐藏。

### 第 6 步：响应式与视觉验收

- 对比 Figma 基准画面。
- 检查 393px 基准宽度、常见较窄屏和较高屏。
- 检查系统胶囊、状态栏和底部安全区。
- 检查长标题、零 badge、头像少于五个等 Mock 边界。

完成标准：微信开发者工具编译无错误，页面无横向溢出，关键间距和资源比例符合设计。

## 需要 Mock 的数据结构

### 首页 ViewModel

```ts
interface HomeOverviewViewModel {
  greeting: string
  newVisitors: NewVisitorsSummary
  reading: ReadingSummary
  sharing: SharingSummary
  unreadNotificationCount: number
}

interface NewVisitorsSummary {
  total: number
  highIntentCount: number
  visitors: VisitorPreview[]
}

interface VisitorPreview {
  id: string
  displayName: string
  avatarUrl: string
}

interface ReadingSummary {
  total: number
}

interface SharingSummary {
  total: number
  highlightedContentTitle: string
  highlightedContentShareCount: number
}
```

### Mock 示例

```ts
const homeOverviewMock: HomeOverviewViewModel = {
  greeting: '下午好，有什么可以帮助你的吗',
  newVisitors: {
    total: 5,
    highIntentCount: 2,
    visitors: [
      { id: 'visitor-01', displayName: '示例用户 1', avatarUrl: '/assets/avatars/visitor-01.png' },
      { id: 'visitor-02', displayName: '示例用户 2', avatarUrl: '/assets/avatars/visitor-02.png' },
      { id: 'visitor-03', displayName: '示例用户 3', avatarUrl: '/assets/avatars/visitor-03.png' },
      { id: 'visitor-04', displayName: '示例用户 4', avatarUrl: '/assets/avatars/visitor-04.png' },
      { id: 'visitor-05', displayName: '示例用户 5', avatarUrl: '/assets/avatars/visitor-05.png' },
    ],
  },
  reading: {
    total: 2983,
  },
  sharing: {
    total: 98,
    highlightedContentTitle: 'AI 教程...',
    highlightedContentShareCount: 80,
  },
  unreadNotificationCount: 2,
}
```

### 不作为 Mock 的内容

以下内容属于界面常量或静态资源，不放进首页业务 Mock：

- 产品名称“阿宝AI”。
- “今日有”“查看详细”等固定界面文案。
- 底部导航标签和图标路径。
- 页面背景、颜色、间距和圆角。
- AI 机器人图片路径。

## Service 占位

首页只需要一个最小 service 方法：

```ts
function getHomeOverview(): Promise<HomeOverviewViewModel>
```

当前实现从 Mock 返回数据。真实接口路径、请求方式、认证方式和响应字段均不在本轮定义，也不创建预防性配置层。

实现时在 service 中保留：

```ts
// TODO(API): 接入首页摘要真实接口
// Method: 待后端确认
// Endpoint: 待后端确认
// Request: 待后端确认
// Response: HomeOverviewViewModel 的上游响应待确认
// Auth/permission: 待后端确认
// Error states: 待后端确认
```

## 待确认项

以下问题不阻塞静态首页正常态实现，但在扩展交互前需要确认：

- “阿宝AI”是否为最终产品名称。
- 问候语后续是否需要随时间或用户身份变化。
- 底部导航是否需要默认 active 项及其视觉样式。
- 点击三张摘要卡分别进入哪个页面。
- 底部导航四项的真实路由和未读角标上限规则。
- Figma 使用的 MiSans 字体是否有可合法交付的小程序字体资源；未提供时使用系统中文字体回退。
- 加载、空数据、错误和无权限状态的视觉设计。
