import { Loader2, type LucideProps, Chrome } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  google: Chrome,
}

export type Icon = keyof typeof Icons