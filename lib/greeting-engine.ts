export type GreetingLang = "en" | "desi" | "mix"
export type GreetingPeriod =
  | "earlyMorning"
  | "morning"
  | "midMorning"
  | "preLunch"
  | "lunch"
  | "postLunch"
  | "afternoon"
  | "earlyEvening"
  | "evening"
  | "lateEvening"
  | "earlyNight"
  | "midnight"
  | "lateNight"
export type UserContextKey = "firstLoginToday" | "returningAfterHours" | "veryActiveUser"
export type AppStateKey = "newAlerts" | "lowStock" | "pendingTasks" | "allClear"
export type DayContextKey = "weekday" | "monday" | "friday" | "weekend"
export type GreetingAnimationKey = "fade" | "slideUp" | "slideLeft" | "zoom" | "softPulse"
export type MotionProfile = "reduced" | "lite" | "full"

interface GreetingItem {
  id: string
  lang: GreetingLang
  text: string
}

interface LocaleMapEntry {
  region: string
  preferredLang: GreetingLang[]
}

interface GreetingAnimation {
  id: GreetingAnimationKey
  className: string
}

interface AnimationMap {
  reduced: GreetingAnimation[]
  lite: GreetingAnimation[]
  full: GreetingAnimation[]
}

export interface GreetingResolveInput {
  timezone?: string
  name?: string | null
  tone?: GreetingLang | "auto"
  userContext?: UserContextKey | null
  appState?: AppStateKey | null
  motionProfile?: MotionProfile
}

export interface GreetingResolveResult {
  id: string
  text: string
  timePeriod: GreetingPeriod
  dayCtx: DayContextKey
  animation: GreetingAnimationKey
  animationClassName: string
  motionProfile: MotionProfile
}

interface GreetingEngine {
  timeOfDay: Record<GreetingPeriod, GreetingItem[]>
  userContext: Record<UserContextKey, GreetingItem[]>
  dayContext: Record<DayContextKey, GreetingItem[]>
  appState: Record<AppStateKey, GreetingItem[]>
  localeMap: Record<string, LocaleMapEntry>
  animations: AnimationMap
  getLocalHour(timezone: string): number
  getTimePeriod(hour: number): GreetingPeriod
  getDayContext(now?: Date): DayContextKey
  getLastShown(): string[]
  saveShown(id: string): void
  isValidGreeting(text: string): boolean
  getLastShownAnimations(profile: MotionProfile): string[]
  saveShownAnimation(id: string, profile: MotionProfile): void
  pickFresh(pool: GreetingItem[]): GreetingItem
  pickFreshAnimation(pool: GreetingAnimation[], profile: MotionProfile): GreetingAnimation
  resetState(): void
  resolve(input?: GreetingResolveInput): GreetingResolveResult
}

const safeStorage = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string): void {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // ignore storage failures
    }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore storage failures
    }
  },
  keys(): string[] {
    if (typeof window === "undefined") return []
    try {
      return Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i) || "").filter(Boolean)
    } catch {
      return []
    }
  },
}

export const greetingEngine: GreetingEngine = {
  timeOfDay: {
    earlyMorning: [
      { id: "n_earlyMorning_01", lang: "en", text: "You're up early. That's a good start." },
      { id: "n_earlyMorning_02", lang: "en", text: "Quiet hour. Good time to focus." },
    ],
    morning: [
      { id: "n_morning_01", lang: "en", text: "Good morning. What are you working on today?" },
      { id: "n_morning_02", lang: "en", text: "Let's get something meaningful done." },
    ],
    midMorning: [
      { id: "n_midMorning_01", lang: "en", text: "Good morning. What are you working on today?" },
      { id: "n_midMorning_02", lang: "en", text: "Let's get something meaningful done." },
    ],
    preLunch: [
      { id: "n_preLunch_01", lang: "en", text: "Still a solid window to make progress." },
      { id: "n_preLunch_02", lang: "en", text: "Stay with it - this part matters." },
    ],
    lunch: [
      { id: "n_lunch_01", lang: "en", text: "Might be a good time to take a break." },
      { id: "n_lunch_02", lang: "en", text: "A short reset will help." },
    ],
    postLunch: [
      { id: "n_postLunch_01", lang: "en", text: "Might be a good time to take a break." },
      { id: "n_postLunch_02", lang: "en", text: "A short reset will help." },
    ],
    afternoon: [
      { id: "n_afternoon_01", lang: "en", text: "This part of the day can be tricky. Stay steady." },
      { id: "n_afternoon_02", lang: "en", text: "Keep it simple. One task at a time." },
    ],
    earlyEvening: [
      { id: "n_earlyEvening_01", lang: "en", text: "The day's winding down. What's left?" },
    ],
    evening: [
      { id: "n_evening_01", lang: "en", text: "The day's winding down. What's left?" },
    ],
    lateEvening: [
      { id: "n_lateEvening_01", lang: "en", text: "How did today go?" },
    ],
    earlyNight: [
      { id: "n_earlyNight_01", lang: "en", text: "How did today go?" },
    ],
    midnight: [
      { id: "n_midnight_01", lang: "en", text: "You're still up. Try not to stretch this too far." },
    ],
    lateNight: [
      { id: "n_lateNight_01", lang: "en", text: "You're still up. Try not to stretch this too far." },
    ],
  },
  userContext: {
    firstLoginToday: [],
    returningAfterHours: [],
    veryActiveUser: [],
  },
  dayContext: {
    weekday: [],
    monday: [],
    friday: [],
    weekend: [],
  },
  appState: {
    newAlerts: [],
    lowStock: [],
    pendingTasks: [],
    allClear: [],
  },
  localeMap: {
    "Asia/Kolkata": { region: "IN", preferredLang: ["desi", "mix"] },
    "Asia/Karachi": { region: "PK", preferredLang: ["desi", "mix"] },
    "Asia/Dhaka": { region: "BD", preferredLang: ["desi", "mix"] },
    "America/New_York": { region: "US", preferredLang: ["en"] },
    "America/Chicago": { region: "US", preferredLang: ["en"] },
    "America/Los_Angeles": { region: "US", preferredLang: ["en"] },
    "Europe/London": { region: "UK", preferredLang: ["en"] },
    neutral: { region: "neutral", preferredLang: ["en", "mix"] },
  },
  animations: {
    reduced: [{ id: "fade", className: "greet-anim-none" }],
    lite: [
      { id: "fade", className: "greet-anim-fade-lite" },
      { id: "slideUp", className: "greet-anim-slide-up-lite" },
    ],
    full: [
      { id: "fade", className: "greet-anim-fade" },
      { id: "slideUp", className: "greet-anim-slide-up" },
      { id: "slideLeft", className: "greet-anim-slide-left" },
      { id: "zoom", className: "greet-anim-zoom" },
      { id: "softPulse", className: "greet-anim-soft-pulse" },
    ],
  },
  getLocalHour(timezone: string): number {
    try {
      const localTime = new Date().toLocaleString("en-US", { timeZone: timezone })
      return new Date(localTime).getHours()
    } catch {
      return new Date().getHours()
    }
  },
  getTimePeriod(hour: number): GreetingPeriod {
    if (hour >= 5 && hour < 7) return "earlyMorning"
    if (hour >= 7 && hour < 9) return "morning"
    if (hour >= 9 && hour < 11) return "midMorning"
    if (hour >= 11 && hour < 12) return "preLunch"
    if (hour >= 12 && hour < 13) return "lunch"
    if (hour >= 13 && hour < 15) return "postLunch"
    if (hour >= 15 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 18) return "earlyEvening"
    if (hour >= 18 && hour < 20) return "evening"
    if (hour >= 20 && hour < 22) return "lateEvening"
    if (hour >= 22 && hour < 24) return "earlyNight"
    if (hour >= 0 && hour < 2) return "midnight"
    return "lateNight"
  },
  getDayContext(now: Date = new Date()): DayContextKey {
    const day = now.getDay()
    if (day === 0 || day === 6) return "weekend"
    if (day === 1) return "monday"
    if (day === 5) return "friday"
    return "weekday"
  },
  getLastShown(): string[] {
    const raw = safeStorage.get("greetingHistory")
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []
    } catch {
      return []
    }
  },
  saveShown(id: string): void {
    const history = this.getLastShown()
    history.unshift(id)
    safeStorage.set("greetingHistory", JSON.stringify(history.slice(0, 5)))
  },
  isValidGreeting(text: string): boolean {
    const clean = text.trim()
    if (clean.length < 10 || clean.length > 140) return false
    if (!/^[A-Z]/.test(clean)) return false
    if (/[!?]{2,}/.test(clean)) return false
    if (!/[a-zA-Z]/.test(clean)) return false
    if (clean.split(" ").length < 3) return false
    return true
  },
  getLastShownAnimations(profile: MotionProfile): string[] {
    const raw = safeStorage.get(`greetingAnimationHistory:${profile}`)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []
    } catch {
      return []
    }
  },
  saveShownAnimation(id: string, profile: MotionProfile): void {
    const history = this.getLastShownAnimations(profile)
    history.unshift(id)
    safeStorage.set(`greetingAnimationHistory:${profile}`, JSON.stringify(history.slice(0, 5)))
  },
  pickFresh(pool: GreetingItem[]): GreetingItem {
    const history = this.getLastShown()
    const fresh = pool.filter((g) => !history.includes(g.id))
    const source = fresh.length > 0 ? fresh : pool
    return source[Math.floor(Math.random() * source.length)]
  },
  pickFreshAnimation(pool: GreetingAnimation[], profile: MotionProfile): GreetingAnimation {
    const history = this.getLastShownAnimations(profile)
    const fresh = pool.filter((g) => !history.includes(g.id))
    const source = fresh.length > 0 ? fresh : pool
    return source[Math.floor(Math.random() * source.length)]
  },
  resetState(): void {
    safeStorage.remove("greetingHistory")
    for (const profile of ["reduced", "lite", "full"] as MotionProfile[]) {
      safeStorage.remove(`greetingAnimationHistory:${profile}`)
    }
    const keys = safeStorage.keys()
    for (const key of keys) {
      if (key.startsWith("kh:greeting:")) {
        safeStorage.remove(key)
      }
    }
  },
  resolve({
    timezone = "Asia/Kolkata",
    name = null,
    tone = "auto",
    userContext = "firstLoginToday",
    appState = null,
    motionProfile = "full",
  }: GreetingResolveInput = {}): GreetingResolveResult {
    const hour = this.getLocalHour(timezone)
    const timePeriod = this.getTimePeriod(hour)
    const dayCtx = this.getDayContext()

    let pool: GreetingItem[] = []
    if (appState && this.appState[appState]?.length > 0) {
      pool = this.appState[appState]
    } else if (userContext && this.userContext[userContext]?.length > 0) {
      pool = this.userContext[userContext]
    } else if (this.dayContext[dayCtx]?.length > 0) {
      pool = this.dayContext[dayCtx]
    } else {
      pool = this.timeOfDay[timePeriod]
    }

    const locale = this.localeMap[timezone] || this.localeMap.neutral
    const resolvedTone: GreetingLang = tone === "auto" ? locale.preferredLang[0] || "mix" : tone

    const toneFiltered = pool.filter((g) => g.lang === resolvedTone || resolvedTone === "mix")
    const finalPool = toneFiltered.length > 0 ? toneFiltered : pool
    const qualityPool = finalPool.filter((g) => this.isValidGreeting(g.text))
    const safePool = qualityPool.length > 0 ? qualityPool : finalPool

    const fallbackGreeting: GreetingItem = {
      id: "fallback_en_01",
      lang: "en",
      text: "Welcome back.",
    }
    const greeting = safePool.length > 0 ? this.pickFresh(safePool) : fallbackGreeting
    this.saveShown(greeting.id)

    const animationPool = this.animations[motionProfile] || this.animations.full
    const animation = this.pickFreshAnimation(animationPool, motionProfile)
    this.saveShownAnimation(animation.id, motionProfile)

    const text = name
      ? greeting.text.replaceAll("{name}", name)
      : greeting.text.replace(", {name}", "").replace(" {name}", "").replace("{name} ", "")

    return {
      id: greeting.id,
      text,
      timePeriod,
      dayCtx,
      animation: animation.id,
      animationClassName: animation.className,
      motionProfile,
    }
  },
}

export function resolveGreeting(input?: GreetingResolveInput): GreetingResolveResult {
  return greetingEngine.resolve(input)
}

export function resetGreetingEngine(): void {
  greetingEngine.resetState()
}
