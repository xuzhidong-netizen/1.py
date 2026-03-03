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

## 本地运行

直接用浏览器打开 `index.html` 即可。

## 页面结构

- `index.html`
  首页，展示所有游戏卡片
- `play.html`
  游戏页，通过 `?game=` 参数打开对应游戏

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
