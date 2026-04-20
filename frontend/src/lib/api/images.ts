import { client } from './client'

export const uploadImage = async (cardId: number, file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<{ url: string }>(`/cards/${cardId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}
