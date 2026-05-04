import { X } from "lucide-react"
import {
  type HTMLInputTypeAttribute,
  type KeyboardEventHandler,
  useState,
} from "react"

import { Badge } from "./ui/badge"
import { Input } from "./ui/input"

export default function TagInput({
  value,
  onChange,
  type,
  id,
  placeholder,
}: {
  value?: string[]
  onChange?: (value: string[]) => void
  type?: HTMLInputTypeAttribute
  id?: string
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()

      const tag = inputValue.trim()

      if (!tag || !onChange) return

      if (value && !value.includes(tag)) {
        onChange([...value, tag])
      } else if (!value) {
        onChange([tag])
      }

      setInputValue("")
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      value &&
      value.length &&
      onChange
    ) {
      // 输入框空且按下 Backspace 时，删除最后一个标签
      onChange(value.slice(0, -1))
    }
  }

  const handmeRemove = (tag: string) => {
    if (!value || !onChange) return
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="border-input focus-within:ring-ring/50 focus-within:border-ring flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-solid px-2.5 py-1 focus-within:ring-3">
      {value?.map((tag) => (
        <Badge key={tag} className="flex max-w-full">
          <span className="flex-1 truncate">{tag}</span>
          <button onClick={() => handmeRemove(tag)}>
            <X size={12} />
          </button>
        </Badge>
      ))}
      <Input
        className="h-auto min-w-30 flex-1 border-none p-0 pl-1.5 focus-visible:ring-0"
        type={type}
        id={id}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
