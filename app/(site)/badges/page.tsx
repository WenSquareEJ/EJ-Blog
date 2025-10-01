export default function BadgesPage() {
  const sample = [
    { name: 'Explorer', desc: 'Posted a nature story' },
    { name: 'Builder', desc: 'Shared a LEGO / Minecraft build' }
  ]
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Badges</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sample.map(b=> (
          <li key={b.name} className="border rounded-xl p-4 bg-white">
            <h3 className="font-semibold">{b.name}</h3>
            <p className="text-sm text-gray-600">{b.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
