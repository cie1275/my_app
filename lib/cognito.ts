// lib/cognito.ts
import crypto from 'crypto'

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
const CLIENT_SECRET = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!
const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION!

const getSecretHash = (username: string) => {
  return crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest('base64')
}

const cognitoRequest = async (action: string, body: object) => {
  const res = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? action + 'に失敗しました')
  return data
}

// サインアップ
export const signUp = async (email: string, password: string) => {
  const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 8)
  await cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    SecretHash: getSecretHash(username),
    Username: username,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  })
  localStorage.setItem('cognito_username', username)
}

// メール確認
export const confirmSignUp = async (email: string, code: string) => {
  const username = localStorage.getItem('cognito_username') ?? email
  await cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    SecretHash: getSecretHash(username),
    Username: username,
    ConfirmationCode: code,
  })
}

// ログイン
export const signIn = async (email: string, password: string): Promise<void> => {
  const data = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
      SECRET_HASH: getSecretHash(email),
    },
  })
  const idToken = data.AuthenticationResult?.IdToken
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

// 現在のユーザー取得
export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('cognito_id_token')
}

// セッション確認
export const getSession = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('cognito_id_token')
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