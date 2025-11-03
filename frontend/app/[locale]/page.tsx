import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-4">{t('title')}</h1>
        <p className="text-xl text-center mb-2">{t('subtitle')}</p>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {t('description')}
        </p>

        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="/"
            locale="en"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            English
          </Link>
          <Link
            href="/"
            locale="zh"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            中文
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>🚧 Under Development - Phase 1: Infrastructure Setup</p>
        </div>
      </div>
    </main>
  )
}
