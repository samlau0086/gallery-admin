# Gallery Admin

无服务器商品相册：Astro + Decap CMS + Cloudflare Pages/R2。

## 本地运行

运行 npm install，然后执行 npm run dev。前台地址为 /，后台地址为 /admin/。

## Cloudflare 配置

1. 将仓库连接到 Cloudflare Pages，构建命令为 npm run build，输出目录为 dist。
2. 创建 R2 bucket gallery-media，绑定自定义域名，并绑定 MEDIA_BUCKET。
3. 设置 PUBLIC_MEDIA_URL 为 R2 自定义域名。
4. 在 GitHub 创建 OAuth App，将回调地址设为 https://你的域名/api/auth，并配置 GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET、GITHUB_REDIRECT_URI。
5. 修改 public/admin/config.yml 中的 repo。
6. 用 Cloudflare Access 保护 /admin/*。

商品文件位于 src/content/products/。商品资料进入 Git，媒体文件进入 R2，不需要数据库。
