// RSSを取得し、Claude APIで日本語タイトル・要約を生成して src/data/news.json を更新する。
// 使い方:
//   ANTHROPIC_API_KEY=... npm run update-news
//   npm run update-news -- --no-translate   (翻訳をスキップしてRSS取得のみ確認)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { SOURCES, MAX_ITEMS_PER_SOURCE, MAX_AGE_DAYS } from './sources.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(here, '..', 'src', 'data', 'news.json')
const NO_TRANSLATE = process.argv.includes('--no-translate')
const TRANSLATE_BATCH_SIZE = 10

const parser = new Parser({ timeout: 20000 })

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchAllFeeds() {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const feed = await parser.parseURL(source.url)
      return (feed.items || [])
        .map((item) => ({
          category: source.category,
          sourceName: source.name,
          title: (item.title || '').trim(),
          url: item.link || '',
          publishedAt: item.isoDate || item.pubDate || null,
          excerpt: stripHtml(item.contentSnippet || item.content || '').slice(0, 600),
        }))
        .filter((it) => it.title && it.url)
        .filter((it) => !it.publishedAt || new Date(it.publishedAt).getTime() >= cutoff)
        .slice(0, MAX_ITEMS_PER_SOURCE)
    }),
  )

  const items = []
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      items.push(...res.value)
      console.log(`✓ ${SOURCES[i].name}: ${res.value.length}件`)
    } else {
      console.warn(`✗ ${SOURCES[i].name}: 取得失敗 (${res.reason?.message || res.reason})`)
    }
  })
  return items
}

function loadExisting() {
  try {
    const data = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
    return new Map(data.items.map((it) => [it.url, it]))
  } catch {
    return new Map()
  }
}

async function translateBatch(client, items) {
  const payload = items.map((it, i) => ({
    index: i,
    title: it.title,
    excerpt: it.excerpt,
    source: it.sourceName,
    category: it.category,
  }))

  const schema = {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer' },
            titleJa: { type: 'string' },
            summaryJa: { type: 'string' },
          },
          required: ['index', 'titleJa', 'summaryJa'],
          additionalProperties: false,
        },
      },
    },
    required: ['results'],
    additionalProperties: false,
  }

  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system:
      'あなたはQA(ソフトウェアテスト)・プロダクトマネジメント・プロジェクトマネジメント分野に詳しい技術翻訳者です。' +
      '海外記事のタイトルと抜粋を受け取り、日本語のタイトルと要約を返します。' +
      'titleJa: 自然な日本語タイトル(直訳より意味が伝わる訳を優先、40文字以内目安)。' +
      'summaryJa: 記事の要点を2〜3文(120〜200文字程度)で要約。専門用語(スプリント、リグレッションテスト等)はそのままカタカナ・英語で可。' +
      '抜粋から内容が判断できない場合はタイトルから推測できる範囲で簡潔に書くこと。',
    messages: [
      {
        role: 'user',
        content: `次の記事リストを日本語化してください。必ず全${payload.length}件、indexを維持して返してください。\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    output_config: { format: { type: 'json_schema', schema } },
  })

  const message = await stream.finalMessage()
  if (message.stop_reason === 'refusal') {
    throw new Error('翻訳リクエストが拒否されました')
  }
  const text = message.content.find((b) => b.type === 'text')?.text || '{}'
  const parsed = JSON.parse(text)
  return parsed.results || []
}

async function main() {
  console.log('RSSフィードを取得中...')
  const fetched = await fetchAllFeeds()
  console.log(`合計 ${fetched.length} 件取得`)

  const existing = loadExisting()
  const toTranslate = fetched.filter((it) => !existing.has(it.url))
  const kept = fetched.filter((it) => existing.has(it.url)).map((it) => existing.get(it.url))
  console.log(`新規 ${toTranslate.length} 件 / 既訳 ${kept.length} 件`)

  let translated = []
  if (NO_TRANSLATE || toTranslate.length === 0) {
    if (toTranslate.length > 0) console.log('--no-translate 指定のため翻訳をスキップ')
    translated = toTranslate.map((it) => ({ ...it, titleJa: it.title, summaryJa: it.excerpt.slice(0, 200) }))
  } else {
    // 認証は ANTHROPIC_API_KEY または `ant auth login` のプロファイルを自動解決する
    const client = new Anthropic()
    for (let i = 0; i < toTranslate.length; i += TRANSLATE_BATCH_SIZE) {
      const batch = toTranslate.slice(i, i + TRANSLATE_BATCH_SIZE)
      console.log(`翻訳中... ${i + 1}〜${i + batch.length} / ${toTranslate.length}`)
      const results = await translateBatch(client, batch)
      for (const r of results) {
        const src = batch[r.index]
        if (src) translated.push({ ...src, titleJa: r.titleJa, summaryJa: r.summaryJa })
      }
    }
  }

  const items = [...kept, ...translated]
    .filter((it) => it.titleJa)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

  const out = {
    updatedAt: new Date().toISOString(),
    items,
  }
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
  console.log(`✓ ${OUT_PATH} を更新しました (${items.length}件)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
