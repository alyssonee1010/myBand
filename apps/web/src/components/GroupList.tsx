import { Link } from 'react-router-dom'

interface Group {
  id: string
  name: string
  description?: string
}

interface Props {
  groups: Group[]
}

export default function GroupList({ groups }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group, index) => (
        <Link key={group.id} to={`/groups/${group.id}`} className="group block h-full">
          <div className="card flex h-full flex-col justify-between bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(231,231,227,0.75))] transition duration-200 group-hover:-translate-y-1 group-hover:border-black/20">
            <div>
              <p className="section-kicker">Band {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-black">{group.name}</h3>
              <p className="mt-3 min-h-[3rem] text-sm leading-6 text-black/60">
                {group.description || 'Open this workspace to manage members, files, and setlists.'}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <span className="stat-pill">Open Workspace</span>
              <span className="text-lg text-black/60 transition group-hover:translate-x-1 group-hover:text-black">
                →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
