import { motion } from 'framer-motion'
import { SOCIAL_ICONS } from './SocialIcons'
import { FOCUS_POINTS } from '../data/focusPoints'

interface ResumeGroup {
  heading?: string
  logoImg?: string
  sub?: string
  link?: string
  items?: string[]
  links?: { id: string; label: string; href: string }[]
}
interface ResumeEntry {
  period: string
  place: string
  role?: string
  logo?: { src: string; alt: string }
  points?: string[]
  groups?: ResumeGroup[]
}
const RESUME: Record<'en' | 'zh', { title: string; entries: ResumeEntry[] }> = {
  en: {
    title: 'Research directions',
    entries: [
      {
        period: '01 · Clinical AI',
        place: 'Pediatric Savior',
        role: 'How can practice feel closer to care?',
        points: ['Conversational simulation for pediatric airway training.'],
      },
      {
        period: '02 · Computational biology',
        place: 'speciesOT',
        role: 'What can a mouse cell tell us about a human cell?',
        points: ['Optimal transport connects species in a shared latent space.'],
      },
      {
        period: '03 · Agent systems',
        place: 'Job Search OS',
        role: 'Discovery runs overnight. Decisions stay with me.',
        points: [
          'Review a local queue, choose Apply or Pass, then reconcile and validate against the Simplify ledger.',
        ],
      },
      {
        period: '04 · Research infrastructure',
        place: 'scGen / CellOT autoresearch',
        role: 'Run, compare, and choose the next experiment.',
        points: ['An experiment loop for scGen and CellOT on FASRC Cannon.'],
      },
      {
        period: '05 · Open methods',
        place: 'From ideas to working systems',
        role: 'Clear tools and explicit workflows that another person can pick up.',
        groups: [
          { heading: 'Explore selected work', link: '#works' },
          { heading: 'More about me', link: '#about' },
        ],
      },
    ],
  },
  zh: {
    title: '研究方向',
    entries: [
      {
        period: '01 · 临床 AI',
        place: 'Pediatric Savior',
        role: '怎样让练习更接近真实诊疗？',
        points: ['用对话模拟支持儿科气道训练。'],
      },
      {
        period: '02 · 计算生物学',
        place: 'speciesOT',
        role: '小鼠细胞能告诉我们什么关于人类细胞的信息？',
        points: ['在共享潜在空间中，用最优传输连接不同物种。'],
      },
      {
        period: '03 · 智能体系统',
        place: 'Job Search OS',
        role: '夜间发现机会，申请决定由我做。',
        points: ['检查本地队列，选择 Apply 或 Pass，再与 Simplify 记录核对并验证。'],
      },
      {
        period: '04 · 研究基础设施',
        place: 'scGen / CellOT autoresearch',
        role: '运行、比较，再选择下一次实验。',
        points: ['在 FASRC Cannon 上组织 scGen 和 CellOT 的实验循环。'],
      },
      {
        period: '05 · 开放方法',
        place: '从想法到可运行的系统',
        role: '清楚的工具与明确的工作流，让他人可以接着做。',
        groups: [
          { heading: '浏览精选项目', link: '#works' },
          { heading: '更多关于我', link: '#about' },
        ],
      },
    ],
  },
}

// 履历条目依次对应 glb 里的聚焦锚点（相机停靠点），顺序须与 entries 一致。
// 名单是唯一真源，见 data/focusPoints.ts（Scene.tsx 也从那里取）。
const POINT_ORDER = FOCUS_POINTS

const EASE = [0.22, 1, 0.36, 1]
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function Group({ group }: { group: ResumeGroup }) {
  const heading =
    group.link ? (
      <a
        className="about-link"
        href={group.link}
        target={group.link.startsWith('https://') ? '_blank' : undefined}
        rel={group.link.startsWith('https://') ? 'noopener noreferrer' : undefined}
      >
        {group.heading}
      </a>
    ) : (
      <span>{group.heading}</span>
    )

  return (
    <motion.div className="tl-group" variants={itemV}>
      <div className="tl-group-head">
        {group.logoImg && (
          <span className="tl-group-logo">
            <img src={group.logoImg} alt={group.heading || ''} loading="lazy" />
          </span>
        )}
        {heading}
        {group.sub && <span className="tl-group-sub">{group.sub}</span>}
      </div>
      {group.items && (
        <ul className="tl-points">
          {group.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
      {group.links && (
        <div className="tl-logos">
          {group.links.map((l) => {
            const Icon = SOCIAL_ICONS[l.id as keyof typeof SOCIAL_ICONS]
            return (
              <a
                key={l.id}
                className="tl-logo"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.label}
                title={l.label}
              >
                <Icon />
              </a>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div
      className="tl-entry"
      data-point={POINT_ORDER[index]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      {/* tl-body 包住文字内容（点保持在外做时间轴标记）：移动端可给它加卡片衬底，
          且它紧贴内容高度，不含 tl-entry 用于排布的大 padding。
          用普通 div（非 motion）：framer 变体经 React context 穿透它，叶子元素仍是
          tl-entry 的直接 stagger 子级，入场动画与包裹前完全一致。 */}
      <div className="tl-body">
        <motion.div className="tl-period" variants={itemV}>
          {entry.period}
        </motion.div>
        <motion.div className="tl-head" variants={itemV}>
          {entry.logo && (
            <span className="tl-logo-chip">
              <img src={entry.logo.src} alt={entry.logo.alt} loading="lazy" />
            </span>
          )}
          <h3 className="tl-place">{entry.place}</h3>
        </motion.div>
        {entry.role && (
          <motion.div className="tl-role" variants={itemV}>
            {entry.role}
          </motion.div>
        )}
        {entry.points && (
          <motion.ul className="tl-points" variants={itemV}>
            {entry.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </motion.ul>
        )}
        {entry.groups && entry.groups.map((g, i) => <Group key={i} group={g} />)}
      </div>
    </motion.div>
  )
}

export default function Resume({ lang }: { lang: 'en' | 'zh' }) {
  const data = RESUME[lang]
  return (
    <section className="resume" lang={lang}>
      <motion.h2
        className="resume-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {data.title}
      </motion.h2>
      <div className="timeline">
        {data.entries.map((e, i) => (
          <Entry key={i} entry={e} index={i} />
        ))}
      </div>
    </section>
  )
}
