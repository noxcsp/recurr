"use client"

import { useHomeData } from "@/contexts/home-data-context"
import { SubscriptionList } from "@/components/subscription-list"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SUBSCRIPTION_CATEGORIES } from "@/lib/constants/categories"
import { useEffect, useState, useMemo } from "react"

const CATEGORY_OPTIONS = ["All", ...SUBSCRIPTION_CATEGORIES]

export function SubscriptionsTab() {
  const { subscriptions } = useHomeData()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesCategory =
        selectedCategoryFilter === "All" || sub.category === selectedCategoryFilter

      const query = debouncedSearchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        sub.service_name.toLowerCase().includes(query) ||
        sub.category.toLowerCase().includes(query) ||
        sub.payment_mode.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [subscriptions, selectedCategoryFilter, debouncedSearchQuery])

  const hasActiveFilter =
    selectedCategoryFilter !== "All" || searchQuery.trim().length > 0

  const subtitle = useMemo(() => {
    if (subscriptions.length === 0) {
      return "No active subscriptions"
    }
    if (hasActiveFilter) {
      return `Showing ${filteredSubscriptions.length} of ${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`
    }
    return `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`
  }, [subscriptions.length, filteredSubscriptions.length, hasActiveFilter])

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategoryFilter("All")
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-heading font-semibold leading-tight md:text-2xl lg:text-3xl">
          My Subscriptions
        </h1>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col justify-between px-4 space-y-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search services or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Clear search query"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = selectedCategoryFilter === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategoryFilter(
                    cat === selectedCategoryFilter && cat !== "All" ? "All" : cat
                  )
                }
                className={`shrink-0 px-2.5 py-1 text-[11px] font-medium border rounded-none transition-colors ${active
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                  }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 pt-2">
        <p className="text-xs font-normal leading-normal text-muted-foreground md:text-xs lg:text-sm">
          {subtitle}
        </p>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <SubscriptionList
          subscriptions={filteredSubscriptions}
          emptyMessage={
            hasActiveFilter
              ? "No subscriptions match your search or filter criteria."
              : "No subscriptions yet. Add one to get started."
          }
        />

        {hasActiveFilter && filteredSubscriptions.length === 0 && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="rounded-none text-xs"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

