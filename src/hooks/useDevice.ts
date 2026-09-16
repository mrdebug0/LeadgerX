import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  width: number;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceType: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const ua = navigator.userAgent.toLowerCase();
      
      const isMobileUA = /mobile|android|iphone|ipod|phone/i.test(ua);
      const isTabletUA = /ipad|tablet|playbook|silk/i.test(ua);
      
      let type: DeviceType = 'desktop';
      if (width < 768) {
        type = 'mobile';
      } else if (width >= 768 && width < 1024) {
        type = 'tablet';
      } else if (isMobileUA && !isTabletUA) {
        type = 'mobile';
      } else if (isTabletUA) {
        type = 'tablet';
      }

      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceInfo({
        deviceType: type,
        isMobile: type === 'mobile',
        isTablet: type === 'tablet',
        isDesktop: type === 'desktop',
        isTouch,
        width,
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}
