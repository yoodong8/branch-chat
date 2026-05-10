import "./globals.css";

export const metadata = {
  title: "Branch Chat",
  description: "Branching LLM chat for ideation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
