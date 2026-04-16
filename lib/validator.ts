import z from 'zod'

function username() {
  return z
    .string()
    .min(3, '用户名至少需要 3 个字符。')
    .max(20, '用户名不能超过 20 个字符。')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线。')
    .trim()
}

function email() {
  return z.email('请输入有效的电子邮件地址。')
}

function password() {
  return z.string().min(8, '密码至少需要 8 个字符。').max(100, '密码太长了') // 防止长字符串攻击（导致哈希计算过慢）
  // .regex(/[A-Z]/, '必须包含至少一个大写字母')
  // .regex(/[0-9]/, '必须包含至少一个数字')
  // .regex(/[^A-Za-z0-9]/, '必须包含至少一个特殊字符'),
}

const zUtils = {
  username,
  email,
  password,
}

export default zUtils
