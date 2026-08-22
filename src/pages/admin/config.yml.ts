const config = String.raw`backend:
  name: github
  repo: samlau0086/gallery-admin
  branch: main
  base_url: https://cf.maesvanti.online
  auth_endpoint: api/auth
media_folder: "public/uploads"
public_folder: "/uploads"
collections:
  - name: settings
    label: Site settings
    files:
      - name: site
        label: Site settings
        file: src/data/site.json
        format: json
        fields:
          - { label: Site name, name: name, widget: string }
          - { label: Tagline, name: tagline, widget: string }
          - { label: Hero image URL, name: hero, widget: image }
          - { label: WhatsApp URL, name: whatsapp, widget: string, hint: 'Include https://wa.me/ and the full international number' }
          - { label: Email address, name: email, widget: string }
  - name: products
    label: Products
    folder: src/content/products
    create: true
    slug: "{{slug}}"
    format: frontmatter
    fields:
      - { label: Title, name: title, widget: string }
      - { label: Chinese title, name: titleZh, widget: string, required: false }
      - { label: Category, name: category, widget: string }
      - { label: Cover URL, name: cover, widget: image }
      - { label: Media, name: media, widget: list, required: false, fields: [{ label: URL, name: url, widget: string }, { label: Type, name: type, widget: select, options: [image, video] }, { label: Alt text, name: alt, widget: string, required: false }] }
      - { label: Price, name: price, widget: string, required: false }
      - { label: Description, name: description, widget: text, required: false }
      - { label: Tags, name: tags, widget: list, required: false }
      - { label: Published, name: published, widget: boolean, default: true }
      - { label: Sort order, name: sortOrder, widget: number, value_type: int, default: 0 }
`;

export const prerender = false;

export function GET() {
  return new Response(config, {
    headers: {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
