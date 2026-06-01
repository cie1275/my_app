// app/api/auth/cognito/route.ts
import { NextRequest, NextResponse } from 'next/server'
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
  const text = await res.text()
  if (text.startsWith('<')) throw new Error('Cognitoへの接続に失敗しました')
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.message ?? action + 'に失敗しました')
  return data
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'signUp': {
        const { email, password } = params
        const username = email.split('@')[0] + '_' + Math.random().toString(36).slice(2, 8)
        await cognitoRequest('SignUp', {
          ClientId: CLIENT_ID,
          SecretHash: getSecretHash(username),
          Username: username,
          Password: password,
          UserAttributes: [{ Name: 'email', Value: email }],
        })
        return NextResponse.json({ success: true, username })
      }

      case 'confirmSignUp': {
        const { username, code } = params
        await cognitoRequest('ConfirmSignUp', {
          ClientId: CLIENT_ID,
          SecretHash: getSecretHash(username),
          Username: username,
          ConfirmationCode: code,
        })
        return NextResponse.json({ success: true })
      }

      case 'signIn': {
        const { email, password } = params
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
        return NextResponse.json({ success: true, idToken })
      }

      default:
        return NextResponse.json({ error: '不明なアクション' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}