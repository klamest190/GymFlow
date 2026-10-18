import { Sparkles } from 'lucide-react'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">{title}</h1>
      <div className="glass mt-8 flex flex-col items-center rounded-3xl px-6 py-16 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-sunken text-accent-fg">
          <Sparkles className="size-6" />
        </div>
        <h2 className="mt-5 text-[20px] font-bold tracking-tight">Kommt im nächsten Schritt</h2>
        <p className="mt-1.5 max-w-sm text-[15px] text-muted">{description}</p>
      </div>
    </div>
  )
}
