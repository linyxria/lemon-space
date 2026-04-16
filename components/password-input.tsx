'use client'

import { EyeIcon, EyeOffIcon } from 'lucide-react'
import {
  type DetailedHTMLProps,
  type InputHTMLAttributes,
  useState,
} from 'react'

import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'

export function PasswordInput(
  props: Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'type'
  >,
) {
  const [show, setShow] = useState(false)

  return (
    <InputGroup>
      <InputGroupInput {...props} type={show ? 'text' : 'password'} />
      <InputGroupAddon
        align="inline-end"
        className="cursor-pointer"
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </InputGroupAddon>
    </InputGroup>
  )
}
