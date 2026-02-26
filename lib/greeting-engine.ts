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
      { id: "emr_mx_01", lang: "mix", text: "5am club? Either very dedicated or never slept. Respect either way. 🌅" },
      { id: "emr_de_01", lang: "desi", text: "Itni subah? Bhai sun, even the sun is still stretching." },
      { id: "emr_en_01", lang: "en", text: "Up before the birds. That's a different breed of hustler. 🔥" },
      { id: "emr_mx_02", lang: "mix", text: "5am mein kaam? Your future self is already proud." },
      { id: "emr_en_02", lang: "en", text: "World's still asleep and you're already here. Scary good. 🌄" },
    ],
    morning: [
      { id: "mor_mx_01", lang: "mix", text: "Uth gaye? Bold move. Most people hit snooze 4 times. ☕" },
      { id: "mor_de_01", lang: "desi", text: "Subah subah aa gaye — chai pee li ya seedha kaam pe lag gaye?" },
      { id: "mor_en_01", lang: "en", text: "8am and already here? The day doesn't stand a chance." },
      { id: "mor_en_02", lang: "en", text: "Morning hustle unlocked. Let's see what today's made of. 🚀" },
      { id: "mor_mx_02", lang: "mix", text: "Fresh morning, fresh tasks. One chai and we're ready. ☕" },
    ],
    midMorning: [
      { id: "mdm_en_01", lang: "en", text: "Peak productivity hours — don't waste them on scrolling. 👀" },
      { id: "mdm_en_02", lang: "en", text: "10am: the sweet spot between fresh and focused. Let's go." },
      { id: "mdm_mx_01", lang: "mix", text: "Subah ho gayi bhai, to-do list is already judging you. 😅" },
      { id: "mdm_en_03", lang: "en", text: "Morning meeting survived? Great. Now the real work begins." },
      { id: "mdm_mx_02", lang: "mix", text: "Brain is warm, chai is ready, excuses are not allowed. 🔥" },
    ],
    preLunch: [
      { id: "prl_en_01", lang: "en", text: "Almost lunch but not yet — this hour is pure gold. Use it." },
      { id: "prl_en_02", lang: "en", text: "11am: too late to start slow, too early to think about food. Focus. 😄" },
      { id: "prl_en_03", lang: "en", text: "The last stretch before lunch break. Make it count. 💪" },
      { id: "prl_mx_01", lang: "mix", text: "Ek ghante mein lunch — abhi wala time serious hai. 👀" },
      { id: "prl_en_04", lang: "en", text: "Pre-lunch productivity hits different. You've got this." },
    ],
    lunch: [
      { id: "lun_en_01", lang: "en", text: "Lunch time! Eat well, come back stronger. 🍛" },
      { id: "lun_de_01", lang: "desi", text: "Khaana khao, 5 minute rest karo, phir wapas aa jao. Deal?" },
      { id: "lun_en_02", lang: "en", text: "Lunch break is sacred. We'll be here when you're back. 😌" },
      { id: "lun_mx_01", lang: "mix", text: "Dopahar ka khana ho gaya? Now refuel and reload. 💪" },
      { id: "lun_en_03", lang: "en", text: "Food first, tasks second. That's just science. 🍽️" },
    ],
    postLunch: [
      { id: "psl_mx_01", lang: "mix", text: "Post-lunch nap toh nahi le liya? 😏" },
      { id: "psl_en_01", lang: "en", text: "The post-lunch slump is real — don't let it win today." },
      { id: "psl_de_01", lang: "desi", text: "Khana ho gaya, ab wapas kaam pe. No excuses. 💪" },
      { id: "psl_en_02", lang: "en", text: "2pm energy check: still alive? Good. Tasks are waiting." },
      { id: "psl_mx_02", lang: "mix", text: "Food coma ya focus — you decide. Choose wisely. 😄" },
    ],
    afternoon: [
      { id: "aft_en_01", lang: "en", text: "3pm slump aa gaya hai — don't let it win." },
      { id: "aft_mx_01", lang: "mix", text: "Chai break #3 of the day? No judgement here. ☕" },
      { id: "aft_en_02", lang: "en", text: "Afternoon check-in: you're doing better than you think." },
      { id: "aft_de_01", lang: "desi", text: "Aadha din gaya, aadha bacha hai — make it count." },
      { id: "aft_en_03", lang: "en", text: "4pm: too early to wind down, too late to start something big. Perfect for clearing the backlog." },
    ],
    earlyEvening: [
      { id: "eev_en_01", lang: "en", text: "5pm — officially acceptable to think about wrapping up. Not yet though. 😏" },
      { id: "eev_en_02", lang: "en", text: "Golden hour for finishing what the morning promised." },
      { id: "eev_de_01", lang: "desi", text: "Sham shuru ho gayi. One final push and the day is yours." },
      { id: "eev_en_03", lang: "en", text: "5 o'clock and still at it? You're doing more than most. 💪" },
      { id: "eev_en_04", lang: "en", text: "Almost there. Don't stop now when the finish line is right here." },
    ],
    evening: [
      { id: "eve_de_01", lang: "desi", text: "Sham ho gayi! You survived another day. 🎉" },
      { id: "eve_mx_01", lang: "mix", text: "Sham ki chai aur pending tasks — name a more iconic duo. ☕" },
      { id: "eve_de_02", lang: "desi", text: "Din bhar ka kaam — ab thoda relax bhi banta hai." },
      { id: "eve_mx_02", lang: "mix", text: "Evening check-in: how many tasks did you actually finish? Be honest. 😅" },
      { id: "eve_en_01", lang: "en", text: "7pm and still here? That's commitment. Wrap up strong. 🔥" },
    ],
    lateEvening: [
      { id: "lev_mx_01", lang: "mix", text: "Dinner ho gaya? Good. One last look before you close for the night." },
      { id: "lev_en_01", lang: "en", text: "9pm — wrapping up or just getting started? Either way, we're here." },
      { id: "lev_de_01", lang: "desi", text: "Raat shuru ho rahi hai. Aaj ka hisaab kitaab karte hain. 📋" },
      { id: "lev_en_02", lang: "en", text: "The day's almost done. Quick review and then rest. You've earned it." },
      { id: "lev_en_03", lang: "en", text: "Last call for tasks before tonight's shutdown. 🌙" },
    ],
    earlyNight: [
      { id: "ent_en_01", lang: "en", text: "10pm club — not early, not too late. Just dedicated. 🌙" },
      { id: "ent_de_01", lang: "desi", text: "Raat ke das baj gaye. Thoda aur ya wrap up?" },
      { id: "ent_en_02", lang: "en", text: "Night shift mode on. The focused ones do their best work now." },
      { id: "ent_de_02", lang: "desi", text: "11pm and still at it? Main toh impress ho gaya. 👏" },
      { id: "ent_en_03", lang: "en", text: "Late night, clear mind. Let's finish what we started." },
    ],
    midnight: [
      { id: "mid_mx_01", lang: "mix", text: "Aadhi raat ko? You're either very behind or very ahead. Respect. 🌙" },
      { id: "mid_en_01", lang: "en", text: "Midnight grind is a whole different energy. Use it wisely." },
      { id: "mid_en_02", lang: "en", text: "12am — technically a new day. Fresh start right now if you want." },
      { id: "mid_en_03", lang: "en", text: "The world is fully asleep. The work is fully yours. 🌙" },
      { id: "mid_mx_02", lang: "mix", text: "Midnight oil burning bright. Don't forget to rest after. 💪" },
    ],
    lateNight: [
      { id: "lnt_de_01", lang: "desi", text: "Bhai so jao. Seriously. The tasks will be here tomorrow. 😅" },
      { id: "lnt_mx_01", lang: "mix", text: "3am? Either a legend or a deadline. Either way, let's finish fast." },
      { id: "lnt_en_01", lang: "en", text: "Itni raat ko kaam? Your dedication is either inspiring or concerning. Both. 🌙" },
      { id: "lnt_mx_02", lang: "mix", text: "Almost morning. Might as well call it an early start. 😄" },
      { id: "lnt_en_02", lang: "en", text: "Last lap of the night. Close it out and get some rest. You've earned it. 🌅" },
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
