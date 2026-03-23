import { Capacitor } from '@capacitor/core'

export const isNativePlatform = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform()

export function getLoginPath() {
  return isNativePlatform ? '/#/auth/login' : '/auth/login'
}
