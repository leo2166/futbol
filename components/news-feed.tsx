"use client"

import Image from "next/image"
import { ExternalLink, Newspaper } from "lucide-react"
import type { NewsArticle } from "@/lib/football-api"
import { EmptyState, ErrorState, SectionTitle, Skeleton } from "@/components/states"

function timeAgo(dateString: string): string {
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000
    if (diff < 60) return "Hace un momento"
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
    const days = Math.floor(diff / 86400)
    return `Hace ${days} ${days === 1 ? "día" : "días"}`
  } catch {
    return ""
  }
}

export function NewsFeed({
  articles,
  isLoading,
  isError,
  onRetry,
}: {
  articles?: NewsArticle[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  return (
    <section>
      <SectionTitle icon={<Newspaper className="h-4 w-4" />}>
        Últimas Noticias
      </SectionTitle>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message="No se pudieron cargar las noticias desde ESPN."
          onRetry={onRetry}
        />
      ) : articles && articles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((art) => (
            <a
              key={art.id}
              href={art.webUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm transition-all hover:border-[var(--team-accent)]/50 hover:bg-card/80 hover:shadow-lg hover:shadow-[var(--team-accent)]/5"
            >
              <div>
                {art.imageUrl && (
                  <div className="relative mb-3.5 h-44 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={art.imageUrl}
                      alt={art.headline}
                      fill
                      sizes="(max-width: 768px) 100vw, 380px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {timeAgo(art.published)}
                  </span>
                  {art.byline && (
                    <span className="truncate text-[11px] text-muted-foreground/80 font-mono">
                      {art.byline}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-[var(--team-accent)] line-clamp-2">
                  {art.headline}
                </h3>

                {art.description && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                    {art.description}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--team-accent)] opacity-85 group-hover:opacity-100">
                <span>Leer en ESPN</span>
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState label="No hay noticias recientes disponibles." />
      )}
    </section>
  )
}
