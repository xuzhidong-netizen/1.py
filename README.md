# 小游戏大厅

一个包含多个小游戏的纯前端单机游戏厅，首页展示游戏列表，点击后跳转到独立游玩页。

## 当前内容

- 星落接接乐
- 斗地主小游戏
- 井字棋
- 记忆翻牌
- 打地鼠
- 贪吃蛇
- 2048
- 石头剪刀布
- 反应速度测试
- 打砖块
- 五子棋
- 六子棋
- 四子棋
- 黑白棋
- 跳棋对战
- 迷你数独
- 扫雷棋盘
- 汉诺塔
- 熄灯棋
- 兵卒棋

## 本地运行

直接用浏览器打开 `index.html` 即可。

## 自动化测试

安装依赖后执行：

```bash
npm test
```

当前自动化覆盖：

- `unit`：游戏目录数据完整性
- `integration`：首页搜索、分类、结果渲染
- `functional`：独立游戏页直达启动与核心棋类交互
- `system`：本地静态服务冒烟检查
- `stability`：20 个游戏独立打开回归
- `usability`：关键入口、移动端元信息与按钮可读性

## 页面结构

- `index.html`
  首页，展示所有游戏卡片
- `play.html`
  单游戏游玩页，通过 `?game=` 参数直接打开并开始对应游戏，页面只保留返回大厅按钮

示例:

- `play.html?game=star`
- `play.html?game=snake`
- `play.html?game=breakout`

## 部署说明

这是纯静态站点，适合直接部署到 `GitHub Pages`。

## 关键文件

- `index.html`
- `play.html`
- `style.css`
- `game.js`
