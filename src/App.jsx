import { useMemo, useState } from 'react'
import newsData from './data/news.json'

const CATEGORIES = [
  { key: 'ALL', label: 'すべて' },
  { key: 'QA', label: 'QA・テスト' },
  { key: 'PdM', label: 'プロダクトマネジメント' },
  { key: 'PjM', label: 'プロジェクトマネジメント' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function daysAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

export default function App() {
  const [category, setCategory] = useState('ALL')

  const items = useMemo(() => {
    if (category === 'ALL') return newsData.items
    return newsData.items.filter((it) => it.category === category)
  }, [category])

  return (
    <div className="app">
      <header className="header">
        <h1 className="header-title">
          World <span className="accent">PM / QA</span> News
        </h1>
        <p className="header-sub">
          世界の最新QA・プロダクトマネジメント・プロジェクトマネジメントのニュースを日本語で
        </p>
        {newsData.updatedAt && (
          <p className="updated-at">最終更新: {formatDate(newsData.updatedAt)}</p>
        )}
      </header>

      <nav className="tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`tab ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <main className="list">
        {items.length === 0 && <p className="empty">記事がまだありません。</p>}
        {items.map((it) => {
          const ago = daysAgo(it.publishedAt)
          return (
            <a
              key={it.url}
              className="card"
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="card-meta">
                <span className={`badge badge-${it.category.toLowerCase()}`}>{it.category}</span>
                <span className="source">{it.sourceName}</span>
                <span className="date">
                  {formatDate(it.publishedAt)}
                  {ago !== null && ago <= 3 && <span className="new-label">NEW</span>}
                </span>
              </div>
              <h2 className="card-title">{it.titleJa}</h2>
              <p className="card-summary">{it.summaryJa}</p>
              <p className="card-original">原文: {it.title}</p>
            </a>
          )
        })}
      </main>

      <footer className="footer">
        <p>
          記事の要約・翻訳はClaude APIによる自動生成です。正確な内容は原文をご確認ください。
        </p>
      </footer>
    </div>
  )
}
