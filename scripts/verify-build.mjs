import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://docs.riadchain.com';
const documents = new Map();
const errors = new Set();

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }));
  return lists.flat();
}

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
}

async function document(path) {
  if (documents.has(path)) return documents.get(path);
  const result = { ids: new Set(), links: [], canonical: null };
  walk(parse(await readFile(path, 'utf8')), node => {
    const attrs = new Map((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (attrs.has('id')) result.ids.add(attrs.get('id'));
    if (node.tagName === 'link' && attrs.get('rel') === 'canonical') result.canonical = attrs.get('href');
    if (attrs.has('data-docs-diagram')) {
      errors.add(`${relative(root, path)}: public documentation must not contain diagrams`);
    }
    for (const attribute of ['href', 'src']) {
      if (attribute === 'href' && ['canonical', 'alternate'].includes(attrs.get('rel'))) continue;
      if (attrs.has(attribute)) result.links.push(attrs.get(attribute));
    }
  });
  documents.set(path, result);
  return result;
}

const html = (await files(root)).filter(path => extname(path) === '.html');
for (const path of html) {
  const name = relative(root, path).split('\\').join('/');
  const route = name.endsWith('index.html') ? name.slice(0, -10) : name;
  const current = new URL('/' + route, origin);
  const page = await document(path);
  if (name !== '404.html' && page.canonical !== current.href) {
    errors.add(`${name}: canonical URL must be ${current.href}`);
  }
  for (const raw of page.links) {
    const target = new URL(raw, current);
    if (target.origin !== origin) continue;
    const pathname = decodeURIComponent(target.pathname).replace(/^\/+/, '');
    const asset = resolve(root, pathname);
    if (relative(root, asset).startsWith('..')) throw new Error('Link escapes output directory');
    const destination = target.pathname.endsWith('/') ? join(asset, 'index.html') : asset;
    try {
      await access(destination);
      if (target.hash && extname(destination) === '.html') {
        const id = decodeURIComponent(target.hash.slice(1));
        if (!(await document(destination)).ids.has(id)) errors.add(`${name}: missing anchor ${raw}`);
      }
    } catch {
      errors.add(`${name}: missing local target ${raw}`);
    }
  }
}

await access(join(root, '404.html'));
await access(join(root, 'pagefind/pagefind.js'));
if (errors.size) {
  console.error([...errors].sort().join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${html.length} static pages, canonical URLs, local links/anchors/assets, search, 404 output and no documentation diagrams.`);
}
