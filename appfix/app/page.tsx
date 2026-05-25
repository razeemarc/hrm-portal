import Link from "next/link";

const navItems = ["Login", "Wishlist", "Cart"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4efe7] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 text-2xl font-black tracking-[0.2em] text-black"
            aria-label="Home"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm text-white">
              L
            </span>
            <span>LOGO</span>
          </Link>

          <div className="relative flex min-w-0 flex-1 items-center">
            <input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="h-12 w-full rounded-full border border-black/10 bg-[#f9f7f2] px-5 text-sm outline-none transition placeholder:text-slate-500 focus:border-black/30 focus:bg-white"
            />
          </div>

          <nav className="hidden items-center gap-3 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-black/20 hover:bg-black hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
        <div className="rounded-[2rem] bg-[#efe6d7] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-600">
            Home page
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            A clean storefront home page with the exact navbar you asked for.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
            This replaces the current starter screen and gives you a simple
            homepage with Search, Logo, Login, Wishlist, and Cart in the top
            navigation.
          </p>
        </div>

        <aside className="grid gap-5">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Navbar items
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 text-sm font-medium text-slate-800">
                Search
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 text-sm font-medium text-slate-800">
                Logo
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 text-sm font-medium text-slate-800">
                Login
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 text-sm font-medium text-slate-800">
                Wishlist
              </div>
              <div className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 text-sm font-medium text-slate-800">
                Cart
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
