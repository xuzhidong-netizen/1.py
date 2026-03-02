# 星落接接乐

一个纯前端小游戏，打开网页就能玩。

## 本地运行

直接用浏览器打开 `index.html`。

## 操作方式

- 电脑: `←` `→` 或 `A` `D`
- 手机: 页面底部左右按钮

## GitHub Pages 上线步骤

1. 在 GitHub 新建一个空仓库。
2. 把当前目录文件推送到仓库的 `main` 分支。
3. 打开仓库的 `Settings` -> `Pages`。
4. 在 `Build and deployment` 里选择 `GitHub Actions`。
5. 等待仓库里的 `Deploy GitHub Pages` 工作流执行完成。
6. 访问生成的网站地址。

## 仓库建议文件

- `index.html`
- `style.css`
- `game.js`
- `.github/workflows/deploy-pages.yml`
