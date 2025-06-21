export async function createPost({
  title,
  content,
  boardType
}: {
  title: string
  content: string
  boardType: string
}) {
  const token = localStorage.getItem('token')

  const res = await fetch('http://localhost:4000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title, content, boardType })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '글 등록 실패')
  }

  return res.json()
}
