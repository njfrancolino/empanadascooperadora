export const metadata = {
  title: 'La Cooperadora 🥟',
  description: 'Gestión de pedidos de empanadas',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#C0512F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
