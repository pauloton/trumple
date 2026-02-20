import './globals.css'

export const metadata = {
  title: 'Trump Trouble',
  description: 'Sort the chaos. A weekly Trump timeline puzzle game.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
