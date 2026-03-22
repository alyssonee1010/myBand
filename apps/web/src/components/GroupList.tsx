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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <Link key={group.id} to={`/groups/${group.id}`}>
          <div className="card hover:shadow-lg transition cursor-pointer h-full">
            <h3 className="text-xl font-bold mb-2">{group.name}</h3>
            {group.description && (
              <p className="text-gray-600 mb-4">{group.description}</p>
            )}
            <p className="text-blue-600 hover:underline">View band →</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
