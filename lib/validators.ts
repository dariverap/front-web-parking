// Shared frontend validators and sanitizers
// Usage: import { lettersOnly, digitsOnly, decimal2, isValidName, isValidPhone } from "@/lib/validators"

export const lettersOnly = (v: string) => v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "")
export const digitsOnly = (v: string) => v.replace(/[^0-9]/g, "")
export const decimal2 = (v: string) => {
  let s = v.replace(/[^0-9.]/g, "")
  const parts = s.split(".")
  if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("")
  const [intp, decp = ""] = s.split(".")
  return decp ? `${intp}.${decp.slice(0, 2)}` : intp
}
export const isNumber = (v: string) => v !== "" && !Number.isNaN(Number(v))
export const inRange = (n: number, min: number, max: number) => n >= min && n <= max

export const isValidName = (name: string) => name.trim().length >= 2 && /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name)
export const isValidPhone = (phone: string) => /^\d{6,15}$/.test(phone) // 6-15 digits
export const isValidEmail = (email: string) => /.+@.+\..+/.test(email)
