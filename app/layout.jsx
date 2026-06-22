export const metadata = {
  title: "English for Success — Learn English. Build Your Future.",
  description: "Seu professor de inglês com IA, 24h. Foco em carreira, imigração e negócios.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0E16",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#0A0E16" }}>{children}</body>
    </html>
  );
}
