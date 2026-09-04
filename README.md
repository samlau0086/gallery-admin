# 无服务器商品相册

这是一个面向小型店铺、工作室和个人卖家的在线商品目录。访客可以浏览图片、筛选分类、搜索商品、查看详情，并通过 WhatsApp 或邮件联系你。

项目不使用传统数据库，也不需要购买常驻服务器：Astro 负责前台，Decap CMS 负责后台，GitHub 保存商品资料，Cloudflare Pages 托管网站，Cloudflare Access 保护后台。

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

## 4. 配置 Google Analytics 4（流量与事件）

本项目已内置 GA4 接入。未配置统计 ID 时，网站不会加载 Google Analytics；配置后会自动记录页面浏览和下列关键事件：

- `view_item`：访问商品详情页。
- `select_item`：从商品列表打开商品。
- `add_to_cart`：加入购物篮。
- `view_cart`：打开购物篮。
- `search`：提交站内搜索。为保护隐私，仅上报搜索词长度，不上报搜索内容。
- `generate_lead`：点击 WhatsApp / Email 询盘，或提交商品询盘表单。

### 获取 GA4 衡量 ID

1. 打开 Google Analytics，创建或选择一个 GA4 媒体资源。
2. 进入 **管理 → 数据流 → Web**，创建或选择网站数据流。
3. 复制显示为 `G-XXXXXXXXXX` 的 **衡量 ID（Measurement ID）**。

### 本地配置

复制 `.env.example` 为 `.env`，在其中添加真实衡量 ID：

~~~env
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
~~~

修改后重启 `npm run dev`。`PUBLIC_` 前缀表示该值会在浏览器中使用；GA 衡量 ID 不是密钥，可以公开。不要将 Google Ads、Google Tag Manager 或其他服务的私密凭据放入该变量。

### Cloudflare Pages 配置

在 Cloudflare Pages 项目的 **Settings → Environment variables** 中新增：

~~~text
Variable name: PUBLIC_GA_MEASUREMENT_ID
Value: G-你的真实衡量ID
~~~

分别为 Production 和 Preview（如需预览环境统计）添加后，重新部署站点。建议 Preview 使用单独的 GA4 数据流，以免测试流量混入正式报表。

### 验证和报表

部署后访问网站并操作一次商品、购物篮或询盘功能，再在 GA4 的 **报告 → 实时** 或 **管理 → DebugView** 检查事件。自定义参数如 `lead_channel`、`search_term_length` 需要在 **管理 → 自定义定义** 中注册后，才会出现在探索报告中。

请勿将访客姓名、邮箱、电话、留言、完整搜索内容或其他可识别个人身份的信息作为 Analytics 事件参数上报。若网站面向需征得 Cookie 同意的地区，请在用户同意统计 Cookie 后再加载 GA4，并同步更新隐私政策。

## 5. 部署到 Cloudflare Pages

1. 登录 Cloudflare 控制台。
2. 进入 Workers & Pages。
3. 点击 Create application，再选择 Pages。
4. 选择 Connect to Git，选中你的 GitHub 仓库。
5. 构建命令填写 npm run build。
6. 输出目录填写 dist。
7. 点击部署。

Cloudflare Pages 新版界面可能没有 Node.js 版本下拉框，这是正常的。当前 Pages Build Image 默认使用 Node.js 22；本项目根目录的 .node-version 已固定为 22.16.0，Cloudflare 会在构建时读取它。如果控制台没有识别该文件，也可以在项目的 Settings → Environment variables 中添加 NODE_VERSION=22.16.0。

部署后会得到类似 https://gallery-admin.pages.dev 的网址。以后向 main 分支推送代码或商品资料，Cloudflare Pages 会自动重新部署。

### 跳过 pending Review 的 Cloudflare 构建

Cloudflare Pages 的 **Build watch paths** 同时支持包含路径和排除路径。请按以下步骤配置：

1. 打开 Cloudflare Pages 项目，进入 **Settings → Builds & deployments**。
2. 找到 **Build watch paths**，点击右侧编辑按钮。
3. 保留默认的包含路径 `*`。
4. 在“排除路径”输入框中添加：

~~~text
src/content/reviews-pending/*
~~~

5. 点击 **Save**。

这样新提交的 pending Review 不会触发 Cloudflare 构建。审核通过后，GitHub Actions 会将文件移动到 `src/content/reviews/`，由于该路径未被排除，移动提交会触发正式部署。如果一次提交同时修改了排除路径和其他站点文件，仍会触发构建，这是预期行为。

## 6. 配置 Cloudflare R2 图片存储

后台图片上传默认使用 Cloudflare R2。产品封面、产品媒体和 Review 图片都会先上传到 R2，再把图片地址保存到 GitHub 内容文件中。

### 创建 R2 bucket

1. 在 Cloudflare 控制台进入 **R2 Object Storage**。
2. 点击 **Create bucket**。
3. Bucket 名称填写 `gallery-images`，或使用其他名称，但必须与项目绑定配置一致。
4. 如果希望图片使用独立域名，在 bucket 的 **Settings → Custom Domains** 中绑定，例如 `images.example.com`。
5. 确认该域名可以公开读取图片；不要把 R2 Access Key 或 Secret Key 放进前端代码。

### 配置 Cloudflare Pages

进入 Pages 项目：**Settings → Bindings**，新增 **R2 bucket binding**：

- Binding name：`IMAGES_BUCKET`
- R2 bucket：选择 `gallery-images`

`IMAGES_BUCKET` 是 Worker/Pages 的 R2 Binding，不是普通环境变量。生产环境和 Preview 环境都要分别确认绑定。

然后进入 **Settings → Variables and Secrets**，添加普通变量：

~~~text
R2_PUBLIC_URL=https://images.example.com
~~~

如果没有配置自定义域名，可以暂时不添加 `R2_PUBLIC_URL`，系统会通过站内 `/api/media/...` 路由读取 R2 对象。配置后需要重新部署 Pages。

### 验证上传

1. 打开部署后的 `/admin/` 并完成 GitHub 登录。
2. 新建或编辑一个 Product，上传 Cover image，确认图片预览正常。
3. 打开一个商品详情页提交带图片的 Review，确认 Review 图片随内容进入 Pending Reviews。
4. 在 R2 bucket 中确认出现 `products/` 或 `reviews/` 前缀的对象。

如果上传返回 `R2 storage is not configured`，检查 `IMAGES_BUCKET` Binding 是否添加到了当前部署环境；如果图片地址无法访问，检查 `R2_PUBLIC_URL` 的域名、公开访问设置和 DNS 配置。

## 7. 配置 Decap CMS

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

## 8. 配置 GitHub OAuth

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

## 9. 配置 Google Sheets Contact 与批量询盘

项目使用 Google Apps Script 将 Contact Form、Review 和购物篮批量询盘写入 Google Sheets。请在 Google Sheets 中打开 **Extensions → Apps Script**，使用 `docs/google-apps-script-contact.md` 中的脚本，并部署为 Web app：

- Execute as：`Me`
- Who has access：`Anyone`

在 Cloudflare Pages 的 Settings → Environment variables 中配置唯一的 Apps Script 地址：

~~~env
# Contact Form、Review 和购物篮批量询盘共用
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your_deployment_id/exec
~~~

这个 Apps Script 部署统一处理 Contact Form、Review 和购物篮批量询盘。购物篮询盘会写入 `Inquiries` 工作表，并向 `NOTIFY_EMAIL` 发送包含完整产品清单的通知；WhatsApp 和 Email 只发送询盘编号，因此不会因产品数量过多而超出消息长度限制。修改环境变量后需要重新部署 Cloudflare Pages。
## 10. 配置前台 Review 持久化

前台 Review 不会只停留在浏览器或邮件通知中。提交后，服务端会通过 GitHub Contents API 在仓库中创建一个待审核文件：

~~~text
src/content/reviews-pending/<review-id>.md
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
7. 访客提交 Review 后，在后台打开 Pending Reviews 集合，将 Status 从 `pending` 改为 `approved`、`published` 或 `rejected`，然后保存。GitHub Actions 会自动把 `approved` 或 `published` 文件移动到 `src/content/reviews/`，并统一保存为 `approved`，随后触发正式站点部署。

只有 `approved` 的 Review 会展示在前台产品详情页。`GOOGLE_APPS_SCRIPT_URL` 可用于 Contact、Review 和购物篮批量询盘的通知与表格留档，但它不是后台 CMS 的主数据来源。购物篮批量询盘会写入 Google Sheets 的 `Inquiries` 工作表；WhatsApp/Email 只发送询盘编号，不再发送完整产品清单，避免产品过多时消息超长。配置方式见 `docs/google-apps-script-contact.md`。

## 11. 使用 Cloudflare Access 保护后台

建议只保护 /admin/*，不要保护网站前台：

1. 在 Cloudflare Zero Trust 中进入 Access → Applications。
2. 添加 Self-hosted application。
3. 填写网站域名。
4. 路径填写 /admin/*。
5. 创建允许规则，只允许你的邮箱访问。

## 12. 日常添加商品

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

### 从 JSON 批量导入商品

JSON 文件包含 `ID`、`标签`、`货号`、`标题`、`图片`、`时间` 字段时，可执行：

~~~bash
npm run convert:products -- src/gucci_handbag.json
~~~

脚本会在 `src/content/products/` 中生成 Astro 商品文件，自动使用首张图片作为封面，并按 JSON 的顺序设置排序。文件名会根据 JSON 文件名推断品牌；也可以显式指定：

~~~bash
npm run convert:products -- path/to/products.json --brand Gucci --category Bags
~~~

默认不会覆盖已有商品。标题为空时会自动使用 SKU；只有 SKU 和图片都为空时才跳过。缺少图片但有 SKU 的商品会使用站内占位图。确实需要用 JSON 更新同名 SKU 时，才添加 `--overwrite`。

## 13. 外部产品查询接口

外部系统可以通过 SKU 查询已发布商品的完整信息：

~~~http
GET https://gallery.maesvanti.online/api/products/by-sku?sku=170004
~~~

接口无需额外鉴权。SKU 查询会忽略首尾空格和大小写，成功时直接返回完整商品 JSON，包括标题、品牌、分类、SKU、封面、媒体、价格、描述、标签、变体和评价。

- `200`：查询成功，响应为商品对象。
- `400`：未提供 `sku` 参数或参数为空。
- `404`：未找到对应 SKU 的已发布商品。
- `409`：存在多个相同 SKU，需先修正商品数据。
- `503`：商品索引或商品数据暂时不可用。

## 14. 常见问题

### 页面没有商品

确认商品文件中的 published 是 true，cover 和 category 有值，并运行 npm run check。

### 图片打不开

确认图片文件可以公开访问，URL 能在浏览器直接打开，并且 URL 中没有空格。

### 后台打不开

确认 Cloudflare Access 允许你的邮箱，并且访问地址包含 /admin/。

### GitHub 登录失败

重点检查 GitHub OAuth 的 callback URL 与 GITHUB_REDIRECT_URI 是否完全一致。

### 修改没有马上出现

进入 Cloudflare Pages 的 Deployments 查看最新部署日志。构建失败时，在本地执行 npm run check 和 npm run build。

## 14. 当前版本暂不包含

购物车、在线支付、订单管理、库存扣减、客户账户、自动图片压缩，以及 Decap CMS 内置的一键 R2 媒体库。
