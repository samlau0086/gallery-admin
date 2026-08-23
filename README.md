# 无服务器商品相册

这是一个面向小型店铺、工作室和个人卖家的在线商品目录。访客可以浏览图片、筛选分类、搜索商品、查看详情，并通过 WhatsApp 或邮件联系你。

项目不使用传统数据库，也不需要购买常驻服务器：Astro 负责前台，Decap CMS 负责后台，GitHub 保存商品资料，Cloudflare Pages 托管网站，Cloudflare R2 保存图片和视频，Cloudflare Access 保护后台。

## 1. 你需要准备什么

需要准备一个 GitHub 账号、一个 Cloudflare 账号，以及一个 GitHub 仓库。域名不是必须的，没有域名时可以先使用 Cloudflare Pages 提供的 pages.dev 地址。

## 2. 上传到 GitHub

在项目目录打开终端，执行：

~~~bash
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
~~~

如果提示 origin 已存在，可以执行 git remote -v 查看远程地址。

项目中的 .gitignore 已经忽略 node_modules、dist、.astro、.env、日志、缓存和本地上传文件。

## 3. 本地运行

先安装 Node.js 22 或更高版本，然后检查：

~~~bash
node -v
npm -v
~~~

安装依赖并启动：

~~~bash
cd gallery-admin
npm install
npm run dev
~~~

通常可以打开以下地址：

- 前台：http://localhost:4321/
- 后台：http://localhost:4321/admin/

本地后台不能完成正式 GitHub OAuth 登录，正式后台请使用部署后的 Cloudflare 地址。

检查代码和内容：

~~~bash
npm run check
npm run build
~~~

## 4. 部署到 Cloudflare Pages

1. 登录 Cloudflare 控制台。
2. 进入 Workers & Pages。
3. 点击 Create application，再选择 Pages。
4. 选择 Connect to Git，选中你的 GitHub 仓库。
5. 构建命令填写 npm run build。
6. 输出目录填写 dist。
7. 点击部署。

Cloudflare Pages 新版界面可能没有 Node.js 版本下拉框，这是正常的。当前 Pages Build Image 默认使用 Node.js 22；本项目根目录的 .node-version 已固定为 22.16.0，Cloudflare 会在构建时读取它。如果控制台没有识别该文件，也可以在项目的 Settings → Environment variables 中添加 NODE_VERSION=22.16.0。

部署后会得到类似 https://gallery-admin.pages.dev 的网址。以后向 main 分支推送代码或商品资料，Cloudflare Pages 会自动重新部署。

## 5. 创建 R2 存储图片

1. 在 Cloudflare 控制台进入 R2 Object Storage。
2. 点击 Create bucket。
3. Bucket 名称填写 gallery-media。
4. 为 bucket 绑定一个媒体域名，例如 media.example.com。

打开项目中的 wrangler.toml，把媒体域名改成自己的地址：

~~~toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "gallery-media"

[vars]
PUBLIC_MEDIA_URL = "https://media.example.com"
~~~

第一版建议直接在 R2 控制台上传图片或视频，然后复制公开 URL，粘贴到后台的 Cover URL 或 Media URL 字段。

项目中的 functions/upload.ts 已提供上传接口骨架，但还没有接入 Decap CMS 的一键上传按钮。

## 6. 配置 Decap CMS

打开 src/pages/admin/config.yml.ts，把仓库配置改成实际值：

~~~yaml
repo: 你的GitHub用户名/你的仓库名
~~~

例如：

~~~yaml
repo: samla/gallery-admin
~~~

商品文件保存在 src/content/products/。后台字段说明：

- Title：英文商品名。
- Chinese title：中文商品名，可选。
- Category：分类，例如 Bags。
- Cover URL：列表封面图片地址。
- Media：详情页图片或视频地址。
- Price：价格或 Price on request。
- Description：商品简介。
- SKU：商品库存编号，可选。
- Variants：颜色、尺寸等可选变体。
- Reviews：产品评价。后台可编辑评价状态；前台新提交的评价默认是 pending。
- Tags：标签。
- Published：是否显示在前台。
- Sort order：数字越小越靠前。

## 7. 配置 GitHub OAuth

Decap CMS 需要 GitHub OAuth 才能把后台修改写回仓库。

在 GitHub 进入 Settings → Developer settings → OAuth Apps → New OAuth App。

填写：

- Application name：Gallery Admin。
- Homepage URL：Cloudflare Pages 网站地址。
- Authorization callback URL：网站地址加上 /api/auth。

创建后保存 Client ID 和 Client Secret。

在 Cloudflare Pages 项目的 Settings → Environment variables 中添加：

- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- GITHUB_REDIRECT_URI

线上登录时，程序会自动根据当前访问域名生成回调地址，不再使用 Cloudflare 中旧的 GITHUB_REDIRECT_URI 覆盖它。访问 cf.maesvanti.online 时，GitHub OAuth App 必须登记 https://cf.maesvanti.online/api/auth/callback；访问 pages.dev 时则必须登记对应的 pages.dev 回调地址。Client Secret 不要写入代码，也不要提交到 GitHub。

### 本地测试登录

本地测试需要单独配置 GitHub OAuth。请先在 GitHub 的 Settings → Developer settings → OAuth Apps → New OAuth App 创建一个 OAuth App：

1. Homepage URL 填写 http://localhost:4321。
2. Authorization callback URL 填写 http://localhost:4321/api/auth。
3. 创建后复制 Client ID，并生成一个 Client Secret。

然后在项目根目录复制 .env.example 为 .env。Windows PowerShell 可以执行：

~~~powershell
Copy-Item .env.example .env
~~~

打开 .env，填入真实值：

~~~env
GITHUB_CLIENT_ID=你的Client_ID
GITHUB_CLIENT_SECRET=你的Client_Secret
GITHUB_REDIRECT_URI=http://localhost:4321/api/auth
~~~

保存后重启开发服务器：

~~~bash
npm run dev
~~~

浏览器打开 http://localhost:4321/admin/，点击 Login with GitHub。登录成功后，Decap CMS 会请求 GitHub 仓库的 repo 权限，用于读取和提交商品文件。

如果看到 /api/auth 的 404，说明开发服务器没有重启或仍在使用旧代码。如果看到 GitHub OAuth is not configured，说明 .env 没有创建、变量名写错，或者修改 .env 后没有重启 npm run dev。 .env 已被 .gitignore 忽略，不会提交到 GitHub。

如果终端出现 Connect Timeout Error、fetch failed 或无法连接 github.com:443，说明浏览器可以访问 GitHub，但本地 Node.js 进程被网络、防火墙或代理阻止。这不是账号密码错误。此时可以检查公司网络或代理设置，或者先部署到 Cloudflare Pages，再使用线上地址测试 OAuth。

## 8. 配置前台 Review 持久化

前台 Review 不会只停留在浏览器或邮件通知中。提交后，服务端会通过 GitHub Contents API 在仓库中创建一个待审核文件：

~~~text
src/content/reviews/<review-id>.md
~~~

Decap CMS 的后台会显示一个独立的 Reviews 集合。审核流程如下：

1. 在 GitHub 右上角头像中打开 Settings → Developer settings → Personal access tokens → Fine-grained tokens，然后点击 Generate new token。
2. Token name 可填写 `gallery-admin-reviews`；Resource owner 选择仓库所属账号；Repository access 选择 Only select repositories，并只选择此项目仓库。
3. 在 Repository permissions 中将 Contents 设置为 Read and write；其余权限保持默认即可。生成后立即复制 Token，GitHub 不会再次显示完整值。
4. 在 Cloudflare Pages 的 Settings → Environment variables 中添加：

~~~env
GITHUB_CONTENT_TOKEN=刚复制的Fine-grainedToken
GITHUB_REPO=samlau0086/gallery-admin
GITHUB_BRANCH=main
~~~

5. 如果仓库名或分支不同，请替换为实际值；Token 不要提交到 GitHub，也不要在前端代码中使用。
6. 重新部署 Cloudflare Pages。
7. 访客提交 Review 后，在后台打开 Reviews 集合，将 Status 从 `pending` 改为 `approved` 或 `rejected`，然后保存。

只有 `approved` 的 Review 会展示在前台产品详情页。`GOOGLE_APPS_SCRIPT_URL` 仍可用于 Contact/Review 的通知与表格留档，但它不是后台 CMS 的主数据来源。

## 9. 使用 Cloudflare Access 保护后台

建议只保护 /admin/*，不要保护网站前台：

1. 在 Cloudflare Zero Trust 中进入 Access → Applications。
2. 添加 Self-hosted application。
3. 填写网站域名。
4. 路径填写 /admin/*。
5. 创建允许规则，只允许你的邮箱访问。

## 10. 日常添加商品

1. 打开网站地址加上 /admin/。
2. 通过 Cloudflare Access 验证身份。
3. 使用 GitHub OAuth 登录。
4. 进入 Products，点击 New Products。
5. 填写标题、分类、封面 URL 和媒体 URL。
6. 勾选 Published。
7. 点击 Save，再点击 Publish。
8. 等待 Cloudflare Pages 自动部署。

如果不使用后台，也可以直接编辑 src/content/products/ 下的 Markdown 文件，然后执行：

~~~bash
git add .
git commit -m "更新商品资料"
git push
~~~

## 11. 常见问题

### 页面没有商品

确认商品文件中的 published 是 true，cover 和 category 有值，并运行 npm run check。

### 图片打不开

确认 R2 文件可以公开访问，URL 能在浏览器直接打开，PUBLIC_MEDIA_URL 正确，并且 URL 中没有空格。

### 后台打不开

确认 Cloudflare Access 允许你的邮箱，并且访问地址包含 /admin/。

### GitHub 登录失败

重点检查 GitHub OAuth 的 callback URL 与 GITHUB_REDIRECT_URI 是否完全一致。

### 修改没有马上出现

进入 Cloudflare Pages 的 Deployments 查看最新部署日志。构建失败时，在本地执行 npm run check 和 npm run build。

## 12. 当前版本暂不包含

购物车、在线支付、订单管理、库存扣减、客户账户、自动图片压缩，以及 Decap CMS 内置的一键 R2 媒体库。
