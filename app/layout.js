export const metadata = {
  title: "Trumple",
  description: "Sort the chaos. A daily Trump timeline puzzle game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
