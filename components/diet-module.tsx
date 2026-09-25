"use client"

import * as React from "react"
import { NutritionPageV2 } from "@/components/nutrition-page-v2"
import { NutritionStatsPage } from "@/components/nutrition-stats-page"
import { NutritionDetailPage } from "@/components/nutrition-detail-page"
import { FoodLibraryPage } from "@/components/food-library"
import { RecipePage } from "@/components/recipe-page"
import { useNutritionProfile, type UserProfile } from "@/lib/nutrition-targets"
import { cn } from "@/lib/utils"

type DietView = "main" | "detail" | "food" | "recipe"

export function DietModule() {
  const [tab, setTab] = React.useState<"today" | "stats">("today")
  const [view, setView] = React.useState<DietView>("main")
  const [profile, setProfile] = useNutritionProfile()

  if (view === "detail") {
    return (
      <NutritionDetailPage
        profile={profile}
        onProfileChange={setProfile}
        onBack={() => setView("main")}
        onAddFood={() => setView("food")}
      />
    )
  }

  if (view === "food") {
    return <FoodLibraryPage onBack={() => setView("main")} />
  }

  if (view === "recipe") {
    return <RecipePage onBack={() => setView("main")} />
  }

  return (
    <div className="flex flex-col gap-4">
      {tab === "today" ? (
        <NutritionPageV2
          profile={profile}
          onProfileChange={setProfile}
          onViewDetail={() => setView("detail")}
          onOpenLibrary={() => setView("food")}
          onOpenRecipe={() => setView("recipe")}
          tab={
            <div className="flex w-full items-center gap-1 rounded-full bg-surface-1 p-1">
              {(
                [
                  { key: "today", label: "今日" },
                  { key: "stats", label: "统计" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "flex-1 rounded-full px-4 py-1.5 text-[13px] font-medium transition active:scale-95",
                    tab === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-foreground/50 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
      ) : (
        <>
          {/* 统计页也需要 tab 切回今日 */}
          <div className="flex w-full items-center gap-1 rounded-full bg-surface-1 p-1">
            {(
              [
                { key: "today", label: "今日" },
                { key: "stats", label: "统计" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 rounded-full px-4 py-1.5 text-[13px] font-medium transition active:scale-95",
                  tab === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-foreground/50 hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <NutritionStatsPage />
        </>
      )}
    </div>
  )
}
