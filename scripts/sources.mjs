// ニュースソース定義。RSSフィードを追加・削除する場合はここを編集する。
export const SOURCES = [
  // ---- QA / テスト ----
  {
    category: 'QA',
    name: 'Google Testing Blog',
    url: 'https://testing.googleblog.com/feeds/posts/default?alt=rss',
  },
  {
    category: 'QA',
    name: 'TestGuild',
    url: 'https://testguild.com/feed/',
  },
  {
    category: 'QA',
    name: 'QA Hiccupps (James Thomas)',
    url: 'https://qahiccupps.blogspot.com/feeds/posts/default?alt=rss',
  },
  {
    category: 'QA',
    name: 'Automation Panda',
    url: 'https://automationpanda.com/feed/',
  },
  {
    category: 'QA',
    name: 'Satisfice (James Bach)',
    url: 'https://www.satisfice.com/feed',
  },

  // ---- PdM / プロダクトマネジメント ----
  {
    category: 'PdM',
    name: 'Product Coalition',
    url: 'https://productcoalition.com/feed',
  },
  {
    category: 'PdM',
    name: 'Melissa Perri',
    url: 'https://melissaperri.com/blog?format=rss',
  },
  {
    category: 'PdM',
    name: 'Silicon Valley Product Group',
    url: 'https://www.svpg.com/feed/',
  },
  {
    category: 'PdM',
    name: "Lenny's Newsletter",
    url: 'https://www.lennysnewsletter.com/feed',
  },
  {
    category: 'PdM',
    name: 'Product Talk (Teresa Torres)',
    url: 'https://www.producttalk.org/feed/',
  },

  // ---- PjM / プロジェクトマネジメント ----
  {
    category: 'PjM',
    name: 'Scrum.org Blog',
    url: 'https://www.scrum.org/resources/blog/rss.xml',
  },
  {
    category: 'PjM',
    name: "Rebel's Guide to Project Management",
    url: 'https://rebelsguidetopm.com/feed/',
  },
  {
    category: 'PjM',
    name: 'Easy in Theory (Kiron Bondale)',
    url: 'https://kbondale.wordpress.com/feed/',
  },
]

// 1ソースあたり最大何件取り込むか
export const MAX_ITEMS_PER_SOURCE = 5
// 何日前までの記事を対象にするか
export const MAX_AGE_DAYS = 21
