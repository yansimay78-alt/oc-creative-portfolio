# 严穗敏 × Mio · Creative Portfolio

以手绘音乐游乐园为主题的个人校招作品集，展示个人介绍、实习项目、摄影作品和留忆产品实践。

**在线访问：[严穗敏 × Mio 作品集](https://oc-creative-portfolio.vercel.app/)**

[Sites 备用地址](https://oc-creative-portfolio.yansimay78.chatgpt.site/)

## 体验

- Three.js 三维相框旋转木马：点击点亮，拖动旋转，鼠标移动时轻微倾斜。
- 手写英文标题、渐变字色、延伸琴键、背景视差与下落音符。
- 独立摄影展厅：风景／人像分类、唱片半圆漫游、三维环绕无限画布、暂停与大图浏览。
- 麦当劳及 BSH 实习详情，配合海报、视频和工作台案例。
- 留忆（Memory Islands）产品介绍与预置照片册阅读演示。
- The Story Never Ends — LAUV 背景音乐：主动点击播放，支持暂停、音量调整；观看视频时暂时暂停。
- 简历下载、联系方式，移动端适配、键盘操作和减少动态效果支持。

## 本地运行

`dist/` 已包含可直接使用的网站及本地素材，无需构建。安装 Python 3 后，在仓库目录运行：

```sh
python3 -m http.server 4191 --directory dist
```

打开 **http://localhost:4191/**。请通过 HTTP 服务打开，直接双击 HTML 无法完整加载 JavaScript 模块。

## 目录

```text
dist/
  index.html                # 首页及公共页面结构
  gallery/index.html        # 摄影展厅入口
  projects/*/index.html     # 项目详情入口
  app.js                    # 页面导航、唱片漫游及作品预览
  hero-carousel.js          # 木马场景的可运行 JavaScript
  vortex-canvas.js          # 三维环绕摄影展
  music.js                  # 背景音乐播放控制
  motion.js                 # GSAP 动效
  photo-data.js             # 摄影作品分类与尺寸
  projects.js               # 项目内容
  style.css                 # 页面样式
  assets/                   # 照片、插画、字体、视频、音乐及简历
  vendor/                   # 本地依赖与第三方许可
src/                        # 木马相关 TypeScript 源码
scripts/build.mjs           # 编译场景并同步独立页面入口
```

常规内容可在 `dist/` 内修改。若改动 `src/` 中的木马场景，或修改首页公共结构，请运行：

```sh
npm install
npm run build
```

此构建只将场景 TypeScript 转为 JavaScript，并同步 `gallery/` 和 `projects/` 的公共页面结构；它不执行 TypeScript 类型检查。

## 部署

当前部署于 Vercel，已关联本 GitHub 仓库的 `main` 分支。`vercel.json` 指定框架为 Other、构建命令为 `npm run build`、发布目录为 `dist`，并保留目录路径末尾的斜杠。向 `main` 推送更新后，由 Vercel 自动构建和发布。

也可使用其他支持静态网站的托管服务，将 **`dist/` 设置为发布目录**。Sites 备用地址单独维护，不随本仓库推送更新。

## 作者、参考与使用范围

这是个人作品集的源码公开仓库，**不对全部代码和素材统一授予 MIT 等开源许可**。各部分遵守其原有许可：

- **Carousel Lamp / 咕噜蛋Daria**：[原项目](https://github.com/Daria1216/carousel-lamp)。本项目是修改版，保留原木马、相框结构和纹理，加入个人照片、配色及鼠标跟随。完整的**非商业使用许可**位于 `dist/vendor/carousel/LICENSE.txt`，页面保留作者署名与原项目链接。
- **Vortex Gallery / J0SUKE**：[交互参考](https://github.com/J0SUKE/vortex-gallery)。`vortex-canvas.js` 独立实现圆筒环绕照片流动，未包含参考项目的示例照片或着色器源码。
- **r3f-experimental-carousel / colindmg**：[早期交互参考](https://github.com/colindmg/r3f-experimental-carousel)。相关 MIT 许可保留于 `dist/vendor/CAROUSEL-LICENSE.txt`。
- **Three.js**：MIT 许可见 `dist/vendor/THREE-LICENSE.txt`。
- **GSAP / ScrollTrigger**：许可说明见 `dist/vendor/GSAP-LICENSE.txt` 及文件版权头。
- **Caveat Brush、ZCOOL KuaiLe**：OFL 字体，许可见 `dist/assets/fonts/`。
- **haoqi.design**：[视觉与编排参考](https://haoqi.design/)，未复制其代码或素材。
- 摄影、人物肖像、简历、企业案例图片、视频和音乐不因仓库公开而获得可自由再利用的许可；相关权利归各自权利人所有。背景音乐标注为 **The Story Never Ends — LAUV**。

网站内容由严穗敏提供与构思，AI 协助梳理及实现。
