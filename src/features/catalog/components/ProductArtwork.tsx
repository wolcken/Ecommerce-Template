import type { ProductIllustration } from '../catalog.types'

export function ProductArtwork({ kind }: { kind: ProductIllustration }) {
  return (
    <svg viewBox="0 0 320 280" className="product-artwork" fill="none" aria-hidden="true">
      <ellipse cx="160" cy="244" rx="78" ry="10" fill="#233d31" opacity=".09" />
      {kind === 'headphones' && <g stroke="#314b40" strokeLinecap="round">
        <path d="M83 166v-44a77 77 0 0 1 154 0v44" strokeWidth="21" />
        <path d="M88 120a72 72 0 0 1 144 0" stroke="#799182" strokeWidth="7" />
        <rect x="66" y="135" width="45" height="86" rx="21" fill="#405f50" strokeWidth="3" />
        <rect x="209" y="135" width="45" height="86" rx="21" fill="#405f50" strokeWidth="3" />
        <path d="M99 153v49M221 153v49" stroke="#a3b0a0" strokeWidth="5" />
      </g>}
      {kind === 'lamp' && <g>
        <path d="M160 123v108" stroke="#a56a42" strokeWidth="13" />
        <ellipse cx="160" cy="231" rx="57" ry="9" fill="#985f3a" />
        <path d="M79 139c0-57 36-96 81-96s81 39 81 96H79Z" fill="#bd8359" />
        <ellipse cx="160" cy="139" rx="81" ry="12" fill="#e8bb87" />
        <path d="M109 107c9-29 24-44 43-49" stroke="#dba477" strokeWidth="5" strokeLinecap="round" />
      </g>}
      {kind === 'bag' && <g>
        <path d="M123 109V83a37 37 0 0 1 74 0v26" stroke="#6e775e" strokeWidth="12" />
        <path d="m90 101-16 124q86 21 172 0l-16-124Z" fill="#899578" />
        <path d="m101 109-12 105q71 16 142 0l-12-105" stroke="#aeb89c" strokeWidth="3" />
        <path d="M123 103v24m74-24v24" stroke="#536049" strokeWidth="8" strokeLinecap="round" />
        <rect x="144" y="163" width="32" height="19" rx="3" fill="#d9dcc8" />
      </g>}
    </svg>
  )
}
