import React from 'react'

function Unauthorized() {
  return (
    <div className="p-6 text-red-600 font-bold">
      ⛔ 접근 권한이 없습니다. 관리자에게 문의하세요.
    </div>
  )
}

export default Unauthorized
