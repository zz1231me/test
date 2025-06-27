import axios from './axios';

type PostPayload = {
  title: string;
  content: string;
  boardType: string;
  file?: File | null;
};

// ✅ 게시글 목록 조회
export async function fetchPostsByType(boardType: string) {
  const res = await axios.get(`/posts/${boardType}`);
  console.log('📄 게시글 목록 조회 성공:', res.data);
  return res.data;
}

// ✅ 게시글 단건 조회
export async function fetchPostById(postId: string) {
  const res = await axios.get(`/posts/detail/${postId}`);
  console.log('📄 게시글 단건 조회 성공:', res.data);
  return res.data;
}

// ✅ 게시글 생성 (FormData로 전송)
export async function createPost({ title, content, boardType, file }: PostPayload) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('boardType', boardType);
  if (file) formData.append('file', file);

  const res = await axios.post(`/posts/${boardType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log('📝 게시글 생성 성공:', res.data);
  return res.data;
}

// ✅ 게시글 수정 (FormData로 전송)
export async function updatePost(postId: string, { title, content, boardType, file }: PostPayload) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('boardType', boardType);
  if (file) formData.append('file', file);

  const res = await axios.put(`/posts/${boardType}/${postId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  console.log('🛠 게시글 수정 성공:', res.data);
  return res.data;
}

// ✅ 게시글 삭제
export async function deletePost(postId: string) {
  const res = await axios.delete(`/posts/${postId}`);
  console.log('🗑 게시글 삭제 성공:', res.data);
  return res.data;
}
