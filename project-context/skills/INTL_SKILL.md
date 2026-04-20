# SKILL: next-intl — Internationalization
> Source: https://next-intl.dev/docs
> Package: `next-intl`

---

## PROJECT-SPECIFIC RULES

- **English is active**; Danish (`da`) is stubbed — add keys to both `messages/en.json` AND `messages/da.json` (da value = `""`). Never skip da.json.
- Locales: `['en', 'da']`, defaultLocale: `'en'`.
- Use **prefix-based routing** (`/en/...`, `/da/...`). All routes live under `app/[locale]/`.
- Use `getTranslations` (async) in Server Components; `useTranslations` (sync) in Client Components.
- Format all currency via `formatDKK()` from `lib/utils/currency.ts` — do NOT use next-intl's number formatting for money.
- Use next-intl's date/time formatting for display dates (Danish locale formats dd.mm.yyyy).
- NEVER hardcode Danish/English strings in components — always use translation keys.

---

## SETUP

```bash
npm install next-intl
```

---

## FILE STRUCTURE

```
app/
  [locale]/
    layout.tsx          ← locale layout with NextIntlClientProvider
    (auth)/
      layout.tsx
      sign-in/page.tsx
    (dashboard)/
      layout.tsx
      overview/page.tsx
i18n/
  routing.ts            ← defineRouting
  request.ts            ← getRequestConfig
  navigation.ts         ← createNavigation wrappers
messages/
  en.json               ← active translations
  da.json               ← stubbed (all values "")
middleware.ts           ← next-intl middleware integrated with Clerk
```

---

## ROUTING CONFIGURATION

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'da'],
  defaultLocale: 'en',
})
```

```typescript
// i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
```

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

---

## MIDDLEWARE (combined with Clerk)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const isPublicRoute = createRouteMatcher([
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Run intl middleware first
  const intlResponse = intlMiddleware(request)
  if (intlResponse) return intlResponse

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/'],
}
```

---

## ROOT LAYOUT WITH LOCALE

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Required for static rendering
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

---

## SERVER COMPONENT USAGE

```tsx
// app/[locale]/(dashboard)/jobs/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function JobsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)  // required for static rendering

  const t = await getTranslations('Jobs')

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Jobs' })
  return { title: t('pageTitle') }
}
```

---

## CLIENT COMPONENT USAGE

```tsx
// components/forms/job-form.tsx
'use client'
import { useTranslations } from 'next-intl'

export function JobForm() {
  const t = useTranslations('JobForm')

  return (
    <form>
      <label>{t('titleLabel')}</label>
      <input placeholder={t('titlePlaceholder')} />
      <button type="submit">{t('submitButton')}</button>
    </form>
  )
}
```

---

## DATE FORMATTING (Danish locale)

```tsx
// In Server Components
import { getFormatter } from 'next-intl/server'

const format = await getFormatter()

// Danish date format: dd.mm.yyyy
format.dateTime(new Date(), {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
// → "15.04.2026" (da) / "04/15/2026" (en)
```

```tsx
// In Client Components
import { useFormatter } from 'next-intl'

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter()
  return <span>{format.dateTime(date, { dateStyle: 'short' })}</span>
}
```

---

## MESSAGE FILE PATTERN

```json
// messages/en.json
{
  "Jobs": {
    "title": "Jobs",
    "pageTitle": "Jobs | Håndværk Pro",
    "description": "Manage your jobs",
    "empty": "No jobs yet. Create your first job.",
    "createButton": "New job"
  },
  "JobForm": {
    "titleLabel": "Job title",
    "titlePlaceholder": "e.g. Bathroom renovation",
    "submitButton": "Create job"
  }
}
```

```json
// messages/da.json  — values always "" until translated
{
  "Jobs": {
    "title": "",
    "pageTitle": "",
    "description": "",
    "empty": "",
    "createButton": ""
  },
  "JobForm": {
    "titleLabel": "",
    "titlePlaceholder": "",
    "submitButton": ""
  }
}
```

---

## NAVIGATION (locale-aware)

```tsx
// Use i18n/navigation.ts wrappers, NOT next/navigation
import { Link, redirect, useRouter } from '@/i18n/navigation'

// In Server Actions — locale-aware redirect
redirect('/dashboard')  // stays in current locale

// In components
<Link href="/jobs">Jobs</Link>
```

---

## PLURALIZATION

```json
// messages/en.json
{
  "Customers": {
    "count": "{count, plural, =0 {No customers} =1 {1 customer} other {# customers}}"
  }
}
```

```tsx
t('count', { count: customers.length })
```
