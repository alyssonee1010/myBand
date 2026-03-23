import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="app-shell flex min-h-screen items-center">
      <main className="container-app grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_420px] lg:items-center">
        <section className="glass-card overflow-hidden bg-[linear-gradient(145deg,rgba(8,8,8,0.96),rgba(48,48,48,0.84))]">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-white/60">MyBand</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">
            Rehearsal planning, <span className="app-brand">sharpened.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            Organize members, share charts, and run setlists from one clean workspace built for
            bands that want less chaos and faster prep.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/auth/register"
              className="btn-secondary border-white/20 bg-white text-black hover:border-white hover:bg-transparent hover:text-white"
            >
              Start Free
            </Link>
            <Link
              to="/auth/login"
              className="btn-secondary border-white/20 bg-transparent text-white hover:bg-white hover:text-black"
            >
              Log In
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-bold tracking-tight text-white">01</p>
              <p className="mt-2 text-sm text-white/60">Invite bandmates without adding them until they accept.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-bold tracking-tight text-white">02</p>
              <p className="mt-2 text-sm text-white/60">Keep charts, PDFs, and references in one shared library.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-bold tracking-tight text-white">03</p>
              <p className="mt-2 text-sm text-white/60">Move through setlists in a viewer built for rehearsal flow.</p>
            </div>
          </div>
        </section>

        <aside className="card bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(236,236,232,0.72))]">
          <p className="section-kicker">What You Get</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">A focused black-and-white workspace for your band.</h2>

          <div className="mt-8 space-y-4">
            <div className="rounded-[24px] border border-black/10 bg-white/60 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/40">Members</p>
              <p className="mt-2 text-lg font-semibold tracking-tight">Roles stay clear, invites stay controlled.</p>
            </div>
            <div className="rounded-[24px] border border-black/10 bg-white/60 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/40">Library</p>
              <p className="mt-2 text-lg font-semibold tracking-tight">Shared content is always close to the setlist.</p>
            </div>
            <div className="rounded-[24px] border border-black/10 bg-white/60 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/40">Performance</p>
              <p className="mt-2 text-lg font-semibold tracking-tight">Fullscreen viewing keeps rehearsals moving.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
