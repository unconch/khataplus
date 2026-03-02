"use client"

import { DesktopDevice } from "./DesktopDevice"
import { MobileDevice } from "./MobileDevice"
import { TabletDevice } from "./TabletDevice"
import { useHeroAnimation } from "./useHeroAnimation"

export function DeviceCluster() {
  const { ref, desktop, tablet, mobile, controls } = useHeroAnimation()

  return (
    <div ref={ref} className="relative flex items-center justify-center min-h-[420px] lg:min-h-[460px]">
      <div className="lg:hidden transform-gpu" style={{ willChange: "transform" }}>
        <MobileDevice metrics={mobile} controls={controls.mobile} />
      </div>

      <div className="hidden lg:block relative z-30 scale-100 transform-gpu" style={{ willChange: "transform" }}>
        <DesktopDevice
          metrics={desktop}
          controls={{ frame: controls.desktop, sale: controls.sale, sync: controls.sync }}
        />
      </div>

      <div className="hidden lg:block absolute right-[-60px] scale-[0.85] z-20 transform-gpu" style={{ willChange: "transform" }}>
        <TabletDevice metrics={tablet} controls={controls.tablet} />
      </div>

      <div className="hidden lg:block absolute left-[-80px] scale-[0.75] z-10 transform-gpu" style={{ willChange: "transform" }}>
        <MobileDevice metrics={mobile} controls={controls.mobile} />
      </div>
    </div>
  )
}
