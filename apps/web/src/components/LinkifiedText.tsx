import { Fragment, type ReactNode } from 'react'

interface Props {
  text: string
  className?: string
  linkClassName?: string
}

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+)/gi
const TRAILING_URL_PUNCTUATION = /[),.!?;:]/u

const normalizeHref = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return `https://${url}`
}

const splitTrailingPunctuation = (url: string) => {
  let cleanUrl = url
  let trailingText = ''

  while (cleanUrl.length > 0) {
    const trailingCharacter = cleanUrl.charAt(cleanUrl.length - 1)

    if (!TRAILING_URL_PUNCTUATION.test(trailingCharacter)) {
      break
    }

    trailingText = `${trailingCharacter}${trailingText}`
    cleanUrl = cleanUrl.slice(0, -1)
  }

  return {
    cleanUrl,
    trailingText,
  }
}

export default function LinkifiedText({
  text,
  className = '',
  linkClassName = 'font-medium text-orange-700 underline underline-offset-4 transition hover:text-orange-800 break-all',
}: Props) {
  const content: ReactNode[] = []
  let lastIndex = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const matchedText = match[0]
    const matchIndex = match.index ?? 0

    if (matchIndex > lastIndex) {
      content.push(
        <Fragment key={`text-${matchIndex}`}>
          {text.slice(lastIndex, matchIndex)}
        </Fragment>
      )
    }

    const { cleanUrl, trailingText } = splitTrailingPunctuation(matchedText)

    if (cleanUrl) {
      content.push(
        <a
          key={`link-${matchIndex}`}
          href={normalizeHref(cleanUrl)}
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          {cleanUrl}
        </a>
      )
    }

    if (trailingText) {
      content.push(
        <Fragment key={`trailing-${matchIndex}`}>
          {trailingText}
        </Fragment>
      )
    }

    lastIndex = matchIndex + matchedText.length
  }

  if (lastIndex < text.length) {
    content.push(
      <Fragment key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </Fragment>
    )
  }

  return (
    <div className={`min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`.trim()}>
      {content.length > 0 ? content : text}
    </div>
  )
}
