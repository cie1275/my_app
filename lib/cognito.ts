// lib/cognito.ts

const cognitoApi = async (action: string, params: object) => {
  const res = await fetch('/api/auth/cognito', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
  return data
}

// サインアップ
export const signUp = async (email: string, password: string) => {
  const data = await cognitoApi('signUp', { email, password })
  localStorage.setItem('cognito_username', data.username)
}

// メール確認
export const confirmSignUp = async (email: string, code: string) => {
  const username = localStorage.getItem('cognito_username') ?? email
  await cognitoApi('confirmSignUp', { username, code })
}

// ログイン
export const signIn = async (email: string, password: string): Promise<void> => {
  const data = await cognitoApi('signIn', { email, password })
  const idToken = data.idToken
  if (idToken) {
    document.cookie = `CognitoIdentityServiceProvider.idToken=${idToken}; path=/`
    localStorage.setItem('cognito_id_token', idToken)
  }
}

// ログアウト
export const signOut = () => {
  document.cookie = 'CognitoIdentityServiceProvider.idToken=; path=/; max-age=0'
  localStorage.removeItem('cognito_id_token')
  localStorage.removeItem('cognito_username')
}

// ユーザーID取得（JWTのsubクレーム）
export const getUserId = (): string | null => {
  const token = localStorage.getItem('cognito_id_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

// セッション確認
export const getSession = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('cognito_id_token')
}