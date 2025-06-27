//src/api/auth.ts
export async function login(id: string, password: string) {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id, password })
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || '로그인 실패')
  }

  return res.json()
}
